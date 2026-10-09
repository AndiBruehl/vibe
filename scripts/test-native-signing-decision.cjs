const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const decision = fs.readFileSync('docs/acceptance/native-signing-0.4.11.md', 'utf8');

test('native signing decision keeps production release gates explicit', () => {
  for (const required of [
    'debug keystore',
    'must not be committed',
    'protected release signing key',
    'outside the repository',
    'certificate migration',
    'GitGuardian closure evidence',
    'detached release-metadata signature',
    'Installed-device acceptance evidence',
    'Do not create private signing keys',
    'Do not update public download metadata',
  ]) {
    assert.ok(decision.includes(required), `missing ${required}`);
  }
});
