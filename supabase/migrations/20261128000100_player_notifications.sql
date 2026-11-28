-- Edit these rows to enable events or change their notification copy.
create table public.cc_notification_types (
  event_type text primary key,
  enabled boolean not null default true,
  title text not null,
  body text not null
);
insert into public.cc_notification_types (event_type, title, body) values
  ('secret_mission', 'Chaos Crawl', 'You have a new secret mission. Open the game to see it.'),
  ('round_started', 'Chaos Crawl', 'A new round has started.'),
  ('final_voting', 'Chaos Crawl', 'Final round voting is open.');

create table public.cc_player_notifications (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  player_id uuid not null,
  event_type text not null references public.cc_notification_types(event_type),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  foreign key (player_id, session_id)
    references public.cc_game_session_players(id, session_id) on delete cascade
);

create table public.cc_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  player_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  unique (player_id, endpoint),
  foreign key (player_id, session_id)
    references public.cc_game_session_players(id, session_id) on delete cascade
);

create table public.cc_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.cc_player_notifications(id) on delete cascade,
  subscription_id uuid not null references public.cc_push_subscriptions(id) on delete cascade,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  delivered_at timestamptz,
  unique (notification_id, subscription_id)
);

create index cc_player_notifications_player_created
  on public.cc_player_notifications (player_id, created_at);
create index cc_player_notifications_created
  on public.cc_player_notifications (created_at);
create index cc_push_deliveries_ready
  on public.cc_push_deliveries (next_attempt_at)
  where delivered_at is null and attempts < 8;

alter table public.cc_notification_types enable row level security;
alter table public.cc_player_notifications enable row level security;
alter table public.cc_push_subscriptions enable row level security;
alter table public.cc_push_deliveries enable row level security;
revoke all on public.cc_notification_types, public.cc_player_notifications,
  public.cc_push_subscriptions, public.cc_push_deliveries from public, anon, authenticated;

create function public.cc_notification_player(p_join_code text, p_player_token uuid)
returns uuid language sql stable security definer set search_path = ''
as $$
  select p.player_id
  from public.cc_game_session_player_private p
  join public.cc_game_sessions s on s.id = p.session_id
  where s.join_code = p_join_code and p.player_token = p_player_token
$$;
revoke all on function public.cc_notification_player(text, uuid) from public, anon, authenticated;

create function public.cc_register_push_subscription(
  p_join_code text, p_player_token uuid, p_endpoint text, p_p256dh text, p_auth text
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_player uuid := public.cc_notification_player(p_join_code, p_player_token);
  v_session uuid;
begin
  if v_player is null then raise exception 'Player session is invalid.'; end if;
  if p_endpoint is null or length(p_endpoint) > 2048 or
    p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/[A-Za-z0-9_./~%?=&+-]+$'
    or p_p256dh !~ '^[A-Za-z0-9_-]{87}$' or p_auth !~ '^[A-Za-z0-9_-]{22}$' then
    raise exception 'Invalid push subscription.';
  end if;
  select session_id into v_session from public.cc_game_session_players where id = v_player for update;
  if not exists (
    select 1 from public.cc_push_subscriptions where player_id = v_player and endpoint = p_endpoint
  ) and (select count(*) from public.cc_push_subscriptions where player_id = v_player) >= 10 then
    raise exception 'Too many devices are registered for this player.';
  end if;
  insert into public.cc_push_subscriptions (session_id, player_id, endpoint, p256dh, auth)
  values (v_session, v_player, p_endpoint, p_p256dh, p_auth)
  on conflict (player_id, endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth;
end;
$$;

create function public.cc_get_player_notifications(p_join_code text, p_player_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_player uuid := public.cc_notification_player(p_join_code, p_player_token);
begin
  if v_player is null then raise exception 'Player session is invalid.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', n.id, 'event_type', n.event_type,
      'title', n.title, 'body', n.body) order by n.created_at)
    from public.cc_player_notifications n
    where n.player_id = v_player and n.dismissed_at is null
      and n.created_at > now() - interval '24 hours'
  ), '[]'::jsonb);
end;
$$;

