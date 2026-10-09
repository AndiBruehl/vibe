# VIBE 0.4.11 - Native signing decision record

This record separates what is allowed for local beta builds from what is required before a production native release.

## Current boundary

- Android debug and beta builds may use Android tooling's local debug signing flow for local testing.
- The debug keystore and debug passwords must not be committed to the repository.
- Windows beta installers may remain unsigned while clearly documented as beta artifacts.
- Published release metadata must stay pinned to the last accepted native artifacts until rebuilt files, hashes, sizes and acceptance evidence exist.

## Production Android gate

Before a production Android release, VIBE needs:

- A protected release signing key generated and stored outside the repository.
- A clear certificate migration decision for users who installed debug-signed beta APKs.
- A rebuilt APK signed with the chosen production key.
- Recorded SHA-256 and byte-size metadata for the exact rebuilt APK.
- A detached release-metadata signature made with the external private key.
- Installed-device acceptance evidence for login, linking, update discovery, integrity mismatch recovery and browser fallback.
- GitGuardian closure evidence that references the removed committed debug material and confirms no production credential was exposed.

## Production Windows gate

Before a production Windows release, VIBE needs:

- A decision whether to keep unsigned beta installers or use a code-signing certificate.
- A rebuilt EXE with recorded SHA-256 and byte-size metadata.
- A detached release-metadata signature made with the external private key.
- Installed-device acceptance evidence for update check, download handoff, unavailable-check recovery and account/session preservation.

## Explicit non-goals for this local step

- Do not create private signing keys in the repository.
- Do not commit keystores, certificates, private keys or passwords.
- Do not mark APK/EXE artifacts accepted without installed-device evidence.
- Do not update public download metadata to new native versions until rebuilt artifacts and matching metadata exist.
