# VIBE 0.5.0 native release readiness

This checklist records what can be prepared locally and what still requires external signing material or installed-device evidence.

## Prepared locally

- [x] Web version metadata set to 0.5.0.
- [x] Android version metadata set to 0.5.0 / versionCode 100.
- [x] Desktop version metadata set to 0.5.0.
- [x] Public native release manifest remains pinned to accepted 0.4.1 artifacts.
- [x] Unsigned placeholder signature remains clearly marked as unprovisioned.
- [x] Automated readiness guard documents the remaining blockers.

## Blocked until external artifacts/evidence exist

- [ ] Rebuilt Android APK for 0.5.0 exists in `android-app/dist/`.
- [ ] Rebuilt Windows EXE for 0.5.0 exists in `electron-app/dist/`.
- [ ] SHA-256 and byte-size metadata are recorded for the exact rebuilt files.
- [ ] Release metadata has a real detached Ed25519 signature from a protected external key.
- [ ] Android installed-device acceptance is recorded.
- [ ] Windows installed-device acceptance is recorded.
- [ ] GitGuardian/signing evidence is attached outside the repository.

## Release rule

Do not update `public/releases/latest.json` to 0.5.0 until every blocked item above is complete. The web changelog may advertise this as local readiness only; APK/EXE downloads stay on 0.4.1 until rebuilt, signed and accepted.
