"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const client_1 = require("./database/client");
const handlers_1 = require("./ipc/handlers");
let mainWindow = null;
console.log("PRELOAD PATH =>", path_1.default.join(__dirname, "preload.js"));
console.log("__dirname =>", __dirname);
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    const isDev = !!devUrl || process.env.NODE_ENV === "development";
    if (isDev) {
        mainWindow.loadURL(devUrl || "http://localhost:5173");
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, "../dist/index.html"));
    }
    mainWindow.on("closed", () => (mainWindow = null));
}
electron_1.app.whenReady().then(() => {
    (0, client_1.initializeDatabase)();
    (0, handlers_1.registerIpcHandlers)();
    createWindow();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
