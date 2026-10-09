const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const manifest = require('../public/releases/latest.json');
const { buildSignatureEnvelope, verifySignatureEnvelope } = require('./release-signature.cjs');

function createKeys() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  return {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
  };
}

test('release signature envelope verifies the current native manifest', () => {
  const keys = createKeys();
  const envelope = buildSignatureEnvelope({
    source: manifest,
    privateKeyPem: keys.privateKeyPem,
    keyId: 'test-key',
  });

  assert.equal(envelope.schema, 'vibe-release-manifest-signature/v1');
  assert.equal(envelope.algorithm, 'Ed25519');
  assert.equal(envelope.keyId, 'test-key');
  assert.match(envelope.payloadSha256, /^[A-F0-9]{64}$/);
  assert.ok(verifySignatureEnvelope({ source: manifest, envelope, publicKeyPem: keys.publicKeyPem }));
});

test('release signature rejects tampered manifest metadata', () => {
  const keys = createKeys();
  const envelope = buildSignatureEnvelope({
    source: manifest,
    privateKeyPem: keys.privateKeyPem,
    keyId: 'test-key',
  });

  assert.throws(() => verifySignatureEnvelope({
    source: {
      ...manifest,
      android: { ...manifest.android, sizeBytes: manifest.android.sizeBytes + 1 },
    },
    envelope,
    publicKeyPem: keys.publicKeyPem,
  }), /payload digest/);
});

test('release signature rejects missing signature fields', () => {
  const keys = createKeys();
  assert.throws(() => verifySignatureEnvelope({
    source: manifest,
    envelope: {
      algorithm: 'Ed25519',
      keyId: 'test-key',
      payloadSha256: '93280877646E44F3CC63B90086C114B8F5F0BE2C93DDF552820419DC113ED17F',
      schema: 'vibe-release-manifest-signature/v1',
      signature: '',
    },
    publicKeyPem: keys.publicKeyPem,
  }), /signature/);
});
