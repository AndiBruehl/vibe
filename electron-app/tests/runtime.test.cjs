const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveAppUrl, isWebUrl, windowBounds, DEFAULT_APP_URL } = require("../src/runtime.cjs");
test("default and local development destinations are valid", () => {
  assert.equal(resolveAppUrl(), `${DEFAULT_APP_URL}/`);
  assert.equal(resolveAppUrl("http://127.0.0.1:3000"), "http://127.0.0.1:3000/");
});
test("invalid destinations fail before launching a window", () => {
  for (const url of ["invalid", "file:///C:/test", "javascript:alert(1)", "http://public.example", "https://user:password@example.com"]) {
    assert.throws(() => resolveAppUrl(url));
  }
});
test("external URL filtering rejects executable schemes", () => {
  assert.equal(isWebUrl("https://example.com"), true);
  for (const url of ["file:///C:/test.exe", "ms-settings:", "javascript:alert(1)", "invalid"]) assert.equal(isWebUrl(url), false);
});
test("window bounds fit small and large work areas", () => {
  for (const workArea of [{width:800,height:560}, {width:1920,height:1040}, {width:480,height:320}]) {
    const result = windowBounds(workArea);
    assert.ok(result.width <= workArea.width && result.height <= workArea.height);
    assert.ok(result.minWidth <= result.width && result.minHeight <= result.height);
  }
});
