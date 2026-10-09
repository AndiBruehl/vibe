const { test } = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../public/releases/latest.json');
const { buildSigningPayload, canonicalJson, payloadDigest } = require('./build-release-signing-payload.cjs');

test('release signing payload covers both native artifacts deterministically', () => {
  const payload = buildSigningPayload();
  assert.equal(payload.schema, 'vibe-release-manifest-signing-payload/v1');
  assert.equal(payload.releaseName, manifest.releaseName);
  assert.deepEqual(payload.releases.map((release) => release.platform), ['android', 'windows']);

  for (const release of payload.releases) {
    const expected = manifest[release.platform];
    assert.equal(release.version, expected.version);
    assert.equal(release.downloadUrl, expected.downloadUrl);
    assert.equal(release.sha256, expected.sha256.toUpperCase());
    assert.equal(release.sizeBytes, expected.sizeBytes);
  }

  assert.equal(canonicalJson(payload), canonicalJson(buildSigningPayload()));
  assert.match(payloadDigest(payload), /^[A-F0-9]{64}$/);
});

test('release signing payload rejects incomplete artifact metadata', () => {
  assert.throws(() => buildSigningPayload({
    releaseName: manifest.releaseName,
    android: { ...manifest.android, sha256: '' },
    windows: manifest.windows,
  }), /android\.sha256/);

  assert.throws(() => buildSigningPayload({
    releaseName: manifest.releaseName,
    android: manifest.android,
    windows: { ...manifest.windows, sizeBytes: 0 },
  }), /windows\.sizeBytes/);
});
