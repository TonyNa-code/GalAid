const { contextBridge, ipcRenderer } = require("electron");

const progressListeners = new Set();
const prepareProgressListeners = new Set();
const ocrProgressListeners = new Set();

ipcRenderer.on("desktop:scan-progress", (_event, payload) => {
  for (const listener of progressListeners) listener(payload);
});

ipcRenderer.on("desktop:prepare-progress", (_event, payload) => {
  for (const listener of prepareProgressListeners) listener(payload);
});

ipcRenderer.on("desktop:ocr-progress", (_event, payload) => {
  for (const listener of ocrProgressListeners) listener(payload);
});

contextBridge.exposeInMainWorld("galaidDesktop", {
  platform: process.platform,
  selectFolder: () => ipcRenderer.invoke("desktop:select-folder"),
  selectFiles: () => ipcRenderer.invoke("desktop:select-files"),
  launchEntry: (payload) => ipcRenderer.invoke("desktop:launch-entry", payload),
  createShortcut: (payload) => ipcRenderer.invoke("desktop:create-shortcut", payload),
  preparePackage: (payload) => ipcRenderer.invoke("desktop:prepare-package", payload),
  unmountImage: (payload) => ipcRenderer.invoke("desktop:unmount-image", payload),
  getLaunchHistory: () => ipcRenderer.invoke("desktop:get-launch-history"),
  recognizeErrorImage: () => ipcRenderer.invoke("desktop:recognize-error-image"),
  onScanProgress(listener) {
    progressListeners.add(listener);
    return () => progressListeners.delete(listener);
  },
  onPrepareProgress(listener) {
    prepareProgressListeners.add(listener);
    return () => prepareProgressListeners.delete(listener);
  },
  onOcrProgress(listener) {
    ocrProgressListeners.add(listener);
    return () => ocrProgressListeners.delete(listener);
  },
});
