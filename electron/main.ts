import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { initializeDatabase } from "./database/client";
import { registerIpcHandlers } from "./ipc/handlers";


let mainWindow: BrowserWindow | null = null;
console.log("PRELOAD PATH =>", path.join(__dirname, "preload.js"));
console.log("__dirname =>", __dirname);
function createWindow() {
  // La ventana no puede abrir más grande que la pantalla: 1400x900 no entra en
  // un monitor de 1366x768 ni en uno de 1024x768. Se toma el área de trabajo
  // (descontando la barra de tareas) y se usa el tamaño preferido o el máximo
  // disponible, lo que sea menor.
  const { width: anchoUtil, height: altoUtil } = screen.getPrimaryDisplay().workAreaSize;
  const ancho = Math.min(1400, anchoUtil);
  const alto = Math.min(900, altoUtil);

  mainWindow = new BrowserWindow({
    width: ancho,
    height: alto,
    // Por debajo de esto el POS deja de ser usable
    minWidth: 1000,
    minHeight: 700,
    // En pantallas chicas conviene arrancar maximizada
    ...(anchoUtil <= 1366 ? { center: true } : {}),
    // Vite copia public/ dentro de dist/, que es lo que se empaqueta
    icon: path.join(__dirname, "../dist/icon.ico"),
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
