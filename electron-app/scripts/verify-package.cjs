const assert = require("node:assert/strict");
const path = require("node:path");
const { extractFile } = require("@electron/asar");
const config = require("../package.json");
const archive = path.join(__dirname, "..", "dist", "win-unpacked", "resources", "app.asar");
const packaged = JSON.parse(extractFile(archive, "package.json").toString());
const normalizeVersion = version => version.replace(/-beta\.(\d+(?:\.\d+)*)$/, ".$1");
assert.equal(normalizeVersion(packaged.version), normalizeVersion(config.version));
assert.equal(packaged.main, "src/main.cjs");
for (const file of [packaged.main, "src/runtime.cjs", "assets/icon.png", "assets/connection-error.html", "assets/connection-error.js", "assets/connection-error.css"]) {
  assert.ok(extractFile(archive, file).length, `Missing packaged file: ${file}`);
}
console.log(`PASS: VIBE ${normalizeVersion(packaged.version)} contains its startup code, icon and offline recovery page.`);
