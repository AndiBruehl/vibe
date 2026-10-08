const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup(owner, verifiedEmail = 'member@example.com', linking = false, orphanLink = false) {
  const writes = [];
  const prisma = {
    loginIdentity: {
      findUnique: async () => linking && !orphanLink ? null : ({ email: verifiedEmail }),
      findFirst: async () => ({ id: 'existing-provider' }),
      update: async ({ data }) => { writes.push(data); },
      deleteMany: async () => { writes.push('delete'); return { count: 1 }; },
      create: async ({ data }) => { writes.push(linking ? data : 'create'); },
    },
    profile: { findUnique: async ({ where }) => orphanLink && where.email === verifiedEmail ? null : owner, findFirst: async () => null, create: async () => ({ id: 'new-profile' }) },
    loginProof: {
      findUnique: async () => ({ kind: 'link', provider: 'discord', email: 'google-owner@example.com', expiresAt: new Date(Date.now() + 60000) }),
      deleteMany: async () => ({ count: 1 }),
    },
    loginCredential: { findUnique: async () => null },
  };
  prisma.$transaction = async callback => callback(prisma);
  const m = { exports: {} };
  const deps = {
    '@/db': { prisma },
    'node:crypto': require('node:crypto'),
    '@/login-store': { identityId: (p, id) => `${p}:${id}`, credentialId: email => email },
    '@/auth-security': { normalizeEmail: value => typeof value === 'string' ? value.toLowerCase() : null, secretDigest: value => value },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/login-oauth.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { module: m, exports: m.exports, require: name => deps[name] });
  return { resolve: m.exports.resolveOAuth, writes, prisma };
}
for (const provider of ['google', 'discord']) {
  test(`${provider}: expired linking never falls through to signup`, async () => {
    const { resolve, writes, prisma } = setup(null, undefined, true);
    prisma.loginProof.findUnique = async () => null;
    assert.equal((await resolve(provider, 'new-id', 'member@example.com', true, 'a'.repeat(64))).redirect, '/settings/login?notice=expired');
    assert.equal(writes.length, 0);
  });
  test(`${provider}: matching email alone never links a second provider`, async () => {
    const { resolve, writes, prisma } = setup(null, undefined, true);
    prisma.profile.findFirst = async () => ({ email: 'member@example.com' });
    assert.equal((await resolve(provider, 'new-id', 'member@example.com', true)).redirect, '/join?notice=link');
    assert.equal(writes.length, 0);
  });
}
test('link Discord with a different email adds its identity to the Google profile', async () => {
  const { resolve, writes } = setup({ id: 'existing-google-profile' }, undefined, true);
  const result = await resolve('discord', 'discord-id', 'different@discord.example', true, 'a'.repeat(64));
  assert.equal(result.redirect, '/settings/login?notice=linked');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].provider, 'discord');
  assert.equal(writes[0].email, 'google-owner@example.com');
});
test('linking reassigns an orphan Discord identity to the existing Google profile', async () => {
  const { resolve, writes } = setup({ id: 'google-profile' }, 'orphan@example.com', true, true);
  assert.equal((await resolve('discord', 'id', 'orphan@example.com', true, 'a'.repeat(64))).redirect, '/settings/login?notice=linked');
  assert.equal(writes[0].email, 'google-owner@example.com');
});
test('linking refuses an identity whose other profile still exists', async () => {
  const { resolve, writes } = setup({ id: 'other-profile' });
  assert.equal((await resolve('discord', 'id', 'member@example.com', true, 'a'.repeat(64))).redirect, '/settings/login?notice=conflict');
  assert.equal(writes.length, 0);
});
for (const provider of ['google', 'discord']) {
  test(`${provider}: verified original identity recovers after profile deletion`, async () => {
    const { resolve, writes } = setup(null);
    assert.equal((await resolve(provider, 'id', 'member@example.com', true)).email, 'member@example.com');
    assert.deepEqual(writes, ['delete', 'create']);
  });
  test(`${provider}: unverified email cannot recover an orphan`, async () => {
    for (const [email, verified] of [['member@example.com', false], ['other@example.com', false]]) {
      const { resolve, writes } = setup(null);
      assert.equal((await resolve(provider, 'id', email, verified)).redirect, '/join?notice=email');
      assert.deepEqual(writes, []);
    }
  });
  test(`${provider}: deleted linked profile permits signup with the provider's different verified email`, async () => {
    const { resolve, writes } = setup(null, 'former-google-owner@example.com');
    assert.equal((await resolve(provider, 'id', 'discord-email@example.com', true)).email, 'discord-email@example.com');
    assert.deepEqual(writes, ['delete', 'create']);
  });
  test(`${provider}: existing linked profile is retained`, async () => {
    const { resolve, writes } = setup({ email: 'owner@example.com' });
    assert.equal((await resolve(provider, 'id', 'member@example.com', true)).email, 'owner@example.com');
    assert.deepEqual(writes, []);
  });
}
