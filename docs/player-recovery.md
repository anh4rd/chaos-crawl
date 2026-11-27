# Anonymous player recovery

The local milestone's original additive schema and function definitions are in
[`20261127000200_player_recovery.sql`](../supabase/migrations/20261127000200_player_recovery.sql).
Deployment state must be verified for each environment. No notification system
is included.

## Contract

`POST /functions/v1/player-identity` accepts JSON:

- Registration: `{ "action": "register", "join_code": "123456", "name": "...", "mobile": "...", "credential": "<handle>.<secret>" }`.
- Recovery: `{ "action": "recover", "join_code": "123456", "credential": "<handle>.<secret>" }`.
- Temporary phone recovery: `{ "action": "recover_phone", "join_code": "123456", "mobile": "..." }`.

The browser generates a random UUIDv4 handle and a separate 32-byte random
secret, encoded as unpadded base64url. The Edge Function hashes the secret as
SHA-256 of UTF-8 `chaos-crawl:player-recovery:v1`, a zero byte, and the 32
secret bytes. It stores only the digest. The first successful registration
response includes `recovery_credential`; an interrupted retry does not echo it
again. Both operations return `join_code`, `player_name`, `player_token` and
`resumed`. Errors are generic JSON objects with an `error` field. POST and
OPTIONS are supported; request bodies are limited to 4096 bytes.

The phone number is optional for new registrations. Leaving it blank creates a
new player, not a recovery of an existing player; the server stores a null
phone and still issues a player token and recovery credential. A nonempty
number must contain 8–15 digits and cannot duplicate another player's number
in the game. New registrations are currently accepted only while the session
is in its lobby. This requires
[`20261127000400_optional_player_phone.sql`](../supabase/migrations/20261127000400_optional_player_phone.sql)
and the matching Edge Function update. Existing player records and tokens are
not changed.
The join form offers calling-code choices and an input for other calling codes.
The player supplies the number as dialled from abroad; UK numbers may retain
the leading zero. An explicitly international number beginning with `+` or
`00` takes precedence over the selection.

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
the temporary phone option below is the only self-service alternative when
available. Independent verification is not implemented.

On the join screen, a saved player token is checked with
`cc_get_game_session_view` before asking for details. A valid token resumes the
existing player without rotating it. An expired token offers phone or credential
recovery; an unavailable session check reports an error instead of treating a
network problem as lost identity.

## Temporary phone recovery for the birthday event

This is deliberately insecure: anyone who knows a player's game code and phone
number can take over that player, view their game information and invalidate
their existing token. It applies to all eligible games after deployment.
Players without a stored phone cannot use it; their recovery code remains an
alternative. Recovery uses the same UK normalization as registration. It is
limited per normalized game/number and by the existing global rate limiter.
The temporary endpoint creates a new token and preserves existing recovery
credentials. Concurrent requests can invalidate earlier returned tokens.

[`20261127000500_temporary_phone_recovery.sql`](../supabase/migrations/20261127000500_temporary_phone_recovery.sql)
creates an RLS-protected private game allowlist and a service-role-only RPC.
[`20261127000600_phone_recovery_all_games.sql`](../supabase/migrations/20261127000600_phone_recovery_all_games.sql)
then removes the allowlist requirement from that RPC for all existing and
future eligible games. Old allowlist entries, including expired entries, no
longer control access. The old table remains private but unused. The database
refuses phone-only recovery after **30 November 2026 at 12:00 UTC**. Changing
this deadline requires a reviewed migration. The existing recovery-code path
remains available.

After review, apply the migrations in order and deploy the compatible
`player-identity` Edge Function and frontend. Verify the function is deployed
with JWT verification disabled and its service-role key remains server-only.
There is no per-game activation step. To disable phone recovery for all games
sooner, an administrator can revoke the RPC from the Edge Function's role:

```sql
revoke execute on function public.cc_recover_player_with_phone(text, text) from service_role;
```

This does not change existing player tokens or credential recovery. Do not
include phone numbers, request bodies or tokens in logs. No deployment has been
performed by this work.

## Database and security

The migration creates `cc_player_recovery_credentials` with a composite
player/session foreign key, unique handle, 32-byte digest, version, revision,
creation/rotation/revocation timestamps, and one active credential per player.
`cc_player_identity_attempts` holds minute rate-limit counters. Both tables
have RLS enabled and no direct grants to browser roles or `service_role`.
Security-definer functions with empty search paths expose registration,
candidate lookup, registration retry, token replacement, and rate limiting
only to `service_role`. The temporary phone RPC is also service-only and checks
the expiry inside its transaction. `cc_join_game_session` instead raises an upgrade
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

After deploying the Edge Function, verify a browser preflight returns HTTP 204
and allows `authorization`, `apikey`, `content-type`, and `x-client-info`.
The Supabase gateway can return 404 for a missing function; browsers report
that failed preflight as a CORS error before the join request is sent.

## Testing

Run `npx vitest run tests/support/playerIdentity.test.ts src/pages/JoinV2.test.tsx src/features/player-access/playerAccessLifecycle.test.tsx`
and `npx playwright test tests/join.spec.ts tests/playerIdentity.spec.ts`.
Mocked browser and handler tests never use the live backend.

For SQL, apply migrations in order only to a disposable database containing the
V2 schema and roles. Run `psql -v ON_ERROR_STOP=1 -f tests/database/player_recovery.sql`
after migration 004, and `psql -v ON_ERROR_STOP=1 -f tests/database/temporary_phone_recovery.sql`
after migration 005 and before migration 006. After migration 006, run
`psql -v ON_ERROR_STOP=1 -f tests/database/temporary_phone_recovery_all_games.sql`.
The successful phone recovery portions run only before the hard expiry.
The additional `tests/database/player_recovery_concurrent.sql` requires
`dblink`, administrative local connection privileges, and a fresh disposable
database: it creates an extension and commits test rows. Run it with
`psql -v ON_ERROR_STOP=1 -f tests/database/player_recovery_concurrent.sql`.
Never run these tests against production. The repository does not include the
complete V2 baseline schema; a minimal fixture is useful for focused checks,
but cannot prove full deployed-schema compatibility.
