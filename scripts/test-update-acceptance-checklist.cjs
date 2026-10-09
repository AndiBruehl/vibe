const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const checklist = fs.readFileSync('docs/acceptance/update-path-0.4.10.md', 'utf8');

test('installed update acceptance checklist covers required platforms and recovery paths', () => {
  for (const required of [
    'Android APK',
    'Windows desktop',
    'Update discovery',
    'Integrity mismatch',
    'Download failure',
    'Dialog evidence',
    'Download handoff',
    'Existing sign-in',
    'Evidence to record',
  ]) {
    assert.ok(checklist.includes(required), `missing ${required}`);
  }
});
