const crypto = require('node:crypto');
const manifest = require('../public/releases/latest.json');
const { buildSigningPayload, canonicalJson, payloadDigest } = require('./build-release-signing-payload.cjs');

const SCHEMA = 'vibe-release-manifest-signature/v1';
const ALGORITHM = 'Ed25519';

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Release signature field ${field} must be a non-empty string.`);
  }
}

function buildSignatureEnvelope({ source = manifest, privateKeyPem, keyId }) {
  assertNonEmptyString(privateKeyPem, 'privateKeyPem');
  assertNonEmptyString(keyId, 'keyId');

  const payload = buildSigningPayload(source);
  const canonical = canonicalJson(payload);
  const signature = crypto.sign(null, Buffer.from(canonical, 'utf8'), privateKeyPem).toString('base64');

  return {
    algorithm: ALGORITHM,
    keyId,
    payloadSha256: payloadDigest(payload),
    schema: SCHEMA,
    signature,
  };
}

function verifySignatureEnvelope({ source = manifest, envelope, publicKeyPem }) {
  assertNonEmptyString(publicKeyPem, 'publicKeyPem');

  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Release signature envelope must be an object.');
  }

  if (envelope.schema !== SCHEMA) {
    throw new Error(`Release signature schema must be ${SCHEMA}.`);
  }

  if (envelope.algorithm !== ALGORITHM) {
    throw new Error(`Release signature algorithm must be ${ALGORITHM}.`);
  }

  assertNonEmptyString(envelope.keyId, 'keyId');
  assertNonEmptyString(envelope.payloadSha256, 'payloadSha256');
  assertNonEmptyString(envelope.signature, 'signature');

  const payload = buildSigningPayload(source);
  const expectedDigest = payloadDigest(payload);
  if (envelope.payloadSha256.toUpperCase() !== expectedDigest) {
    throw new Error('Release signature payload digest does not match the manifest.');
  }

  const canonical = canonicalJson(payload);
  const signature = Buffer.from(envelope.signature, 'base64');
  const verified = crypto.verify(null, Buffer.from(canonical, 'utf8'), publicKeyPem, signature);
  if (!verified) {
    throw new Error('Release signature verification failed.');
  }

  return true;
}

if (require.main === module) {
  const publicKeyPem = process.env.VIBE_RELEASE_PUBLIC_KEY_PEM;
  const signaturePath = process.argv[2] ?? 'public/releases/latest.sig.json';
  const envelope = require(`../${signaturePath.replace(/\\/g, '/')}`);
  verifySignatureEnvelope({ envelope, publicKeyPem });
  process.stdout.write('release signature verified\n');
}

module.exports = { ALGORITHM, SCHEMA, buildSignatureEnvelope, verifySignatureEnvelope };
