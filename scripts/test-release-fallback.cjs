const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const manifest = require('../public/releases/latest.json');
const signature = require('../public/releases/latest.sig.example.json');

function load(fetch) {
  const m = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/releases/latest/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, {
    module: m, exports: m.exports, fetch, AbortSignal,
    require: (name) => {
      if (name === 'next/server') return { NextResponse: { json: (body) => body } };
      if (name.includes('latest.sig.example.json')) return signature;
      return manifest;
    },
  });
  return m.exports.GET;
}

for (const [name, fetch] of [
  ['network failure', async () => { throw Error('offline'); }],
  ['rate limit', async () => ({ ok: false })],
  ['empty directory', async () => ({ ok: true, json: async () => [] })],
  ['invalid response', async () => ({ ok: true, json: async () => ({ message: 'unavailable' }) })],
]) {
  test(`release manifest survives ${name}`, async () => {
    const result = await load(fetch)();
    assert.deepEqual(result.windows, manifest.windows);
    assert.deepEqual(result.android, manifest.android);
    assert.equal(result.signature.schema, signature.schema);
    assert.equal(result.signature.payloadSha256, signature.payloadSha256);
  });
}

test('one platform can update while the other uses its fallback', async () => {
  const result = await load(async (url, options) => {
    assert.ok(options.signal);
    if (url.includes('android-app')) throw Error('timeout');
    return { ok: true, json: async () => [
      { type: 'file', name: 'Vibe-Setup-BETA-0.4.1-x64.exe', download_url: 'https://example.com/new.exe' },
      { type: 'file', name: 'Vibe-Setup-BETA-0.3.10-x64.exe', download_url: 'https://example.com/old.exe' },
    ] };
  })();
  assert.equal(result.windows.version, '0.4.1');
  assert.equal(result.windows.downloadUrl, 'https://example.com/new.exe');
  assert.equal(result.windows.sha256, manifest.windows.sha256);
  assert.equal(result.windows.sizeBytes, manifest.windows.sizeBytes);
  assert.deepEqual(result.android, manifest.android);
});

test('unknown newer files are ignored until integrity metadata is committed', async () => {
  const result = await load(async (url) => {
    if (url.includes('android-app')) return { ok: true, json: async () => [
      { type: 'file', name: 'Vibe-BETA-9.9.9.apk', download_url: 'https://example.com/unknown.apk' },
    ] };
    return { ok: true, json: async () => [] };
  })();
  assert.deepEqual(result.android, manifest.android);
  assert.deepEqual(result.windows, manifest.windows);
  assert.equal(result.signature.schema, signature.schema);
});
