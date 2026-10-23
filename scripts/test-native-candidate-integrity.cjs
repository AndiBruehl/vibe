const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { statSync, createReadStream } = require("node:fs");
const { basename, join } = require("node:path");
const candidate = require("../docs/releases/0.5.1-candidate.json");

function sha256(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path).on("data", chunk => hash.update(chunk))
      .on("error", reject).on("end", () => resolve(hash.digest("hex").toUpperCase()));
  });
}

for (const platform of ["android", "windows"]) {
  test(`0.5.1 local ${platform} candidate matches recorded size and SHA-256`, async () => {
    const filename = basename(new URL(candidate[platform].downloadUrl).pathname);
    const artifact = join(process.cwd(), platform === "android" ? "android-app/dist" : "electron-app/dist", filename);
    assert.equal(candidate[platform].version, candidate.version);
    assert.equal(statSync(artifact).size, candidate[platform].sizeBytes);
    assert.equal(await sha256(artifact), candidate[platform].sha256);
  });
}
