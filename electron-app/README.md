# VIBE Desktop

The desktop app loads the VIBE website. An internet connection is required.

## Local development

Run `npm ci`, then `npm start`. For a local web server, set
`VIBE_DESKTOP_URL=http://localhost:3000`. HTTPS is required for non-local addresses.

## Windows test build

Run `npm test`, `npm run build:win`, then `npm run verify:win`.

Distribute the complete `dist/Vibe-Setup-<version>-x64.exe` installer, never the
individual executable inside `win-unpacked`. This project produces an NSIS EXE,
not an MSI. Node.js is bundled and is not required on the recipient's PC.

Installation is per user, with Start menu and desktop shortcuts. The installer
uses its default per-user location; it does not require administrator elevation.
An existing machine-wide installation may need removal by an administrator before
switching to a per-user installation.

## Public release

Configure a trusted Windows signing identity supported by electron-builder, then
run `npm run release:win`. This command requires code signing and verifies both the
installer and the installed executable. Certificates, private keys and signing
credentials must not be committed to Git.

`npm run build:win` can produce an **unsigned test build**. A successful build is
not proof of a valid signature or acceptance by Windows. `npm run verify:win`
reports signature status and writes a JSON report with SHA-256 hashes.

Do not treat an unsigned test installer as a public release. A self-signed
certificate does not establish public publisher trust. Even a properly signed
new release can receive a SmartScreen reputation warning. Distribution through
Microsoft Store is another option that requires its own publisher setup.

Before release, test installation, shortcuts, launch, login, uninstall and upgrade
on a clean Windows standard-user account. This cannot be inferred from a build
on the development machine.

## Diagnostics

Use **Help → Open logs folder** to find `desktop.log`. It records startup and
operational error codes, not visited URLs, cookies or message content. After a
connection error, **Try again** and **View → Reload** retry the VIBE server.

If Windows reports a specific malware name, retain the exact detection and file
hash for investigation. Do not disable Defender or change execution policy as an
installation workaround.
