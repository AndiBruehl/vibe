const { app, BrowserWindow, Menu, shell, screen, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { DEFAULT_APP_URL, resolveAppUrl, isWebUrl, windowBounds } = require("./runtime.cjs");

let appUrl = DEFAULT_APP_URL;
let mainWindow = null;
let showingError = false;
let logFile;

function setLoadingProgress(value) {
  if (!mainWindow || mainWindow.isDestroyed() || typeof mainWindow.setProgressBar !== "function") return;
  mainWindow.setProgressBar(value);
}

function log(event, details = {}) {
  // Only operational codes are recorded, never visited URLs, cookies or messages.
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, JSON.stringify({ time: new Date().toISOString(), event, ...details }) + "\n");
  } catch { /* Logging must not prevent the application from starting. */ }
}

function focusWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function loadApp() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  showingError = false;
  void mainWindow.loadURL(appUrl).catch(() => log("navigation-failed"));
}

function showConnectionError(code) {
  if (!mainWindow || mainWindow.isDestroyed() || showingError) return;
  showingError = true;
  void mainWindow.loadFile(path.join(__dirname, "..", "assets", "connection-error.html"), {
    query: { retry: appUrl, code: String(code) },
  }).catch(() => {
    log("error-page-failed");
    dialog.showErrorBox("VIBE could not start", "The application files could not be loaded. Reinstall VIBE using the complete setup package.");
  });
  mainWindow.show();
}

function openWebUrl(url) {
  if (!isWebUrl(url)) return;
  void shell.openExternal(url).catch(() => log("external-browser-failed"));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    ...windowBounds(screen.getPrimaryDisplay().workAreaSize),
    backgroundColor: "#111827",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    show: false,
    title: "Vibe",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      devTools: !app.isPackaged,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });
  if (typeof mainWindow.webContents.getUserAgent === "function" && typeof mainWindow.webContents.setUserAgent === "function") {
    const currentUserAgent = mainWindow.webContents.getUserAgent();
    mainWindow.webContents.setUserAgent(`${currentUserAgent} VibeDesktop/${app.getVersion()}`);
  }
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isWebUrl(url) && new URL(url).origin === new URL(appUrl).origin) {
      showingError = false;
      void mainWindow.loadURL(url).catch(() => log("navigation-failed"));
    } else {
      openWebUrl(url);
    }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isWebUrl(url)) event.preventDefault();
    else showingError = false;
  });
  mainWindow.webContents.on("page-title-updated", event => {
    event.preventDefault();
    mainWindow?.setTitle("Vibe");
  });
  mainWindow.webContents.on("did-fail-load", (_event, code, _description, _url, isMainFrame) => {
    if (!isMainFrame || code === -3) return;
    log("page-load-failed", { code });
    showConnectionError(code);
  });
  mainWindow.webContents.on("did-start-loading", () => {
    if (!showingError) setLoadingProgress(0.55);
  });
  mainWindow.webContents.on("did-stop-loading", () => {
    setLoadingProgress(1);
    setTimeout(() => setLoadingProgress(-1), 180);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    log("renderer-stopped", { reason: details.reason, exitCode: details.exitCode });
    showingError = false;
    showConnectionError(details.exitCode);
  });
  mainWindow.on("unresponsive", () => log("window-unresponsive"));
  loadApp();
}

function createMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === "darwin" ? [{ label: "Vibe", submenu: [
      { role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit" },
    ] }] : []),
    { label: "View", submenu: [
      { label: "Reload", accelerator: "CmdOrCtrl+R", click: () => showingError ? loadApp() : mainWindow?.webContents.reload() },
      { label: "Force reload", accelerator: "CmdOrCtrl+Shift+R", click: () => showingError ? loadApp() : mainWindow?.webContents.reloadIgnoringCache() },
      { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" },
    ] },
    { label: "Window", submenu: [{ role: "minimize" }, { role: "close" }] },
    { label: "Help", submenu: [
      { label: "Open web version", click: () => openWebUrl(appUrl) },
      { label: "Open logs folder", click: () => { void shell.openPath(app.getPath("logs")).then(error => { if (error) log("open-logs-failed"); }); } },
      { label: "About VIBE", click: () => { void dialog.showMessageBox({ type: "info", title: "About VIBE", message: `VIBE ${app.getVersion()}`, detail: `Desktop app · ${process.platform} ${process.arch}` }); } },
    ] },
  ]));
}

// Keep the existing application identity and session directory across upgrades.
app.setName("Vibe");
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", focusWindow);
  app.whenReady().then(() => {
    app.setAppLogsPath();
    logFile = path.join(app.getPath("logs"), "desktop.log");
    try {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      if (fs.existsSync(logFile) && fs.statSync(logFile).size > 1024 * 1024) {
        fs.copyFileSync(logFile, `${logFile}.previous`);
        fs.writeFileSync(logFile, "");
      }
    } catch { /* Continue without a log file if the directory is unavailable. */ }
    log("startup", { version: app.getVersion(), platform: process.platform, arch: process.arch });
    try { appUrl = resolveAppUrl(process.env.VIBE_DESKTOP_URL || DEFAULT_APP_URL); }
    catch {
      log("invalid-app-url");
      dialog.showErrorBox("Invalid VIBE address", "VIBE_DESKTOP_URL must be a valid HTTPS address. Remove the override to use the default VIBE server.");
      app.quit();
      return;
    }
    if (process.platform === "win32") app.setAppUserModelId("com.vibe.desktop");
    createMenu();
    createWindow();
    app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else focusWindow(); });
  }).catch(() => {
    log("startup-failed");
    dialog.showErrorBox("VIBE could not start", "Try restarting the app. If this persists, reinstall VIBE using the complete setup package.");
    app.quit();
  });
  app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
}
