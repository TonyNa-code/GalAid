const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { scanSelectedPaths } = require("./scanner");
const { buildLaunchAllowlist, createShortcutForAllowedEntry, launchAllowedEntry } = require("./launcher");
const { isPrepareSupportedPackage, prepareLocalPackage, unmountIsoImage } = require("./package-prep");
const { recognizeErrorImage } = require("./ocr");

const launchAllowlists = new Map();
const packageAllowlists = new Map();
const mountedImageAllowlists = new Map();
const cleanupRegisteredWebContents = new Set();
const LAUNCH_HISTORY_LIMIT = 20;
let launchHistory = [];

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 680,
    title: "GalAid",
    backgroundColor: "#f4f7f2",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window.loadFile(path.join(__dirname, "..", "index.html"));
  if (process.env.GALAID_SMOKE_EXIT === "1") {
    window.webContents.once("did-finish-load", () => {
      app.quit();
    });
  }
}

app.whenReady().then(async () => {
  launchHistory = await readLaunchHistory();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("desktop:select-folder", async (event) => {
  try {
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: "Choose a visual novel folder",
      properties: ["openDirectory"],
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true, files: [] };
    return scanForRenderer(result.filePaths, event.sender);
  } catch (error) {
    return makeScanError(error);
  }
});

ipcMain.handle("desktop:select-files", async (event) => {
  try {
    const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
      title: "Choose visual novel files",
      properties: ["openFile", "multiSelections"],
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true, files: [] };
    return scanForRenderer(result.filePaths, event.sender);
  } catch (error) {
    return makeScanError(error);
  }
});

ipcMain.handle("desktop:scan-paths", async (event, payload = {}) => {
  try {
    const selectedPaths = getSelectedPaths(payload.paths);
    if (!selectedPaths.length) return { canceled: true, files: [] };
    return scanForRenderer(selectedPaths, event.sender, {
      selectedCount: selectedPaths.length,
      source: "drop",
    });
  } catch (error) {
    return makeScanError(error);
  }
});

ipcMain.handle("desktop:launch-entry", async (event, payload = {}) => {
  try {
    const result = await launchAllowedEntry({
      allowlist: launchAllowlists.get(event.sender.id),
      entryFullPath: payload.entryFullPath,
    });
    if (result.ok) {
      try {
        await recordLaunchHistory(result);
      } catch {
        // Launch history is a local convenience; a write failure should not turn a successful launch into an error.
      }
    }
    return result;
  } catch (error) {
    return {
      ok: false,
      errorCode: "launch-failed",
      message: error?.message || "Launch failed.",
    };
  }
});

ipcMain.handle("desktop:create-shortcut", async (event, payload = {}) => {
  if (process.platform !== "win32") return { ok: false, errorCode: "unsupported-platform" };
  const allowlist = launchAllowlists.get(event.sender.id);
  const entry = allowlist?.get(path.resolve(payload.entryFullPath || ""));
  if (!entry) return { ok: false, errorCode: "not-allowed" };

  const window = BrowserWindow.fromWebContents(event.sender);
  const defaultPath = path.join(app.getPath("desktop"), `${stripShortcutExt(entry.entryName)}.lnk`);
  const saveResult = await dialog.showSaveDialog(window, {
    title: "Create GalAid launch shortcut",
    defaultPath,
    filters: [{ name: "Windows Shortcut", extensions: ["lnk"] }],
  });
  if (saveResult.canceled || !saveResult.filePath) return { ok: false, errorCode: "canceled" };

  try {
    return await createShortcutForAllowedEntry({
      allowlist,
      entryFullPath: payload.entryFullPath,
      shortcutPath: saveResult.filePath,
      writeShortcutLinkImpl: (...args) => shell.writeShortcutLink(...args),
    });
  } catch (error) {
    return {
      ok: false,
      errorCode: "shortcut-failed",
      message: error?.message || "Shortcut creation failed.",
    };
  }
});

