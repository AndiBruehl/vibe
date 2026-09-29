const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function route({ results = [], fetchStatus = 200, storageFailure = false } = {}) {
  const writes = [];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/app/api/profile/location/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Number, AbortSignal,
    fetch: async () => ({ ok: fetchStatus === 200, json: async () => results }),
    require: (name) => {
      if (name === '@/auth') return { auth: async () => ({ user: { email: 'test@example.invalid' } }) };
      if (name === '@/db') return { prisma: { profile: { update: async (args) => { if (storageFailure) throw Error('offline'); writes.push(args); } } } };
      if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } };
      throw Error(name);
    },
  });
  return { writes, post: (body) => module.exports.POST({ json: async () => body }) };
}

test('arbitrary names return valid choices without publishing until selected', async () => {
  for (const address of ['Hell', 'Heaven', 'Underworld', 'Schillerstraße 66 Erfurt', '東京', 'X']) {
    const api = route({ results: [{ lat: 'oops', lon: '11' }, { lat: '50.967123', lon: '11.025678', display_name: address }] });
    const result = await api.post({ enabled: true, address });
    assert.equal(result.status, 200);
    assert.equal(result.body.candidates[0].latitude, 50.967123);
    assert.equal(api.writes.length, 0);
    const selected = result.body.candidates[0];
    const saved = await api.post({ enabled: true, ...selected, address: selected.label, precision: 'exact' });
    assert.equal(saved.body.latitude, 50.96712);
    assert.equal(saved.body.longitude, 11.02568);
    assert.equal(api.writes.length, 1);
  }
});
test('approximate privacy also applies to selected addresses', async () => {
  const api = route();
  const saved = await api.post({ enabled: true, latitude: 50.967123, longitude: 11.025678, address: 'A precise street address', precision: 'approximate' });
  assert.equal(saved.body.latitude, 51);
  assert.equal(saved.body.longitude, 11);
  assert.equal(saved.body.resolvedAddress, null);
  assert.equal(api.writes[0].data.locationLabel, null);
});
test('no match preserves the saved location', async () => {
  const api = route();
  assert.equal((await api.post({ enabled: true, address: 'unknown' })).body.error, 'AddressNotFound');
  assert.equal(api.writes.length, 0);
});
test('provider failure and malformed responses are not reported as nonexistent places', async () => {
  for (const options of [{ fetchStatus: 429 }, { results: {} }]) {
    const api = route(options);
    assert.equal((await api.post({ enabled: true, address: 'Berlin' })).body.error, 'AddressLookupUnavailable');
    assert.equal(api.writes.length, 0);
  }
});
test('coordinate fallback accepts zero and rejects out-of-range coordinates', async () => {
  const api = route();
  assert.equal((await api.post({ enabled: true, latitude: 0, longitude: 0 })).status, 200);
  assert.equal((await api.post({ enabled: true, latitude: 91, longitude: 0 })).status, 400);
  assert.equal(api.writes.length, 1);
});
test('storage failure is distinct from geocoder failure', async () => {
  const api = route({ storageFailure: true });
  assert.equal((await api.post({ enabled: true, latitude: 51, longitude: 11 })).body.error, 'Unavailable');
});
test('stopping sharing removes stored location data', async () => {
  const api = route();
  assert.equal((await api.post({ enabled: false })).status, 200);
  assert.equal(api.writes[0].data.locationLabel, null);
  assert.equal(api.writes[0].data.locationLatitude, null);
  assert.equal(api.writes[0].data.locationSharingEnabled, false);
});
