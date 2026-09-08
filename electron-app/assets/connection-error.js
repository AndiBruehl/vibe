const params = new URLSearchParams(window.location.search);
const retry = document.getElementById("retry");
const destination = params.get("retry");
if (destination) {
  try {
    const url = new URL(destination);
    if (["http:", "https:"].includes(url.protocol)) retry.href = url.toString();
  } catch { /* Leave the link inactive for an invalid URL. */ }
}
const code = Number(params.get("code"));
document.getElementById("detail").textContent = Number.isFinite(code) && code !== 0 ? `Connection error ${code}` : "";
