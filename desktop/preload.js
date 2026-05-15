const { contextBridge, ipcRenderer } = require("electron");

const progressListeners = new Set();

ipcRenderer.on("desktop:scan-progress", (_event, payload) => {
  for (const listener of progressListeners) listener(payload);
});

contextBridge.exposeInMainWorld("galaidDesktop", {
  platform: process.platform,
  selectFolder: () => ipcRenderer.invoke("desktop:select-folder"),
  selectFiles: () => ipcRenderer.invoke("desktop:select-files"),
  launchEntry: (payload) => ipcRenderer.invoke("desktop:launch-entry", payload),
  createShortcut: (payload) => ipcRenderer.invoke("desktop:create-shortcut", payload),
  getLaunchHistory: () => ipcRenderer.invoke("desktop:get-launch-history"),
  onScanProgress(listener) {
    progressListeners.add(listener);
    return () => progressListeners.delete(listener);
  },
});
