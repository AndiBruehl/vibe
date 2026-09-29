const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function route({ email = 'owner@example.invalid', count = 1, failure = false } = {}) {
  const writes = [];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/app/api/posts/[id]/location/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require(name) {
    if (name === '@/auth') return { auth: async () => ({ user: { email } }) };
    if (name === '@/db') return { prisma: { post: { updateMany: async (args) => { writes.push(args); if (failure) throw Error('offline'); return { count }; } } } };
    if (name === 'next/cache') return { revalidatePath() {} };
    if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
    throw Error(name);
  } });
  return { writes, remove: (id = '123456789012345678901234') => module.exports.DELETE({}, { params: Promise.resolve({ id }) }) };
}

test('removal scopes the write to its owner and clears only location fields', async () => {
  const api = route();
  assert.equal((await api.remove()).status, 200);
  assert.equal(api.writes[0].where.authorEmail, 'owner@example.invalid');
  assert.deepEqual(Object.keys(api.writes[0].data).sort(), ['locationLabel', 'locationLatitude', 'locationLongitude', 'locationUpdatedAt']);
  assert.ok(Object.values(api.writes[0].data).every((value) => value === null));
});
test('unauthenticated and malformed requests cannot write', async () => {
  const anonymous = route({ email: null });
  assert.equal((await anonymous.remove()).status, 401);
  assert.equal(anonymous.writes.length, 0);
  const api = route();
  assert.equal((await api.remove('invalid')).status, 400);
  assert.equal(api.writes.length, 0);
});
test('missing ownership and storage outages never report successful removal', async () => {
  assert.equal((await route({ count: 0 }).remove()).status, 404);
  assert.equal((await route({ failure: true }).remove()).status, 503);
});
