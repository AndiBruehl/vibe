const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const m = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/login-callback-return.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: m, exports: m.exports, URL });
const { linkingErrorReturn } = m.exports;
for (const provider of ['google', 'discord']) {
  const callback = `https://example.com/api/auth/callback/${provider}`;
  test(`${provider}: cancelled linking returns to methods`, () => assert.equal(linkingErrorReturn(`${callback}?error=access_denied`, 'a'.repeat(64), '/?error=AccessDenied'), 'https://example.com/settings/login?notice=cancelled'));
  test(`${provider}: cancellation is detected from Auth.js redirect location`, () => assert.equal(linkingErrorReturn(callback, 'a'.repeat(64), '/?error=AccessDenied'), 'https://example.com/settings/login?notice=cancelled'));
  test(`${provider}: normal login errors retain their destination`, () => assert.equal(linkingErrorReturn(`${callback}?error=access_denied`, undefined, '/?error=AccessDenied'), null));
  test(`${provider}: successful linking is untouched`, () => assert.equal(linkingErrorReturn(callback, 'a'.repeat(64), '/settings/login?notice=linked'), null));
  test(`${provider}: failed linking returns to methods`, () => assert.equal(linkingErrorReturn(callback, 'a'.repeat(64), '/?error=OAuthCallbackError'), 'https://example.com/settings/login?notice=linkfailed'));
}
