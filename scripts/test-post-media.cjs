const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
const fs = require("node:fs");
const vm = require("node:vm");
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    URL,
    console,
    require: (name) => {
      if (!(name in dependencies)) throw new Error(name);
      return dependencies[name];
    },
  });
  return exports;
}
const media = load("src/post-images.ts");
const sorting = load("src/post-sort.ts");
const urls = [1, 2, 3, 4].map((n) => `https://example.com/${n}.jpg`);
test("legacy single-image posts and ordered galleries", () => {
  assert.deepEqual(Array.from(media.getPostImages({ image: urls[0] })), [
    urls[0],
  ]);
  assert.deepEqual(
    Array.from(media.getPostImages({ image: urls[0], images: [] })),
    [urls[0]],
  );
  assert.deepEqual(
    Array.from(media.getPostImages({ image: urls[0], images: urls })),
    urls,
  );
});
test("one to four images accepted; zero, five and invalid URLs rejected", () => {
  for (let n = 1; n <= 4; n++)
    assert.deepEqual(
      Array.from(media.parsePostImages(urls.slice(0, n))),
      urls.slice(0, n),
    );
  for (const values of [
    [],
    [...urls, urls[0]],
    [""],
    ["javascript:alert(1)"],
    ["not a URL"],
    [null],
  ])
    assert.throws(() => media.parsePostImages(values));
});
test("all four post orders use descriptions and stable ties", () => {
  const posts = [
    { id: "a", description: "Zebra", createdAt: "2024-01-01" },
    { id: "b", description: "apple", createdAt: "2024-01-03" },
    { id: "c", description: "Banana", createdAt: "2024-01-02" },
  ];
  for (const [order, expected] of [
    ["newest", [1, 2, 0]],
    ["oldest", [0, 2, 1]],
    ["az", [1, 2, 0]],
    ["za", [0, 2, 1]],
  ])
    assert.deepEqual(
      Array.from(sorting.sortPostIndices(posts, order)),
      expected,
    );
  assert.equal(posts[0].id, "a");
});
function actions(owner = "viewer@example.com") {
  const writes = [];
  const post = {
    create: async ({ data }) => {
      writes.push(data);
      return { id: "post" };
    },
    findUnique: async () => ({ id: "post", authorEmail: owner }),
    update: async ({ data }) => {
      writes.push(data);
    },
  };
  const mod = load("src/actions.ts", {
    "@/post-images": media,
    "@/auth": { auth: async () => ({ user: { email: "viewer@example.com" } }) },
    "@/db": { prisma: { post } },
    "next/cache": { revalidatePath: () => {} },
    "next/navigation": {
      redirect: (url) => {
        throw new Error("REDIRECT " + url);
      },
    },
  });
  return { ...mod, writes };
}
function form(images) {
  const data = new FormData();
  data.set("imagesSet", "1");
  data.set("postId", "post");
  data.set("description", "Description");
  images.forEach((url) => data.append("images", url));
  return data;
}
test("create stores four ordered images and the first as cover", async () => {
  const api = actions();
  await assert.rejects(api.postEntry(form(urls)), /REDIRECT/);
  assert.deepEqual(Array.from(api.writes[0].images), urls);
  assert.equal(api.writes[0].image, urls[0]);
});
test("editing synchronizes cover and gallery; description-only edits preserve images", async () => {
  const api = actions();
  await assert.rejects(api.editPost(form([...urls].reverse())), /REDIRECT/);
  assert.equal(api.writes[0].image, urls[3]);
  const data = new FormData();
  data.set("postId", "post");
  data.set("description", "Changed");
  await assert.rejects(api.editPost(data), /REDIRECT/);
  assert.equal("images" in api.writes[1], false);
});
test("server refuses over-limit galleries and unauthorized edits without writing", async () => {
  const api = actions();
  await assert.rejects(api.postEntry(form([...urls, urls[0]])), /4 images/);
  assert.equal(api.writes.length, 0);
  const other = actions("other@example.com");
  await assert.rejects(other.editPost(form(urls)), /not authorized/);
  assert.equal(other.writes.length, 0);
});
