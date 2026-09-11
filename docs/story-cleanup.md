# Story expiration

Stories are hidden after 24 hours. The open client removes expired slides and
closes the viewer at the next expiration, even when playback is paused. Focus
and visibility changes recheck expiration after background suspension.

The hourly Vercel cron calls `/api/cron/stories`. Before deployment, configure a
random `CRON_SECRET` in Vercel and ensure the hosting plan supports hourly crons.
Vercel sends it as a bearer token. `PINATA_JWT` must allow listing and deleting
public files. No secret values belong in Git.

Each run processes up to 20 expired uploads, oldest first. Storage deletion runs
before the database transaction; failures leave records for a retry. Images
referenced by posts, avatars, messages, or unexpired stories are retained.
Unreferenced images are removed from this Pinata account, followed by story
slides, view records, and the story itself. IPFS copies held by other parties
cannot be erased by unpinning from our account.

Visibility expires at 24 hours; physical cleanup follows on a successful cron
run and may lag further during outages or a backlog. The cleanup endpoint must
not be invoked against production as a smoke test: it actually deletes data.
