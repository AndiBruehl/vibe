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


test('public post metadata fails closed for archived or private-author posts', async () => {
  let query;
  const metadata = load('src/public-page-metadata.ts', {
    '@/db': { prisma: { post: { findFirst: async (args) => { query = args; return null; } } } },
    '@/guest-content': { publicPostWhere: { AND: [{ isArchived: false }, { author: { is: { isPrivate: false } } }] }, publicProfileWhere: { isPrivate: false } },
    '@/public-metadata': { absolutePublicUrl: (path) => `https://example.test${path}`, plainTextSummary: (value, fallback) => value || fallback, publicImageUrl: (value) => value || 'https://example.test/logo.svg' },
  });
  const result = await metadata.publicPostMetadata('123456789012345678901234');
  assert.equal(result.robots.index, false);
  assert.equal(query.where.AND[0].isArchived, false);
  assert.equal(query.where.AND[1].author.is.isPrivate, false);
  for (const field of ['authorEmail', 'comments', 'bookmarks', 'revisions']) assert.equal(query.select[field], undefined);
});

test('public profile metadata fails closed for private or missing profiles', async () => {
  let query;
  const metadata = load('src/public-page-metadata.ts', {
    '@/db': { prisma: { profile: { findFirst: async (args) => { query = args; return null; } } } },
    '@/guest-content': { publicProfileWhere: { isPrivate: false }, publicPostWhere: { AND: [{ isArchived: false }, { author: { is: { isPrivate: false } } }] } },
    '@/public-metadata': { absolutePublicUrl: (path) => `https://example.test${path}`, plainTextSummary: (value, fallback) => value || fallback, publicImageUrl: (value) => value || 'https://example.test/logo.svg' },
  });
  const result = await metadata.publicProfileMetadata('private-user');
  assert.equal(result.robots.index, false);
  assert.equal(query.where.isPrivate, false);
  for (const field of ['email', 'locationLatitude', 'locationLongitude', 'notificationLikes']) assert.equal(query.select[field], undefined);
});


test('guest comments select public author fields only and no mutation state', async () => {
  let query;
  const comments = load('src/guest-comments.ts', {
    '@/db': { prisma: { comment: { findMany: async (args) => { query = args; return []; } } } },
  });
  await comments.getGuestComments('123456789012345678901234');
  assert.equal(query.where.postId, '123456789012345678901234');
  assert.equal(query.where.parentCommentId, null);
  for (const field of ['email', 'locationLatitude', 'locationLongitude', 'notificationLikes']) assert.equal(query.select.author.select[field], undefined);
  for (const field of ['likes', 'mentions', 'authorEmail']) assert.equal(query.select[field], undefined);
  assert.equal(query.take, 50);
  assert.equal(query.select.replies.take, 20);
});


test('guest join prompt is shared across public guest pages', () => {
  const prompt = fs.readFileSync('src/app/components/GuestJoinPrompt.tsx', 'utf8');
  assert.match(prompt, /Create account or sign in/);
  assert.match(prompt, /like, comment, follow, message and save posts/);
  assert.doesNotMatch(prompt, /onSubmit|button type="submit"|fetch\(/);
  for (const file of ['src/app/guest/page.tsx', 'src/app/guest/profiles/page.tsx', 'src/app/guest/profile/[username]/page.tsx', 'src/app/guest/posts/[id]/page.tsx']) {
    const content = fs.readFileSync(file, 'utf8');
    assert.match(content, /GuestJoinPrompt/, file);
  }
});


test('guest feed cards expose public metadata without member actions', () => {
  const content = fs.readFileSync('src/app/components/GuestPosts.tsx', 'utf8');
  for (const text of ['formatPublicDate', 'likesCount', 'locationText', 'Open text post', 'AdminBadge']) assert.match(content, new RegExp(text));
  for (const text of ['CommentForm', 'LikeButton', 'Bookmark', 'FollowButton', 'MessageButton', 'onSubmit', 'fetch(']) assert.equal(content.includes(text), false, text);
});


test('guest profile directory cards stay public and read-only', () => {
  const content = fs.readFileSync('src/app/guest/profiles/page.tsx', 'utf8');
  for (const text of ['Public profile', 'No public bio yet', 'Open profile', 'Search results for']) assert.match(content, new RegExp(text));
  for (const text of ['FollowButton', 'MessageButton', '/settings', '/admin', 'onSubmit={', 'fetch(']) assert.equal(content.includes(text), false, text);
});


test('guest detail pages include polished navigation and read-only fallbacks', () => {
  const post = fs.readFileSync('src/app/guest/posts/[id]/page.tsx', 'utf8');
  const profile = fs.readFileSync('src/app/guest/profile/[username]/page.tsx', 'utf8');
  for (const text of ['Back to public posts', 'Text-only public post', 'GuestPostComments']) assert.match(post, new RegExp(text));
  for (const text of ['Back to public profiles', 'Public profile', 'Unavailable']) assert.match(profile, new RegExp(text));
  for (const text of ['CommentForm', 'FollowButton', 'MessageButton', 'LikeButton', 'BookmarkButton', 'onSubmit={', 'fetch(']) {
    assert.equal(post.includes(text), false, `post ${text}`);
    assert.equal(profile.includes(text), false, `profile ${text}`);
  }
});



test('join page requires acknowledgement before starting guest account oauth', () => {
  const join = fs.readFileSync('src/app/join/page.tsx', 'utf8');
  const login = fs.readFileSync('src/app/components/LoginMethods.tsx', 'utf8');
  assert.match(join, /requireAcknowledgement/);
  assert.match(join, /unlinked Google or Discord login creates a separate new account/);
  assert.match(login, /next-auth\/react/);
  assert.match(login, /signIn\(provider/);
  assert.match(login, /!acknowledged/);
  assert.equal(login.includes('/api/auth/csrf'), false);
  assert.equal(login.includes('/api/auth/signin/'), false);
});


test('root auth errors are redirected to join without changing protected routing', () => {
  const root = fs.readFileSync('src/app/page.tsx', 'utf8');
  const policy = fs.readFileSync('src/proxy.ts', 'utf8');
  assert.match(policy, /pathname = "\/join"/);
  assert.match(policy, /searchParams\.has\("error"\)/);
  assert.match(root, /redirect\("\/home"\)/);
});

test('guest public posts support read-only sorting without protected routing changes', async () => {
  let query;
  const content = load('src/guest-content.ts', { '@/db': { prisma: { post: { findMany: async (args) => { query = args; return []; } } } } });
  assert.equal(content.normalizeGuestPostSort('liked'), 'liked');
  assert.equal(content.normalizeGuestPostSort('unknown'), 'newest');
  await content.getGuestPosts(undefined, 1, 'liked');
  assert.equal(JSON.stringify(query.orderBy), JSON.stringify([{ likesCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]));
  await content.getGuestPosts(undefined, 1, 'oldest');
  assert.equal(JSON.stringify(query.orderBy), JSON.stringify([{ createdAt: 'asc' }, { id: 'asc' }]));
  const guestHome = fs.readFileSync('src/app/guest/page.tsx', 'utf8');
  const guestPosts = fs.readFileSync('src/app/components/GuestPosts.tsx', 'utf8');
  assert.match(guestHome, /normalizeGuestPostSort/);
  assert.match(guestPosts, /Guest post sorting/);
});



test('discord provider pins the issuer Discord now sends in callbacks', () => {
  const auth = fs.readFileSync('src/auth.ts', 'utf8');
  assert.match(auth, /Discord\(\{[^}]*issuer: "https:\/\/discord\.com"/s);
});
