const { test } = require('node:test');
const assert = require('node:assert/strict');
const { canViewTaggedPost } = require('../src/profile-tag-visibility.ts');
const { captionLinksToProfile } = require('../src/caption-links.ts');
const { readListWithFallback } = require('../src/read-list-fallback.ts');

const publicPost = { archived: false, authorId: 'author-1', authorEmail: 'author@example.com', authorIsPrivate: false };
const guest = { email: null, isGuest: true, isBlocked: false, followsAuthor: false };

test('guests can see only unarchived posts with explicitly public authors', () => {
  assert.equal(canViewTaggedPost(publicPost, guest), true);
  assert.equal(canViewTaggedPost({ ...publicPost, authorIsPrivate: true }, guest), false);
  assert.equal(canViewTaggedPost({ ...publicPost, authorIsPrivate: undefined }, guest), false);
  assert.equal(canViewTaggedPost({ ...publicPost, archived: true }, guest), false);
});

test('private authors are visible only to themselves or their followers', () => {
  const privatePost = { ...publicPost, authorIsPrivate: true };
  const viewer = { email: 'viewer@example.com', isGuest: false, isBlocked: false, followsAuthor: false };
  assert.equal(canViewTaggedPost(privatePost, viewer), false);
  assert.equal(canViewTaggedPost(privatePost, { ...viewer, followsAuthor: true }), true);
  assert.equal(canViewTaggedPost(privatePost, { ...viewer, email: privatePost.authorEmail }), true);
});

test('blocked, archived, or orphaned posts stay hidden', () => {
  const viewer = { email: 'viewer@example.com', isGuest: false, isBlocked: true, followsAuthor: true };
  assert.equal(canViewTaggedPost(publicPost, viewer), false);
  assert.equal(canViewTaggedPost({ ...publicPost, archived: true }, { ...viewer, isBlocked: false }), false);
  assert.equal(canViewTaggedPost({ ...publicPost, authorId: null }, { ...viewer, isBlocked: false }), false);
  assert.equal(canViewTaggedPost({ ...publicPost, authorEmail: null }, { ...viewer, isBlocked: false }), false);
});

test('caption profile links resolve to the matching profile and ignore partial names', () => {
  assert.equal(captionLinksToProfile('Nice work @andiw!', 'andiw'), true);
  assert.equal(captionLinksToProfile('Nice work @ANDIW.', 'andiw'), true);
  assert.equal(captionLinksToProfile('Nice work @andiw2', 'andiw'), false);
  assert.equal(captionLinksToProfile('Email andiw@example.com', 'andiw'), false);
});

test('tag sources keep successful results and mark a failed source for a fallback notice', async () => {
  assert.deepEqual(await readListWithFallback(async () => ['post-1']), { rows: ['post-1'], failed: false });
  assert.deepEqual(await readListWithFallback(async () => { throw new Error('temporary database outage'); }), { rows: [], failed: true });
});
