const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
  openImageFiles: () => ipcRenderer.invoke("system:open-images"),
  saveFile: (payload) => ipcRenderer.invoke("system:save-file", payload),
});
