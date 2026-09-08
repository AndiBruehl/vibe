const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, Intl, require: name => {
    assert.ok(name in mocks); return mocks[name];
  } });
  return exports;
}
const ordering = load("src/profile-directory-order.ts");
const profiles = [
  { id: "000000000000000000000002", name: "zoe", username: "z" },
  { id: "000000000000000000000003", name: "Alice", username: "a" },
  { id: "000000000000000000000001", name: null, username: "Bob" },
];
test("all four profile sorts include every profile with a display-name fallback", () => {
  for (const [sort, expected] of [["newest", ["a", "z", "Bob"]], ["oldest", ["Bob", "z", "a"]], ["az", ["a", "Bob", "z"]], ["za", ["z", "Bob", "a"]]]) {
    assert.deepEqual(Array.from(ordering.sortProfiles(profiles, sort), p => p.username), expected);
  }
  assert.equal(profiles[0].username, "z");
});
test("directory searches only public names/subtitles and never selects email", async () => {
  let query;
  const { getProfileDirectory } = load("src/profile-directory.ts", {
    "@/db": { prisma: { profile: { findMany: async input => { query = input; return profiles; } } } },
    "@/profile-directory-order": ordering,
  });
  await getProfileDirectory("  Alice  ", "az");
  assert.equal(query.where.OR[0].name.contains, "Alice");
  assert.equal(query.where.OR[0].name.mode, "insensitive");
  assert.deepEqual(Object.keys(query.select).sort(), ["avatar", "bio", "id", "name", "subtitle", "username"]);
  const all = await getProfileDirectory();
  assert.equal(query.where, undefined);
  assert.equal(query.take, undefined);
  assert.equal(all.length, 3);
});
