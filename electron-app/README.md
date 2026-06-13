# Vibe Desktop

Electron desktop wrapper for the Vibe web app.

## Development

```bash
npm install
npm start
```

By default the app opens:

```text
https://vibe-social-network.vercel.app
```

To point it to a local Next.js server:

```bash
VIBE_DESKTOP_URL=http://localhost:3000 npm start
```

On Windows PowerShell:

```powershell
$env:VIBE_DESKTOP_URL="http://localhost:3000"; npm start
```

## Installers

Build on the matching operating system:

```bash
npm run build:win
npm run build:linux
npm run build:mac
```

Artifacts are written to `electron-app/dist`.

macOS DMG builds should be produced on macOS. Windows NSIS builds should be produced on Windows. Linux AppImage/deb builds should be produced on Linux.
