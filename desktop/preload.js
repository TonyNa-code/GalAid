const { contextBridge, ipcRenderer } = require("electron");

const progressListeners = new Set();

ipcRenderer.on("desktop:scan-progress", (_event, payload) => {
  for (const listener of progressListeners) listener(payload);
});

contextBridge.exposeInMainWorld("galaidDesktop", {
  platform: process.platform,
  selectFolder: () => ipcRenderer.invoke("desktop:select-folder"),
  selectFiles: () => ipcRenderer.invoke("desktop:select-files"),
  onScanProgress(listener) {
    progressListeners.add(listener);
    return () => progressListeners.delete(listener);
  },
});
