const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { scanSelectedPaths } = require("./scanner");
const { buildLaunchAllowlist, createShortcutForAllowedEntry, launchAllowedEntry } = require("./launcher");

const launchAllowlists = new Map();
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
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    title: "Choose a visual novel folder",
    properties: ["openDirectory"],
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true, files: [] };
  return scanForRenderer(result.filePaths, event.sender);
});

ipcMain.handle("desktop:select-files", async (event) => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    title: "Choose visual novel files",
    properties: ["openFile", "multiSelections"],
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true, files: [] };
  return scanForRenderer(result.filePaths, event.sender);
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

ipcMain.handle("desktop:get-launch-history", () => getPublicLaunchHistory());

async function scanForRenderer(selectedPaths, webContents) {
  const result = await scanSelectedPaths(selectedPaths, (progress) => {
    webContents.send("desktop:scan-progress", progress);
  });
  rememberLaunchAllowlist(webContents, result.files);
  return {
    canceled: false,
    files: result.files,
    meta: {
      selectedCount: selectedPaths.length,
      skipped: result.skipped,
      platform: process.platform,
    },
  };
}

function rememberLaunchAllowlist(webContents, files) {
  launchAllowlists.set(webContents.id, buildLaunchAllowlist(files));
  if (cleanupRegisteredWebContents.has(webContents.id)) return;

  cleanupRegisteredWebContents.add(webContents.id);
  webContents.once("destroyed", () => {
    launchAllowlists.delete(webContents.id);
    cleanupRegisteredWebContents.delete(webContents.id);
  });
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

function stripShortcutExt(filename) {
  return path.basename(filename || "GalAid launch", path.extname(filename || ""));
}
