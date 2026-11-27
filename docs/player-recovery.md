# Anonymous player recovery

This milestone is not deployed. The complete additive schema and function
definitions are in
[`20261127000200_player_recovery.sql`](../supabase/migrations/20261127000200_player_recovery.sql).
No notification system is included.

## Contract

`POST /functions/v1/player-identity` accepts JSON:

- Registration: `{ "action": "register", "join_code": "123456", "name": "...", "mobile": "...", "credential": "<handle>.<secret>" }`.
- Recovery: `{ "action": "recover", "join_code": "123456", "credential": "<handle>.<secret>" }`.

The browser generates a random UUIDv4 handle and a separate 32-byte random
secret, encoded as unpadded base64url. The Edge Function hashes the secret as
SHA-256 of UTF-8 `chaos-crawl:player-recovery:v1`, a zero byte, and the 32
secret bytes. It stores only the digest. The first successful registration
response includes `recovery_credential`; an interrupted retry does not echo it
again. Both operations return `join_code`, `player_name`, `player_token` and
`resumed`. Errors are generic JSON objects with an `error` field. POST and
OPTIONS are supported; request bodies are limited to 4096 bytes.

Before registration, the browser persists an AES-GCM encrypted pending copy in
IndexedDB with a non-extractable key. It retries the same credential if the
response is lost, and removes that copy on continuing past setup. This is not
protection against malicious scripts running on the same origin: they can use
the stored key. Browser storage eviction, private browsing restrictions, or
clearing site data can still make an interrupted registration unrecoverable.
On reload, the player must submit the join form again to resume setup.

Recovery checks the candidate digest with the runtime's `timingSafeEqual`,
then a service-only SQL transaction locks the session and credential and
compares the revision and previous token before replacing it. The credential
remains reusable; there is no user-facing rotation or revocation yet. Existing
players retain their current tokens and are not automatically enrolled. If an
existing player loses their token without an established recovery credential,
there is no self-service recovery; independent verification is not implemented.

## Database and security

The migration creates `cc_player_recovery_credentials` with a composite
player/session foreign key, unique handle, 32-byte digest, version, revision,
creation/rotation/revocation timestamps, and one active credential per player.
`cc_player_identity_attempts` holds minute rate-limit counters. Both tables
have RLS enabled and no direct grants to browser roles or `service_role`.
Security-definer functions with empty search paths expose registration,
candidate lookup, registration retry, token replacement, and rate limiting
only to `service_role`. `cc_join_game_session` instead raises an upgrade
message; previously shipped clients may display their own generic error.
The host participation RPC is unchanged.

The limiter allows eight attempts per handle and 300 attempts globally per
minute, including registration. These shared buckets can be exhausted by an
attacker and cause denial of service; they are not a substitute for edge-level
per-source abuse controls. They do not prove phone ownership. Completed games
cannot be recovered. The implementation never accepts a player ID from the
browser. Keep request bodies, recovery codes, tokens, and database credentials
out of logs, traces and analytics.

## Deployment planning

Do not deploy without independent security review and a disposable full-schema
staging test. Confirm the target database constraints and all exposed token
issuance functions have not changed. Stage the Edge Function with JWT
verification disabled as configured, keeping `SUPABASE_SERVICE_ROLE_KEY`
server-side only. Apply the migration and release the compatible frontend in a
coordinated maintenance window: the migration disables old joins immediately,
and old cached clients cannot use the new flow. Verify that platform gateway,
function, proxy and error logging do not record request bodies. Establish
additional abuse protection and an independently verified support process
before production. No deployment commands have been run as part of this work.

## Testing

Run `npx vitest run tests/support/playerIdentity.test.ts src/pages/JoinV2.test.tsx src/features/player-access/playerAccessLifecycle.test.tsx`
and `npx playwright test tests/join.spec.ts tests/playerIdentity.spec.ts`.
Mocked browser and handler tests never use the live backend.

For SQL, apply the migration only to a disposable database containing the V2
schema and roles, then run `psql -v ON_ERROR_STOP=1 -f tests/database/player_recovery.sql`.
The additional `tests/database/player_recovery_concurrent.sql` requires
`dblink`, administrative local connection privileges, and a fresh disposable
database: it creates an extension and commits test rows. Run it with
`psql -v ON_ERROR_STOP=1 -f tests/database/player_recovery_concurrent.sql`.
Never run these tests against production. The repository does not include the
complete V2 baseline schema; a minimal fixture is useful for focused checks,
but cannot prove full deployed-schema compatibility.
