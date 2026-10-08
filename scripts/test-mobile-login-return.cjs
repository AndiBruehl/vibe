const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const m = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/mobile-login-return.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { module: m, exports: m.exports, URL, Date });
const { mobileRedirect, mobileErrorReturn, matchesMobileAttempt } = m.exports;
const redirect = 'vibe://auth?state=1234567890abcdef';
test('only exact app callback destinations with state are accepted', () => {
  assert.equal(mobileRedirect(redirect + '&token=injected'), redirect);
  for (const value of ['https://evil.test', 'vibe://evil?state=1234567890abcdef', 'vibe://auth/path?state=1234567890abcdef', 'vibe://auth', 'vibe://user@auth?state=1234567890abcdef']) assert.equal(mobileRedirect(value), null);
});
test('session handoff requires its unexpired browser attempt and exact return state', () => {
  const cookie = JSON.stringify({ provider: 'discord', redirectUri: redirect, startedAt: 1000 });
  assert.equal(matchesMobileAttempt(cookie, redirect, 2000), true);
  assert.equal(matchesMobileAttempt(cookie, redirect + 'different', 2000), false);
  assert.equal(matchesMobileAttempt(undefined, redirect, 2000), false);
  assert.equal(matchesMobileAttempt(cookie, redirect, 602000), false);
  assert.equal(matchesMobileAttempt(cookie, redirect, 500), false);
  assert.equal(matchesMobileAttempt(JSON.stringify({ provider: 'discord', redirectUri: redirect, startedAt: 1000, linking: true }), redirect, 2000), false);
});
for (const provider of ['google', 'discord']) {
  const cookie = JSON.stringify({ provider, redirectUri: redirect, startedAt: 1000 });
  const request = `https://vibe.test/api/auth/callback/${provider}`;
  test(`${provider} cancellation returns to the app with its attempt`, () => {
    const result = new URL(mobileErrorReturn(request, cookie, '/join?error=AccessDenied', 2000));
    assert.equal(result.searchParams.get('state'), '1234567890abcdef');
    assert.match(result.searchParams.get('error'), /cancelled/);
  });
  test(`${provider} never redirects success, stale attempts or external destinations`, () => {
    assert.equal(mobileErrorReturn(request, cookie, '/home', 2000), null);
    assert.equal(mobileErrorReturn(request, cookie, '/join?error=Configuration', 602000), null);
    assert.equal(mobileErrorReturn(request, cookie, 'https://evil.test/?error=oops', 2000), null);
    assert.equal(mobileErrorReturn(request, 'invalid', '/join?error=oops', 2000), null);
  });
  test(`${provider} linking completes without switching the app session`, () => {
    const linking = JSON.stringify({ provider, redirectUri: redirect, startedAt: 1000, linking: true });
    const result = new URL(mobileErrorReturn(request, linking, '/settings/login?notice=linked', 2000));
    assert.equal(result.searchParams.get('linked'), '1');
    assert.equal(result.searchParams.has('token'), false);
    assert.equal(mobileErrorReturn(request, cookie, '/settings/login?notice=linked', 2000), null);
  });
}
