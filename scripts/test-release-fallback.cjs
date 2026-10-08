const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const manifest = require('../public/releases/latest.json');

function load(fetch) {
  const m = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/api/releases/latest/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, {
    module: m, exports: m.exports, fetch, AbortSignal,
    require: (name) => name === 'next/server' ? { NextResponse: { json: (body) => body } } : manifest,
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
  assert.deepEqual(result.android, manifest.android);
});
