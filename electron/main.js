const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: "光房拼贴 — Collage Lab",
    backgroundColor: "#0f1115",
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
          const { dialog } = require("electron");
          dialog.showMessageBox({
            title: "关于 光房拼贴",
            message: "光房拼贴 — Collage Lab v1.0.0",
            detail: "本地照片拼贴工具\n照片仅在本机处理，不上传网络。",
          });
        },
      },
    ],
  },
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
