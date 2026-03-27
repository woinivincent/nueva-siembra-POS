import { app, BrowserWindow } from "electron";
import path from "path";
import { initializeDatabase } from "./database/client";
import { registerIpcHandlers } from "./ipc/handlers";


let mainWindow: BrowserWindow | null = null;
console.log("PRELOAD PATH =>", path.join(__dirname, "preload.js"));
console.log("__dirname =>", __dirname);
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !!devUrl || process.env.NODE_ENV === "development";

  if (isDev) {
    mainWindow.loadURL(devUrl || "http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => (mainWindow = null));
}

app.whenReady().then(() => {
  initializeDatabase();
  registerIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
