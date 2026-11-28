-- Apply only after 20261128000100_player_notifications.sql and its prerequisites.
-- Refuse to replace an unexpected implementation or reapply this migration.
do $$
begin
  if pg_catalog.md5(pg_catalog.pg_get_functiondef(
      'public.cc_register_push_subscription(text,uuid,text,text,text)'::regprocedure
    )) <> '7fdb232c91c6bb57889c3427382df024'
    or pg_catalog.md5(pg_catalog.pg_get_functiondef(
      'public.cc_enqueue_notification(uuid,uuid,text)'::regprocedure
    )) <> '5b4567986d6a9c57a6281ab904a703e9'
    or pg_catalog.md5(pg_catalog.pg_get_functiondef(
      'public.cc_claim_push_deliveries()'::regprocedure
    )) <> '1f77a5c70fd3559074c142c8bd9cf59e' then
    raise exception 'Unexpected notification function definitions; review before applying hardening.';
  end if;
end;
$$;

-- The unique index fails without deleting existing subscriptions if duplicates exist.
create unique index cc_push_subscriptions_endpoint_unique
  on public.cc_push_subscriptions (endpoint);

alter table public.cc_player_notifications
  add column push_queue_pending boolean not null default false;
create index cc_player_notifications_pending_push
  on public.cc_player_notifications (created_at)
  where push_queue_pending;

create or replace function public.cc_register_push_subscription(
  p_join_code text, p_player_token uuid, p_endpoint text, p_p256dh text, p_auth text
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_player uuid;
  v_session uuid;
begin
  if p_endpoint is null or length(p_endpoint) > 2048 or
    p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/[A-Za-z0-9_./~%?=&+-]+$'
    or p_p256dh is null or p_p256dh !~ '^[A-Za-z0-9_-]{87}$'
    or p_auth is null or p_auth !~ '^[A-Za-z0-9_-]{22}$' then
    raise exception 'Invalid push subscription.';
  end if;

  select p.player_id, p.session_id into v_player, v_session
  from public.cc_game_session_player_private p
  join public.cc_game_sessions s on s.id = p.session_id
  where s.join_code = p_join_code and p.player_token = p_player_token
  for update of p;
  if v_player is null then raise exception 'Player session is invalid.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_endpoint, 0));
  perform 1 from public.cc_game_session_players where id = v_player for update;
  if not exists (
    select 1 from public.cc_push_subscriptions where player_id = v_player and endpoint = p_endpoint
  ) and (select count(*) from public.cc_push_subscriptions where player_id = v_player) >= 10 then
    raise exception 'Too many devices are registered for this player.';
  end if;

  delete from public.cc_push_subscriptions
  where endpoint = p_endpoint and player_id <> v_player;
  insert into public.cc_push_subscriptions (session_id, player_id, endpoint, p256dh, auth)
  values (v_session, v_player, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;

create function public.cc_invalidate_rotated_push_subscriptions()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.player_token is distinct from new.player_token then
    delete from public.cc_push_subscriptions where player_id = old.player_id;
  end if;
  return new;
end;
$$;
revoke all on function public.cc_invalidate_rotated_push_subscriptions()
  from public, anon, authenticated, service_role;
create trigger cc_invalidate_rotated_push_subscriptions
after update of player_token on public.cc_game_session_player_private
for each row execute function public.cc_invalidate_rotated_push_subscriptions();

create or replace function public.cc_enqueue_notification(p_session uuid, p_player uuid, p_event text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_notifications uuid[];
begin
  with inserted as (
    insert into public.cc_player_notifications
      (session_id, player_id, event_type, title, body, push_queue_pending)
    select p.session_id, p.id, t.event_type, t.title, t.body, true
    from public.cc_game_session_players p
    join public.cc_notification_types t on t.event_type = p_event and t.enabled
    where p.session_id = p_session and (p_player is null or p.id = p_player)
    returning id
  )
  select pg_catalog.array_agg(id) into v_notifications from inserted;

  begin
    insert into public.cc_push_deliveries (notification_id, subscription_id)
    select n.id, s.id from public.cc_player_notifications n
    join public.cc_push_subscriptions s on s.player_id = n.player_id
    where n.id = any(v_notifications)
    on conflict (notification_id, subscription_id) do nothing;
    update public.cc_player_notifications set push_queue_pending = false
    where id = any(v_notifications);
  exception when others then
    raise warning 'Push queue insertion failed (SQLSTATE %); notices remain available and queueing will retry.', sqlstate;
  end;
end;
$$;

create or replace function public.cc_claim_push_deliveries()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_result jsonb;
  v_notification record;
begin
  delete from public.cc_player_notifications where created_at < now() - interval '30 days';
  update public.cc_game_session_secret_assignments a
  set status = 'sent', sent_at = coalesce(a.sent_at, now())
  from public.cc_game_sessions s
  where s.id = a.session_id and s.status = 'live' and a.status = 'scheduled'
    and a.scheduled_at <= now();

  for v_notification in
    select n.id, n.player_id from public.cc_player_notifications n
    where n.push_queue_pending and n.created_at > now() - interval '24 hours'
    order by n.created_at for update skip locked limit 100
  loop
    begin
      insert into public.cc_push_deliveries (notification_id, subscription_id)
      select v_notification.id, s.id from public.cc_push_subscriptions s
      where s.player_id = v_notification.player_id
      on conflict (notification_id, subscription_id) do nothing;
      update public.cc_player_notifications set push_queue_pending = false
      where id = v_notification.id;
    exception when others then
      raise warning 'Push queue retry failed (SQLSTATE %); notice remains available.', sqlstate;
    end;
  end loop;

  with candidates as (
      select d.id from public.cc_push_deliveries d
      join public.cc_player_notifications n on n.id = d.notification_id
      where d.delivered_at is null and d.attempts < 8 and d.next_attempt_at <= now()
        and (d.lease_until is null or d.lease_until < now())
        and n.created_at > now() - interval '24 hours'
      order by d.next_attempt_at
      for update of d skip locked limit 100
    ), claimed as (
      update public.cc_push_deliveries d
      set lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes',
          attempts = d.attempts + 1
      from candidates c where d.id = c.id
      returning d.*
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'lease', c.lease_token, 'endpoint', s.endpoint,
      'p256dh', s.p256dh, 'auth', s.auth, 'title', n.title, 'body', n.body,
      'join_code', g.join_code
    )), '[]'::jsonb) into v_result from claimed c
    join public.cc_push_subscriptions s on s.id = c.subscription_id
    join public.cc_player_notifications n on n.id = c.notification_id
    join public.cc_game_sessions g on g.id = n.session_id;
  return v_result;
end;
$$;
