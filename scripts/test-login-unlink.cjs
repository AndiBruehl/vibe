const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup(methods, enabled = ['google', 'discord'], password = false) {
  let rows = methods.map(provider => ({ provider }));
  const removed = [];
  let tail = Promise.resolve();
  const tx = {
    loginRate: { upsert: async () => {} },
    profile: { findFirst: async () => ({ id: 'owner', email: 'Owner@Example.com' }) },
    loginCredential: { findFirst: async () => password ? { id: 'password' } : null },
    loginIdentity: {
      findMany: async () => rows,
      deleteMany: async ({ where }) => { assert.equal(JSON.stringify(where.email), JSON.stringify({ equals: 'Owner@Example.com', mode: 'insensitive' })); removed.push(where.provider); rows = rows.filter(row => row.provider !== where.provider); },
    },
    loginProof: { deleteMany: async ({ where }) => { assert.equal(where.kind, 'link'); assert.equal(JSON.stringify(where.email), JSON.stringify({ equals: 'Owner@Example.com', mode: 'insensitive' })); } },
  };
  const prisma = { $transaction: callback => { const task = tail.then(() => callback(tx)); tail = task.catch(() => {}); return task; } };
  const deps = {
    '@/db': { prisma },
    '@/auth-options': { availableLoginProviders: () => enabled.map(id => ({ id, enabled: true })), emailAuthAvailable: () => password },
    '@/auth-security': { secretDigest: value => value },
  };
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/login-unlink.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module: mod, exports: mod.exports, require: name => deps[name] });
  return { unlink: provider => mod.exports.unlinkProvider('owner@example.com', provider), removed, tx };
}
test('last provider is retained', async () => { const s = setup(['google']); assert.equal(await s.unlink('google'), 'LastMethod'); assert.equal(s.removed.length, 0); });
test('configured second provider allows unlink and repeat is harmless', async () => { const s = setup(['google', 'discord']); assert.equal(await s.unlink('discord'), 'ok'); assert.equal(await s.unlink('discord'), 'ok'); assert.deepEqual(s.removed, ['discord']); });
test('disabled remaining provider does not count as a working login', async () => { const s = setup(['google', 'discord'], ['google']); assert.equal(await s.unlink('google'), 'LastMethod'); });
test('usable password login can retain access', async () => { const s = setup(['google'], ['google'], true); assert.equal(await s.unlink('google'), 'ok'); });
test('concurrent removals retain one method when transactions are serialized', async () => { const s = setup(['google', 'discord']); const result = await Promise.all([s.unlink('google'), s.unlink('discord')]); assert.deepEqual(result, ['ok', 'LastMethod']); assert.equal(s.removed.length, 1); });
test('missing owner cannot mutate identities', async () => { const s = setup(['google', 'discord']); s.tx.profile.findFirst = async () => null; assert.equal(await s.unlink('google'), 'Unauthorized'); assert.equal(s.removed.length, 0); });
test('unsupported providers are rejected', async () => { const s = setup(['google', 'discord']); assert.equal(await s.unlink('fake'), 'Invalid'); assert.equal(s.removed.length, 0); });
test('owner lookup and provider removal are case-insensitive', async () => { const s = setup(['google', 'discord']); assert.equal(await s.unlink('google'), 'ok'); assert.deepEqual(s.removed, ['google']); });
