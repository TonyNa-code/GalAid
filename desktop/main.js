const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const { scanSelectedPaths } = require("./scanner");
const { buildLaunchAllowlist, launchAllowedEntry } = require("./launcher");

const launchAllowlists = new Map();
const cleanupRegisteredWebContents = new Set();

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

app.whenReady().then(() => {
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
    return result;
  } catch (error) {
    return {
      ok: false,
      errorCode: "launch-failed",
      message: error?.message || "Launch failed.",
    };
  }
});

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
