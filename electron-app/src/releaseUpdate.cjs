const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:\.\d+)?$/;
const SHA256_PATTERN = /^[a-f\d]{64}$/i;

function isValidDesktopUpdateRelease(release) {
  if (!release || typeof release !== "object" ||
    typeof release.version !== "string" || !VERSION_PATTERN.test(release.version) ||
    typeof release.downloadUrl !== "string" || typeof release.sha256 !== "string" || !SHA256_PATTERN.test(release.sha256) ||
    !Number.isSafeInteger(release.sizeBytes) || release.sizeBytes <= 0) return false;

  try {
    const url = new URL(release.downloadUrl);
    return url.protocol === "https:" && url.hostname === "raw.githubusercontent.com" &&
      url.username === "" && url.password === "" && url.port === "" && url.search === "" && url.hash === "" &&
      url.pathname === `/AndiBruehl/vibe/main/electron-app/dist/Vibe-Setup-BETA-${release.version}-x64.exe`;
  } catch {
    return false;
  }
}

module.exports = { isValidDesktopUpdateRelease };
