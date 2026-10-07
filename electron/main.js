import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

const IMAGE_MIME_TYPES = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function imageMimeType(filePath) {
  return IMAGE_MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function safeFilename(filename, mimeType) {
  const fallbackExtension = mimeType === "image/png" ? ".png" : ".jpg";
  const base = path.basename(String(filename || `photo-cut${fallbackExtension}`));
  return base.includes(".") ? base : `${base}${fallbackExtension}`;
}

function registerSystemFileHandlers() {
  ipcMain.handle("system:open-images", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择图片",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "图片", extensions: Object.keys(IMAGE_MIME_TYPES).map((ext) => ext.slice(1)) }],
    });
    if (result.canceled) return [];

    const files = await Promise.all(
      result.filePaths.map(async (filePath) => {
        const buffer = await fs.readFile(filePath);
        return {
          name: path.basename(filePath),
          type: imageMimeType(filePath),
          size: buffer.byteLength,
          lastModified: (await fs.stat(filePath)).mtimeMs,
          data: buffer.toString("base64"),
        };
      })
    );
    return files;
  });

  ipcMain.handle("system:save-file", async (_event, payload = {}) => {
    if (!(payload.data instanceof ArrayBuffer) && !ArrayBuffer.isView(payload.data)) {
      throw new TypeError("无效的文件数据");
    }
    const mimeType = String(payload.mimeType || "application/octet-stream");
    const result = await dialog.showSaveDialog({
      title: "保存文件",
      defaultPath: safeFilename(payload.filename, mimeType),
      filters: [{ name: mimeType === "image/png" ? "PNG 图片" : "JPG 图片", extensions: [mimeType === "image/png" ? "png" : "jpg"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };

    const view = payload.data instanceof ArrayBuffer ? new Uint8Array(payload.data) : new Uint8Array(payload.data.buffer, payload.data.byteOffset, payload.data.byteLength);
    await fs.writeFile(result.filePath, Buffer.from(view));
    return { canceled: false, filePath: result.filePath };
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: "photo-cut",
    backgroundColor: "#0f1115",
    icon: path.join(__dirname, "../icon/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

const menuTemplate = [
  {
    label: "文件",
    submenu: [
      { role: "quit", label: "退出" },
    ],
  },
  {
    label: "编辑",
    submenu: [
      { role: "undo", label: "撤销" },
      { role: "redo", label: "重做" },
      { type: "separator" },
      { role: "cut", label: "剪切" },
      { role: "copy", label: "复制" },
      { role: "paste", label: "粘贴" },
    ],
  },
  {
    label: "视图",
    submenu: [
      { role: "reload", label: "刷新" },
      { role: "toggleDevTools", label: "开发者工具" },
      { type: "separator" },
      { role: "resetZoom", label: "重置缩放" },
      { role: "zoomIn", label: "放大" },
      { role: "zoomOut", label: "缩小" },
      { type: "separator" },
      { role: "togglefullscreen", label: "全屏" },
    ],
  },
  {
    label: "帮助",
    submenu: [
      {
        label: "关于",
        click: () => {
          dialog.showMessageBox({
            title: "关于 photo-cut",
            message: "photo-cut v1.0.0",
            detail: "本地照片拼贴工具\n照片仅在本机处理，不上传网络。",
          });
        },
      },
    ],
  },
];

app.whenReady().then(() => {
  registerSystemFileHandlers();
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
