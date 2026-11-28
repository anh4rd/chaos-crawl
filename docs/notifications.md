# Game notifications

The initial events are secret missions sent to a player, round changes, and
final voting opening. Each creates an in-app notice and, for subscribed
devices, a push notification. The secret-mission push contains no mission
details. The existing private mission dialog remains the in-app reveal.
Players dismiss notices in the game. There is no in-app settings screen.

## Configure event types in VS Code

The initial event switches and copy are in
[`20261128000100_player_notifications.sql`](../supabase/migrations/20261128000100_player_notifications.sql).
After that migration is applied, create a **new** Supabase migration to change
the database configuration; editing an already-applied migration does not
update the database. For example, to disable round notifications for both
channels:

```sql
update public.cc_notification_types
set enabled = false
where event_type = 'round_started';
```

Use `secret_mission`, `round_started`, or `final_voting` as the event type.
Change `title` and `body` in a new migration to adjust the copy. Existing queued
notifications retain their original copy. Adding a different event requires
adding a type and calling `cc_enqueue_notification` from a database trigger
when the event happens; use the existing triggers as examples. Keep sensitive
details out of lock-screen messages.

## Set up push delivery

These are deployment steps, not operations performed by the application build.
The existing migration history lacks the core V2 schema. Do not run `db push`
against an empty project or replay the historical migrations on a later schema
snapshot.

On 28 November 2026, a read-only check of production `vleewyedtktarpotechj`
found the original notification objects, but an empty migration history, no
notification sender function and no `cc-notification-sender` cron job. The
separate TEST project `jeeacswzqpuvfhrldkaj` does not yet have a usable app
baseline. Recheck each project's state before making changes.

The additive
[`20261128000200_notification_hardening.sql`](../supabase-test/notification-migrations/20261128000200_notification_hardening.sql)
is present in production: on 28 November 2026 its three replacement function
definitions matched the locally tested migration, and its index, column and
trigger were present. The production migration history remained empty.
Do not run it again there: its guard intentionally rejects reapplication. It is
intentionally
outside the automatic migration directory until the separate migration track
is resolved. On another database, its guards require the original notification
functions and stop on unexpected definitions or duplicate endpoints. Do not
reapply the original notification migration to production where its objects
already exist, or treat the hardening file as an empty-project baseline.

After hardening, a browser push endpoint belongs to the most recently
registered player, even across games. Changing player identity on a shared
browser transfers that endpoint and removes its older queued deliveries.
Token rotation removes that player's subscriptions; devices must register
again. A push already handed to a push provider cannot be recalled.

1. In the VS Code terminal, generate a VAPID key pair with
   `npx --yes web-push@3.6.7 generate-vapid-keys`. Keep the private key secret.
   Generate an independent sender secret with
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`.
   Keep both values out of chat, Git, screenshots and logs.
2. Put the **public** key in `VITE_VAPID_PUBLIC_KEY` in the ignored
   `.env.local` for local builds and in the deployment platform's build
   environment for production. The public key must match the sender's key.
   Restart the development server or rebuild after changing it. Never put the
   private key or sender secret in a `VITE_` variable.
3. In an ignored file such as `notification-secrets.local`, set
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a `mailto:`
   contact), and `NOTIFICATION_SENDER_SECRET`, one `NAME=value` per line.
   After confirming the intended target, set them on production with
   `npx supabase secrets set --remote=vleewyedtktarpotechj --env-file notification-secrets.local`.
   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge
   Functions. Do not copy the service-role key into the frontend.
4. After the reviewed migration is applied, deploy the function to production
   with `npx supabase functions deploy notification-sender
--remote=vleewyedtktarpotechj --no-verify-jwt`. JWT verification is disabled because the scheduled caller
   uses the independent sender secret; the function verifies that secret
   itself. Do not expose it to browsers.
5. In Supabase, enable `pg_cron`, `pg_net` and Vault. Use the SQL editor to
   store the function URL and **the same sender secret** in Vault, then create
   the scheduled job below. Replace the placeholders only in the SQL editor,
   not in a committed file. If the names already exist, update the existing
   Vault secrets rather than creating duplicate names.

   ```sql
   select vault.create_secret(
     'https://YOUR_PROJECT.supabase.co/functions/v1/notification-sender',
     'cc_notification_url'
   );
   select vault.create_secret('YOUR_SENDER_SECRET', 'cc_notification_sender_secret');

   select cron.schedule(
     'cc-notification-sender', '* * * * *',
     $job$
       select net.http_post(
         url := (select decrypted_secret from vault.decrypted_secrets
                 where name = 'cc_notification_url'),
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || (select decrypted_secret
             from vault.decrypted_secrets where name = 'cc_notification_sender_secret')
         ),
         body := '{}'::jsonb
       );
     $job$
   );
   ```

6. Deploy the frontend. Install or reopen the PWA, join a game, and select
   **Enable game alerts**. Grant notification permission when prompted.
   On iOS/iPadOS, use Safari's Share > Add to Home Screen, then open the
   installed app; web push requires version 16.4 or newer. Check device-level
   notification settings if alerts are blocked.

The scheduled sender also dispatches due secret missions while the host screen
is closed. It runs once per minute, so background notifications are not
instant. Delivery is best-effort: transient failures retry up to eight times,
expired subscriptions are removed, and a retry after an interrupted sender
may produce a duplicate. In-app notifications expire after 24 hours; notification
records are removed after 30 days when the sender runs. Inspect Edge Function
logs and the Supabase cron/HTTP job results when troubleshooting; never paste
credentials into logs or issues.
The hardened queue does not claim notices after 24 hours, but a push already
accepted by a provider can arrive later because its transport TTL is one hour.
If queue insertion fails, the notice remains visible and the sender retries
queueing while it is less than 24 hours old.
The app's in-app notices poll while the player screen is open. Neither mocked
tests nor a local migration verify a deployed push service.

Each player can register up to ten device subscriptions for a game. Expired
subscriptions are removed when the push service reports that they no longer
exist.
