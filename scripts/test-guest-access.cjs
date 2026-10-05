const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, process: { env: {} }, require(name) { if (name in dependencies) return dependencies[name]; throw Error(name); } });
  return module.exports;
}
const policy = load('src/guest-access.ts');
const proxy = load('src/proxy.ts', {
  '@/auth': { auth: (handler) => handler },
  '@/guest-access': policy,
  '@/mobile-auth': { verifyMobileToken: (token) => token === 'valid' ? { sub: 'member' } : null },
  'next/server': { NextResponse: { next: (options) => ({ kind: 'next', options }), rewrite: (url) => ({ kind: 'rewrite', path: url.pathname }), redirect: (url) => ({ kind: 'redirect', path: url.pathname }), json: (body, options) => ({ kind: 'json', body, status: options.status }) } },
}).proxy;
function request(path, method = 'GET', email = null, bearer = '') {
  const url = new URL(path, 'http://localhost:3000');
  url.clone = () => new URL(url);
  return proxy({ nextUrl: url, url: url.toString(), method, auth: email ? { user: { email } } : null, headers: { get: (key) => key === 'authorization' ? bearer : null } });
}
test('anonymous views rewrite only public profile and post routes', async () => {
  for (const [path, expected] of [['/home', '/guest'], ['/profiles', '/guest/profiles'], ['/profile/anna', '/guest/profile/anna'], ['/posts/123456789012345678901234', '/guest/posts/123456789012345678901234']]) {
    const response = await request(path);
    assert.equal(response.kind, 'rewrite'); assert.equal(response.path, expected);
  }
});
test('internal pages and profile entry lead guests to registration', async () => {
  for (const path of ['/profile', '/settings', '/settings/blocked', '/admin', '/messages', '/map', '/create', '/activity', '/profile/anna/connections', '/posts/123456789012345678901234/map']) {
    assert.equal((await request(path)).path, '/join', path);
  }
});
test('expired sessions cannot invoke any content mutation or server action', async () => {
  for (const method of ['POST', 'PATCH', 'DELETE', 'PUT']) {
    for (const path of ['/', '/join', '/home', '/guest', '/posts/123456789012345678901234', '/api/profile/theme', '/api/posts/123456789012345678901234/location']) {
      assert.equal((await request(path, method)).status, 401, `${method} ${path}`);
    }
  }
});
test('guest APIs are denied while authentication and signed mobile requests work', async () => {
  assert.equal((await request('/api/messages/unread')).status, 401);
  assert.equal((await request('/api/mobile/profiles')).status, 401);
  assert.equal((await request('/api/mobile/profile', 'GET', null, 'Bearer fake')).status, 401);
  assert.equal((await request('/api/mobile/profile', 'GET', null, 'Bearer valid')).kind, 'next');
  assert.equal((await request('/api/auth/signin')).kind, 'next');
  assert.equal((await request('/api/mobile/auth/google', 'POST')).kind, 'next');
  assert.equal((await request('/api/cron/stories')).status, 401);
});
test('authenticated member routing remains unchanged', async () => {
  for (const path of ['/home', '/settings', '/messages', '/api/profile/theme']) assert.equal((await request(path, 'POST', 'member@example.invalid')).kind, 'next');
});
test('public queries filter private and archived content and select no sensitive fields', async () => {
  let query;
  const content = load('src/guest-content.ts', { '@/db': { prisma: { post: { findMany: async (args) => { query = args; return []; } } } } });
  await content.getGuestPosts('anna');
  assert.equal(query.where.AND[0].isArchived, false);
  assert.equal(query.where.AND[1].author.is.isPrivate, false);
  assert.equal(query.where.author.is.username, 'anna');
  assert.equal(query.where.author.is.isPrivate, false);
  for (const field of ['email', 'locationLatitude', 'locationLongitude', 'restrictedUntil', 'notificationLikes']) assert.equal(query.select.author.select[field], undefined);
  for (const field of ['authorEmail', 'revisions', 'comments', 'bookmarks']) assert.equal(query.select[field], undefined);
  assert.equal(query.take, 24);
});
test('public profile directory filters private profiles and sends public fields only', async () => {
  let query;
  const directory = load('src/profile-directory.ts', { '@/db': { prisma: { profile: { findMany: async (args) => { query = args; return []; } } } }, '@/profile-directory-order': { sortProfiles: (profiles) => profiles } });
  await directory.getProfileDirectory('ann', 'newest', false, true);
  assert.equal(query.where.isPrivate, false);
  assert.equal(query.where.OR.length, 3);
  for (const field of ['email', 'locationLatitude', 'locationLongitude', 'notificationLikes', 'theme']) assert.equal(query.select[field], undefined);
  for (const field of ['id', 'name', 'username', 'avatar', 'subtitle', 'bio', 'isAdmin', 'isVerified']) assert.equal(query.select[field], true);
});
