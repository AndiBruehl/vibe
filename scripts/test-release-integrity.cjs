const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { statSync, createReadStream } = require("node:fs");
const { join } = require("node:path");
const manifest = require("../public/releases/latest.json");

function sha256(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", chunk => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex").toUpperCase()));
  });
}

for (const [platform, relativePath] of [
  ["android", "android-app/dist/Vibe-BETA-0.4.1.apk"],
  ["windows", "electron-app/dist/Vibe-Setup-BETA-0.4.1-x64.exe"],
]) {
  test(`${platform} manifest integrity matches the local artifact`, async () => {
    const artifact = join(process.cwd(), relativePath);
    assert.equal(statSync(artifact).size, manifest[platform].sizeBytes);
    assert.equal(await sha256(artifact), manifest[platform].sha256);
  });
}