ipcMain.handle("desktop:prepare-package", async (event, payload = {}) => {
  const allowlist = packageAllowlists.get(event.sender.id);
  const packageFullPath = path.resolve(payload.packageFullPath || "");
  const packageFile = allowlist?.get(packageFullPath);
  if (!packageFile) return { ok: false, errorCode: "not-allowed", message: "Package was not part of the trusted scan." };

  const window = BrowserWindow.fromWebContents(event.sender);
  let outputParentDirectory = path.dirname(packageFullPath);
  if (payload.outputMode !== "auto") {
    const outputParentResult = await dialog.showOpenDialog(window, {
      title: "Choose where GalAid should prepare this package",
      defaultPath: path.dirname(packageFullPath),
      properties: ["openDirectory", "createDirectory"],
    });
    if (outputParentResult.canceled || !outputParentResult.filePaths.length) {
      return { ok: false, errorCode: "canceled" };
    }
    outputParentDirectory = outputParentResult.filePaths[0];
  }

  try {
    const outputDirectory = await makeUniqueOutputDirectory(outputParentDirectory, packageFile.name);
    const prepareResult = await prepareLocalPackage({
      packagePath: packageFullPath,
      outputDirectory,
      password: String(payload.password || ""),
      onProgress: (progress) => {
        event.sender.send("desktop:prepare-progress", progress);
      },
    });

    if (!prepareResult.ok) return prepareResult;
    const scanPath = prepareResult.scanPath || outputDirectory;
    if (prepareResult.mounted) {
      rememberMountedImage(event.sender, {
        imagePath: prepareResult.packagePath,
        mountPath: prepareResult.scanPath,
      });
    }
    const scanResult = await scanForRenderer([scanPath], event.sender, {
      selectedCount: 1,
      preparedFrom: packageFile.path,
      preparedOutputName: path.basename(scanPath),
      preparedKind: prepareResult.mounted ? "mounted-image" : prepareResult.imageExtracted ? "extracted-image" : "extracted-archive",
      mountedImageDrive: prepareResult.mounted ? prepareResult.scanPath : "",
      mountedImageTool: prepareResult.mounted ? prepareResult.tool : "",
      platform: process.platform,
    });
    return {
      ...prepareResult,
      files: scanResult.files,
      meta: scanResult.meta,
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: "prepare-failed",
      message: error?.message || "Package preparation failed.",
    };
  }
});

ipcMain.handle("desktop:unmount-image", async (event, payload = {}) => {
  if (process.platform !== "win32") return { ok: false, errorCode: "unsupported-platform" };

  const key = getMountedImageKey(payload.mountedImageDrive || payload.mountPath || payload.scanPath);
  const mounted = key ? mountedImageAllowlists.get(event.sender.id)?.get(key) : null;
  if (!mounted) return { ok: false, errorCode: "not-allowed", message: "Mounted image was not part of this GalAid session." };

  try {
    const result = await unmountIsoImage(mounted.imagePath);
    if (result.ok) {
      mountedImageAllowlists.get(event.sender.id)?.delete(key);
      return {
        ...result,
        mountedImageDrive: mounted.mountPath,
        mountedImageName: path.basename(mounted.imagePath),
      };
    }
    return result;
  } catch (error) {
    return {
      ok: false,
      errorCode: "unmount-failed",
      message: error?.message || "Could not unmount the image.",
    };
  }
});

ipcMain.handle("desktop:get-launch-history", () => getPublicLaunchHistory());

ipcMain.handle("desktop:recognize-error-image", async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(window, {
    title: "Choose an error screenshot",
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "bmp", "webp", "tif", "tiff"] },
    ],
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };

  try {
    return await recognizeErrorImage(result.filePaths[0], {
      cachePath: path.join(app.getPath("userData"), "ocr-cache"),
      onProgress: (progress) => {
        event.sender.send("desktop:ocr-progress", progress);
      },
    });
  } catch (error) {
    return {
      ok: false,
      errorCode: "ocr-failed",
      message: error?.message || "OCR failed.",
    };
  }
});

async function scanForRenderer(selectedPaths, webContents, metaOverrides = {}) {
  const result = await scanSelectedPaths(selectedPaths, (progress) => {
    webContents.send("desktop:scan-progress", progress);
  });
  rememberScanAllowlists(webContents, result.files);
  return {
    canceled: false,
    files: result.files,
    meta: {
      selectedCount: selectedPaths.length,
      skipped: result.skipped,
      platform: process.platform,
      ...metaOverrides,
    },
  };
}

function makeScanError(error) {
  return {
    ok: false,
    errorCode: "scan-failed",
    message: error?.message || "Desktop scan failed.",
    files: [],
  };
}

function rememberScanAllowlists(webContents, files) {
  launchAllowlists.set(webContents.id, buildLaunchAllowlist(files));
  packageAllowlists.set(webContents.id, buildPackageAllowlist(files));
  if (cleanupRegisteredWebContents.has(webContents.id)) return;

  cleanupRegisteredWebContents.add(webContents.id);
  webContents.once("destroyed", () => {
    launchAllowlists.delete(webContents.id);
    packageAllowlists.delete(webContents.id);
    mountedImageAllowlists.delete(webContents.id);
    cleanupRegisteredWebContents.delete(webContents.id);
  });
}

