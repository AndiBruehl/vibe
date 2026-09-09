const { app, BrowserWindow, Menu, shell, screen, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { DEFAULT_APP_URL, resolveAppUrl, isWebUrl, windowBounds } = require("./runtime.cjs");

let appUrl = DEFAULT_APP_URL;
let mainWindow = null;
let showingError = false;
let logFile;
let updateCheckStarted = false;

const RELEASE_MANIFEST_URL = "https://raw.githubusercontent.com/AndiBruehl/vibe/main/public/releases/latest.json";

function compareVersions(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

async function getLatestDesktopRelease() {
  if (typeof fetch !== "function") return null;
  try {
    const response = await fetch(`${RELEASE_MANIFEST_URL}?v=${encodeURIComponent(app.getVersion())}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`release-manifest-${response.status}`);
    const manifest = await response.json();
    const release = manifest?.windows;
    if (typeof release?.version !== "string" || typeof release?.downloadUrl !== "string") throw new Error("invalid-release-manifest");
    return release;
  } catch {
    log("update-check-failed");
    return null;
  }
}

async function checkForUpdates({ interactive = false } = {}) {
  const release = await getLatestDesktopRelease();
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (!release) {
    if (interactive) showWebDialog({
      eyebrow: "VIBE DESKTOP",
      title: "Update check unavailable",
      message: "VIBE could not check for updates right now.",
      detail: "Please check your connection and try again shortly.",
    });
    return;
  }
  if (compareVersions(release.version, app.getVersion()) <= 0) {
    if (interactive) showWebDialog({
      eyebrow: "VIBE DESKTOP",
      title: "You’re up to date",
      message: `VIBE ${app.getVersion()} is the latest desktop version.`,
      detail: "We’ll let you know when a new update is ready.",
    });
    return;
  }
  showWebDialog({
    eyebrow: "VIBE UPDATE",
    title: "Update available",
    message: `Version ${release.version} is ready to download.`,
    detail: `You’re currently using version ${app.getVersion()}.`,
    downloadUrl: release.downloadUrl,
    primaryLabel: "Download update",
  });
}

function showWebDialog({ eyebrow = "VIBE", title, message, detail, downloadUrl, primaryLabel = "Close" }) {
  if (!mainWindow || mainWindow.isDestroyed() || typeof mainWindow.webContents.executeJavaScript !== "function") return;
  const payload = JSON.stringify({ eyebrow, title, message, detail, downloadUrl, primaryLabel });
  const script = `(() => {
    const existing = document.getElementById("vibe-desktop-dialog");
    if (existing) existing.remove();
    const payload = ${payload};
    const overlay = document.createElement("div");
    overlay.id = "vibe-desktop-dialog";
    overlay.setAttribute("role", "presentation");
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.48);backdrop-filter:blur(5px);font-family:inherit";
    const panel = document.createElement("section");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.style.cssText = "width:min(440px,100%);border:1px solid color-mix(in srgb,var(--ig-text,#24456b) 18%,transparent);border-radius:20px;overflow:hidden;background:var(--ig-surface-bg,#fff);color:var(--ig-text,#24456b);box-shadow:0 22px 60px rgba(15,23,42,.32)";
    const body = document.createElement("div");
    body.style.cssText = "padding:25px 26px 23px";
    const eyebrow = document.createElement("p");
    eyebrow.textContent = payload.eyebrow;
    eyebrow.style.cssText = "margin:0 0 7px;color:var(--ig-orange,#e6ad4d);font-size:11px;font-weight:800;letter-spacing:.11em";
    const heading = document.createElement("h2");
    heading.textContent = payload.title;
    heading.style.cssText = "margin:0;color:inherit;font-size:24px;line-height:1.2;font-weight:800";
    const message = document.createElement("p");
    message.textContent = payload.message;
    message.style.cssText = "margin:13px 0 0;color:inherit;font-size:15px;font-weight:650;line-height:1.5";
    const detail = document.createElement("p");
    detail.textContent = payload.detail;
    detail.style.cssText = "margin:7px 0 0;color:var(--ig-text-muted,#54779a);font-size:13px;line-height:1.5";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:10px;margin-top:23px";
    const close = () => overlay.remove();
    const later = document.createElement("button");
    later.type = "button";
    later.textContent = payload.downloadUrl ? "Later" : "Close";
    later.onclick = close;
    later.style.cssText = "min-height:40px;padding:0 16px;border:1px solid color-mix(in srgb,var(--ig-text,#24456b) 22%,transparent);border-radius:10px;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:750;cursor:pointer";
    actions.append(later);
    if (payload.downloadUrl) {
      const download = document.createElement("button");
      download.type = "button";
      download.textContent = payload.primaryLabel;
      download.onclick = () => { window.open(payload.downloadUrl, "_blank", "noopener"); close(); };
      download.style.cssText = "min-height:40px;padding:0 17px;border:0;border-radius:10px;background:linear-gradient(135deg,var(--ig-orange,#e6ad4d),var(--ig-red,#cf2142));color:#fff;font:inherit;font-size:13px;font-weight:800;box-shadow:0 8px 18px rgba(207,33,66,.22);cursor:pointer";
      actions.append(download);
    }
    body.append(eyebrow, heading, message, detail, actions);
    panel.append(body);
    overlay.append(panel);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.body.append(overlay);
  })();`;
  void mainWindow.webContents.executeJavaScript(script).catch(() => log("dialog-render-failed"));
}

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
  mainWindow.webContents.on("did-finish-load", () => {
    if (!updateCheckStarted && !showingError) {
      updateCheckStarted = true;
      void checkForUpdates();
    }
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
      { label: "Check for updates", click: () => { void checkForUpdates({ interactive: true }); } },
      { label: "Open logs folder", click: () => { void shell.openPath(app.getPath("logs")).then(error => { if (error) log("open-logs-failed"); }); } },
      { label: "About VIBE", click: () => showWebDialog({ eyebrow: "VIBE DESKTOP", title: "About VIBE", message: `VIBE ${app.getVersion()}`, detail: `Desktop app · ${process.platform} ${process.arch}` }) },
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
