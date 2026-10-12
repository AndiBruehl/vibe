const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { statSync, createReadStream } = require("node:fs");
const { basename, join } = require("node:path");
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

const artifactRoots = {
  android: "android-app/dist",
  windows: "electron-app/dist",
};

for (const platform of ["android", "windows"]) {
  test(`${platform} manifest integrity matches the local artifact`, async () => {
    const filename = basename(new URL(manifest[platform].downloadUrl).pathname);
    const artifact = join(process.cwd(), artifactRoots[platform], filename);
    assert.equal(statSync(artifact).size, manifest[platform].sizeBytes);
    assert.equal(await sha256(artifact), manifest[platform].sha256);
  });
}
