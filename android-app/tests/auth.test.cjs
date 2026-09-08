/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, "../src/lib", file), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, URL, Date, ...globals, require: name => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    return mocks[name];
  } });
  return exports;
}

const { parseLoginCallback } = load("loginCallback.ts");
const pending = { state: "unique-attempt", startedAt: 1000 };
test("accepts a matching callback after restoring the pending attempt", () => {
  assert.equal(parseLoginCallback("vibe://auth?state=unique-attempt&token=session", JSON.parse(JSON.stringify(pending)), 2000), "session");
});
test("rejects expired, unsolicited and mismatched login callbacks", () => {
  const callback = "vibe://auth?state=unique-attempt&token=session";
  assert.throws(() => parseLoginCallback(callback, null, 2000));
  assert.throws(() => parseLoginCallback(callback, pending, 602000));
  assert.throws(() => parseLoginCallback(callback.replace("unique-attempt", "other"), pending, 2000));
  assert.throws(() => parseLoginCallback(callback.replace("vibe:", "https:"), pending, 2000));
});
test("handles cancellation and missing tokens as errors", () => {
  assert.throws(() => parseLoginCallback("vibe://auth?state=unique-attempt&error=Cancelled", pending, 2000), /Cancelled/);
  assert.throws(() => parseLoginCallback("vibe://auth?state=unique-attempt", pending, 2000), /mobile session/);
});

function sessionFixture(failWrite = false) {
  const legacy = new Map([["vibe.mobileToken", "legacy-token"]]);
  const secure = new Map();
  const store = load("sessionStore.ts", {
    "@react-native-async-storage/async-storage": {
      getItem: async key => legacy.get(key) ?? null,
      setItem: async (key, value) => { legacy.set(key, value); },
      removeItem: async key => { legacy.delete(key); },
      multiRemove: async keys => keys.forEach(key => legacy.delete(key)),
    },
    "expo-secure-store": {
      getItemAsync: async key => secure.get(key) ?? null,
      setItemAsync: async (key, value) => { if (failWrite) throw new Error("Storage unavailable"); secure.set(key, value); },
      deleteItemAsync: async key => { secure.delete(key); },
    },
  });
  return { store, legacy, secure };
}
test("migrates existing sessions before removing the old token", async () => {
  const { store, legacy, secure } = sessionFixture();
  assert.equal(await store.getStoredToken(), "legacy-token");
  assert.equal(secure.get("vibe.mobileToken"), "legacy-token");
  assert.equal(legacy.has("vibe.mobileToken"), false);
  await store.clearSession();
  assert.equal(await store.getStoredToken(), null);
});
test("preserves the old token when secure migration fails", async () => {
  const { store, legacy } = sessionFixture(true);
  await assert.rejects(store.getStoredToken(), /Storage unavailable/);
  assert.equal(legacy.get("vibe.mobileToken"), "legacy-token");
});

function apiFixture(status) {
  return load("api.ts", {
    "expo-constants": { expoConfig: { extra: { apiUrl: "https://example.test" } } },
    "@/lib/sessionStore": { getStoredToken: async () => "stored-token" },
  }, {
    process: { env: {} }, Headers, AbortController, setTimeout, clearTimeout,
    fetch: async () => ({ ok: false, status, json: async () => ({ error: "Request failed" }) }),
  });
}
test("expires the stored session on 401 but not on a server outage", async () => {
  for (const status of [401, 503]) {
    const { api, onSessionExpired } = apiFixture(status);
    const tokens = [];
    onSessionExpired(token => tokens.push(token));
    await assert.rejects(api.getProfile());
    assert.deepEqual(tokens, status === 401 ? ["stored-token"] : []);
  }
});
test("rejecting a new login token does not invalidate another stored session", async () => {
  const { api, onSessionExpired } = apiFixture(401);
  const tokens = [];
  onSessionExpired(token => tokens.push(token));
  await assert.rejects(api.getProfile("new-login-token"));
  assert.deepEqual(tokens, []);
});
