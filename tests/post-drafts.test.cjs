const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, require: name => {
    assert.ok(name in dependencies, name); return dependencies[name];
  } });
  return exports;
}
const media = load("src/post-images.ts", {});
function fixture(email = "owner@example.test", updateCount = 1, deleteCount = 1) {
  const calls = [];
  const actions = load("src/draft-actions.ts", {
    "@/auth": { auth: async () => email ? { user: { email } } : null },
    "@/db": { prisma: { postDraft: {
      create: async args => { calls.push(args); return { id: "a".repeat(24) }; },
      updateMany: async args => { calls.push(args); return { count: updateCount }; },
      deleteMany: async args => { calls.push(args); return { count: deleteCount }; },
    } } },
    "@/object-id": { isObjectId: value => typeof value === "string" && /^[a-f0-9]{24}$/.test(value) },
    "@/post-images": media, "next/cache": { revalidatePath() {} },
  });
  return { ...actions, calls };
}
test("unauthenticated requests cannot save or delete drafts", async () => {
  const f = fixture(null);
  assert.equal((await f.savePostDraft(new FormData())).error, "session");
  assert.equal((await f.deletePostDraft("a".repeat(24))).ok, false);
  assert.equal(f.calls.length, 0);
});
test("text-only drafts are saved, media and tags round-trip without losing video types", async () => {
  const f = fixture();
  const data = new FormData();
  data.set("description", "Work in progress");
  assert.ok((await f.savePostDraft(data)).id);
  assert.equal(f.calls[0].data.images.length, 0);
  data.append("images", "https://example.test/video");
  data.append("mediaType", "video");
  data.set("topics", "music,travel");
  data.append("profileTags", "b".repeat(24));
  assert.ok((await f.savePostDraft(data)).id);
  const saved = f.calls[1].data;
  assert.equal(saved.mediaTypes[0], "video");
  assert.equal(saved.topics.join(","), "music,travel");
  assert.equal(saved.profileTags[0], "b".repeat(24));
  assert.equal(saved.authorEmail, "owner@example.test");
});
test("updates and deletes are owner-scoped; missing or foreign draft is not recreated", async () => {
  const f = fixture("owner@example.test", 0);
  const data = new FormData();
  data.set("draftId", "a".repeat(24)); data.set("description", "Changed");
  assert.equal((await f.savePostDraft(data)).error, "missing");
  assert.equal(f.calls[0].where.authorEmail, "owner@example.test");
  await f.deletePostDraft("a".repeat(24));
  assert.equal(f.calls[1].where.authorEmail, "owner@example.test");
});
test("a stale draft deletion reports failure rather than pretending it succeeded", async () => {
  const f = fixture("owner@example.test", 1, 0);
  assert.equal((await f.deletePostDraft("a".repeat(24))).ok, false);
  assert.equal(f.calls[0].where.authorEmail, "owner@example.test");
});
test("empty and invalid media drafts do not write", async () => {
  const f = fixture();
  assert.equal((await f.savePostDraft(new FormData())).error, "empty");
  const data = new FormData();
  data.append("images", "javascript:alert(1)"); data.append("mediaType", "image");
  assert.equal((await f.savePostDraft(data)).error, "save");
  assert.equal(f.calls.length, 0);
});
