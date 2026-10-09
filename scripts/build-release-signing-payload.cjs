const fs = require('node:fs');
const crypto = require('node:crypto');
const manifest = require('../public/releases/latest.json');

const PLATFORMS = ['android', 'windows'];

function assertNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Release manifest field ${field} must be a non-empty string.`);
  }
}

function assertSha256(value, field) {
  assertNonEmptyString(value, field);
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`Release manifest field ${field} must be a 64-character SHA-256 hex digest.`);
  }
}

function assertSize(value, field) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Release manifest field ${field} must be a positive safe integer.`);
  }
}

function normalizeRelease(platform, release) {
  if (!release || typeof release !== 'object') {
    throw new Error(`Release manifest platform ${platform} must be an object.`);
  }

  assertNonEmptyString(release.version, `${platform}.version`);
  assertNonEmptyString(release.downloadUrl, `${platform}.downloadUrl`);
  assertSha256(release.sha256, `${platform}.sha256`);
  assertSize(release.sizeBytes, `${platform}.sizeBytes`);

  return {
    downloadUrl: release.downloadUrl,
    platform,
    sha256: release.sha256.toUpperCase(),
    sizeBytes: release.sizeBytes,
    version: release.version,
  };
}

function buildSigningPayload(source = manifest) {
  const payload = {
    schema: 'vibe-release-manifest-signing-payload/v1',
    releaseName: source.releaseName ?? '',
    releases: PLATFORMS.map((platform) => normalizeRelease(platform, source[platform])),
  };

  assertNonEmptyString(payload.releaseName, 'releaseName');
  return payload;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function payloadDigest(payload = buildSigningPayload()) {
  const canonical = canonicalJson(payload);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex').toUpperCase();
}

if (require.main === module) {
  const payload = buildSigningPayload();
  const canonical = canonicalJson(payload);
  process.stdout.write(`${canonical}\n`);
  process.stderr.write(`payloadSha256=${payloadDigest(payload)}\n`);
}

module.exports = { buildSigningPayload, canonicalJson, payloadDigest };
