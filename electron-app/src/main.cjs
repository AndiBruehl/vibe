const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("node:path");

const DEFAULT_APP_URL = "https://vibe-social-network.vercel.app";
const appUrl = process.env.VIBE_DESKTOP_URL || DEFAULT_APP_URL;

let mainWindow = null;

function isSameOrigin(url) {
  return new URL(url).origin === new URL(appUrl).origin;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    backgroundColor: "#0f172a",
    height: 900,
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    minHeight: 700,
    minWidth: 1100,
    show: false,
    title: "Vibe",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      contextIsolation: true,
      devTools: !app.isPackaged,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false
    },
    width: 1280
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSameOrigin(url)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("page-title-updated", (event) => {
    event.preventDefault();
    mainWindow.setTitle("Vibe");
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!isMainFrame || errorCode === -3) {
      return;
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Vibe</title>
          <style>
            body {
              align-items: center;
              background: #0f172a;
              color: #f8fafc;
              display: flex;
              font-family: Arial, sans-serif;
              height: 100vh;
              justify-content: center;
              margin: 0;
            }
            main {
              max-width: 440px;
              text-align: center;
            }
            h1 {
              font-size: 28px;
              margin-bottom: 12px;
            }
            p {
              color: #cbd5e1;
              line-height: 1.5;
            }
            button {
              background: #ef4444;
              border: 0;
              border-radius: 8px;
              color: white;
              cursor: pointer;
              font-size: 15px;
              font-weight: 700;
              margin-top: 16px;
              padding: 12px 18px;
            }
          </style>
        </head>
        <body>
          <main>
            <h1>Vibe could not be loaded</h1>
            <p>${errorDescription} (${errorCode})</p>
            <button onclick="location.reload()">Try again</button>
          </main>
        </body>
      </html>
    `;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });

  mainWindow.loadURL(appUrl);
}

function createMenu() {
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: "Vibe",
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" }
            ]
          }
        ]
      : []),
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  app.setName("Vibe");

  if (process.platform === "win32") {
    app.setAppUserModelId("com.vibe.desktop");
  }

  createMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
