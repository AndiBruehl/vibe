const DEFAULT_APP_URL = "https://vibe-social-network.vercel.app";

function resolveAppUrl(value = DEFAULT_APP_URL) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("VIBE_DESKTOP_URL must use HTTPS (HTTP is allowed for localhost).");
  }
  return url.toString();
}

function isWebUrl(value) {
  try { return ["https:", "http:"].includes(new URL(value).protocol); }
  catch { return false; }
}

function windowBounds(workArea) {
  return {
    width: Math.min(1280, workArea.width),
    height: Math.min(900, workArea.height),
    minWidth: Math.min(640, workArea.width),
    minHeight: Math.min(480, workArea.height),
  };
}

module.exports = { DEFAULT_APP_URL, resolveAppUrl, isWebUrl, windowBounds };