function rememberMountedImage(webContents, mounted) {
  const key = getMountedImageKey(mounted?.mountPath);
  if (!key || !mounted?.imagePath) return;
  const allowlist = mountedImageAllowlists.get(webContents.id) || new Map();
  allowlist.set(key, {
    imagePath: path.resolve(mounted.imagePath),
    mountPath: mounted.mountPath,
  });
  mountedImageAllowlists.set(webContents.id, allowlist);
}

function getSelectedPaths(paths) {
  if (!Array.isArray(paths)) return [];
  const seen = new Set();
  const selected = [];
  for (const rawPath of paths) {
    const value = String(rawPath || "").trim();
    if (!value) continue;
    const resolved = path.resolve(value);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    selected.push(resolved);
    if (selected.length >= 1000) break;
  }
  return selected;
}

function getMountedImageKey(value) {
  return String(value || "").trim().replace(/\//g, "\\").replace(/\\+$/, "\\").toLowerCase();
}

function buildPackageAllowlist(files) {
  const allowlist = new Map();
  for (const file of files || []) {
    if (!file?.fullPath || !isPrepareSupportedPackage(file.fullPath)) continue;
    allowlist.set(path.resolve(file.fullPath), file);
  }
  return allowlist;
}

async function readLaunchHistory() {
  try {
    const text = await fs.readFile(getLaunchHistoryPath(), "utf8");
    const parsed = JSON.parse(text);
    return Array.isArray(parsed?.items) ? sanitizeLaunchHistory(parsed.items) : [];
  } catch {
    return [];
  }
}

async function recordLaunchHistory(result) {
  const item = {
    entryName: result.entryName,
    relativePath: result.relativePath,
    workingDirectoryName: path.basename(result.workingDirectory || ""),
    launchedAt: new Date().toISOString(),
  };
  launchHistory = sanitizeLaunchHistory([item, ...launchHistory]);
  await fs.mkdir(path.dirname(getLaunchHistoryPath()), { recursive: true });
  await fs.writeFile(getLaunchHistoryPath(), JSON.stringify({ schema: "galaid.launchHistory.v1", items: launchHistory }, null, 2));
}

function sanitizeLaunchHistory(items) {
  const seen = new Set();
  const sanitized = [];
  for (const item of items || []) {
    if (!item?.entryName || !item?.relativePath || !item?.launchedAt) continue;
    const key = `${item.relativePath}\0${item.entryName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sanitized.push({
      entryName: String(item.entryName).slice(0, 180),
      relativePath: String(item.relativePath).slice(0, 500),
      workingDirectoryName: String(item.workingDirectoryName || "").slice(0, 180),
      launchedAt: String(item.launchedAt).slice(0, 64),
    });
    if (sanitized.length >= LAUNCH_HISTORY_LIMIT) break;
  }
  return sanitized;
}

function getPublicLaunchHistory() {
  return launchHistory.map((item) => ({ ...item }));
}

function getLaunchHistoryPath() {
  return path.join(app.getPath("userData"), "launch-history.json");
}

async function makeUniqueOutputDirectory(parentDirectory, packageName) {
  const safeBase = stripPackageExt(stripUnsafePathChars(packageName || "GalAid-package")) || "GalAid-package";
  let candidate = path.join(parentDirectory, `${safeBase}-prepared`);
  for (let index = 2; index < 200; index += 1) {
    if (await pathExists(candidate)) {
      candidate = path.join(parentDirectory, `${safeBase}-prepared-${index}`);
      continue;
    }
    return candidate;
  }
  throw new Error("Could not create a unique output folder.");
}

async function pathExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function stripUnsafePathChars(value) {
  return path.basename(String(value || "")).replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 120);
}

function stripPackageExt(filename) {
  return String(filename || "")
    .replace(/\.(zip|rar|7z)$/i, "")
    .replace(/\.(zip|7z)\.001$/i, "")
    .replace(/\.part0*1\.rar$/i, "")
    .replace(/\.(iso|cue|bin|mdf|mds|ccd|img|nrg|sub|isz|cdi|bwt|bwi|bws|bwa|b5t|b5i|b6t|b6i|mdx|daa|uif|pdi)$/i, "");
}

function stripShortcutExt(filename) {
  return path.basename(filename || "GalAid launch", path.extname(filename || ""));
}
