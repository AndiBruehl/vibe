const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const authModule = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/auth-security.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(code, { module: authModule, exports: authModule.exports, require, Buffer });
const { hashPassword, verifyPassword, normalizeEmail, validPassword, secretDigest, newSecret } = authModule.exports;

test('password policy and email normalization are strict', () => {
  assert.equal(normalizeEmail(' User@Example.COM '), 'user@example.com');
  assert.equal(normalizeEmail('bad'), null);
  assert.equal(validPassword('short'), false);
  assert.equal(validPassword('a'.repeat(12)), true);
  assert.equal(validPassword('a'.repeat(129)), false);
});

test('password hashes verify without storing plaintext and reject changes', async () => {
  const password = 'correct horse battery staple';
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.match(hash, /^scrypt-v1:[a-f0-9]{32}:[a-f0-9]{128}$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong password', hash), false);
  assert.equal(await verifyPassword(password, null), false);
});

test('proof identifiers are deterministic while token material is random', () => {
  const first = newSecret();
  const second = newSecret();
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.match(second, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.equal(secretDigest(first), secretDigest(first));
  assert.notEqual(secretDigest(first), first);
});
