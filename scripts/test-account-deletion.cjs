const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getSelfDeletionBlocker } = require('../src/account-deletion-policy.ts');

const protectedEmails = new Set(['violett.ai.2025@gmail.com', 'anna.lpunkt2003@gmail.com']);
const isProtectedAdmin = (email) => protectedEmails.has(email);
const owner = { email: 'member@example.com', isSystem: false };

test('self-deletion requires a signed-in account and the explicit DELETE confirmation', () => {
  assert.equal(getSelfDeletionBlocker(null, 'DELETE', owner, isProtectedAdmin), 'unauthenticated');
  assert.equal(getSelfDeletionBlocker(owner.email, 'delete', owner, isProtectedAdmin), 'unconfirmed');
  assert.equal(getSelfDeletionBlocker(owner.email, 'DELETE', null, isProtectedAdmin), 'missing-profile');
});

test('self-deletion cannot target a different account, a protected admin, or a system profile', () => {
  assert.equal(getSelfDeletionBlocker(owner.email, 'DELETE', { email: 'other@example.com', isSystem: false }, isProtectedAdmin), 'not-owner');
  assert.equal(getSelfDeletionBlocker('violett.ai.2025@gmail.com', 'DELETE', { email: 'violett.ai.2025@gmail.com', isSystem: false }, isProtectedAdmin), 'protected-account');
  assert.equal(getSelfDeletionBlocker(owner.email, 'DELETE', { ...owner, isSystem: true }, isProtectedAdmin), 'protected-account');
});

test('a normal account can only delete its own matching profile after confirmation', () => {
  assert.equal(getSelfDeletionBlocker(owner.email, 'DELETE', owner, isProtectedAdmin), null);
  assert.equal(getSelfDeletionBlocker('MEMBER@example.com', 'DELETE', owner, isProtectedAdmin), null);
});