create function public.cc_dismiss_player_notification(
  p_join_code text, p_player_token uuid, p_notification_id uuid
)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_player uuid := public.cc_notification_player(p_join_code, p_player_token);
begin
  if v_player is null then raise exception 'Player session is invalid.'; end if;
  update public.cc_player_notifications set dismissed_at = now()
  where id = p_notification_id and player_id = v_player;
end;
$$;

revoke all on function public.cc_register_push_subscription(text, uuid, text, text, text) from public;
revoke all on function public.cc_get_player_notifications(text, uuid) from public;
revoke all on function public.cc_dismiss_player_notification(text, uuid, uuid) from public;
grant execute on function public.cc_register_push_subscription(text, uuid, text, text, text) to anon, authenticated;
grant execute on function public.cc_get_player_notifications(text, uuid) to anon, authenticated;
grant execute on function public.cc_dismiss_player_notification(text, uuid, uuid) to anon, authenticated;

create function public.cc_enqueue_notification(p_session uuid, p_player uuid, p_event text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  with inserted as (
    insert into public.cc_player_notifications (session_id, player_id, event_type, title, body)
    select p.session_id, p.id, t.event_type, t.title, t.body
    from public.cc_game_session_players p
    join public.cc_notification_types t on t.event_type = p_event and t.enabled
    where p.session_id = p_session and (p_player is null or p.id = p_player)
    returning id, player_id
  )
  insert into public.cc_push_deliveries (notification_id, subscription_id)
  select i.id, s.id from inserted i
  join public.cc_push_subscriptions s on s.player_id = i.player_id;
end;
$$;
revoke all on function public.cc_enqueue_notification(uuid, uuid, text) from public, anon, authenticated;

create function public.cc_notification_secret_trigger()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'sent' and (tg_op = 'INSERT' or old.status is distinct from 'sent') then
    perform public.cc_enqueue_notification(new.session_id, new.player_id, 'secret_mission');
  end if;
  return new;
end;
$$;
create trigger cc_notify_secret_mission
after insert or update of status on public.cc_game_session_secret_assignments
for each row execute function public.cc_notification_secret_trigger();

create function public.cc_notification_session_trigger()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'live' and new.current_round_number > 0 and
    (old.current_round_number is distinct from new.current_round_number or old.status <> 'live') then
    perform public.cc_enqueue_notification(new.id, null, 'round_started');
  end if;
  if new.final_voting_open and not coalesce(old.final_voting_open, false) then
    perform public.cc_enqueue_notification(new.id, null, 'final_voting');
  end if;
  return new;
end;
$$;
create trigger cc_notify_session_changes
after update of status, current_round_number, final_voting_open on public.cc_game_sessions
for each row execute function public.cc_notification_session_trigger();

create function public.cc_claim_push_deliveries()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  delete from public.cc_player_notifications where created_at < now() - interval '30 days';
  update public.cc_game_session_secret_assignments a
  set status = 'sent', sent_at = coalesce(a.sent_at, now())
  from public.cc_game_sessions s
  where s.id = a.session_id and s.status = 'live' and a.status = 'scheduled'
    and a.scheduled_at <= now();

  with candidates as (
      select d.id from public.cc_push_deliveries d
      where d.delivered_at is null and d.attempts < 8 and d.next_attempt_at <= now()
        and (d.lease_until is null or d.lease_until < now())
      order by d.next_attempt_at
      for update skip locked limit 100
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

create function public.cc_finish_push_delivery(p_id uuid, p_lease uuid, p_outcome text)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_subscription uuid;
begin
  if p_outcome not in ('sent', 'expired', 'retry') then raise exception 'Invalid delivery outcome.'; end if;
  update public.cc_push_deliveries
  set delivered_at = case when p_outcome = 'sent' then now() else null end,
      next_attempt_at = now() + interval '1 minute' * least(30, attempts * attempts),
      lease_token = null, lease_until = null
  where id = p_id and lease_token = p_lease
  returning subscription_id into v_subscription;
  if p_outcome = 'expired' and v_subscription is not null then
    delete from public.cc_push_subscriptions where id = v_subscription;
  end if;
end;
$$;
revoke all on function public.cc_claim_push_deliveries() from public, anon, authenticated;
revoke all on function public.cc_finish_push_delivery(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.cc_claim_push_deliveries() to service_role;
grant execute on function public.cc_finish_push_delivery(uuid, uuid, text) to service_role;
