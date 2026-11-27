create table public.cc_player_recovery_credentials (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null,
  session_id uuid not null,
  handle uuid not null unique,
  secret_digest bytea not null check (octet_length(secret_digest) = 32),
  version integer not null default 1 check (version = 1),
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  revoked_at timestamptz,
  foreign key (player_id, session_id)
    references public.cc_game_session_players(id, session_id) on delete cascade
);

create unique index cc_player_recovery_one_active
  on public.cc_player_recovery_credentials (player_id) where revoked_at is null;

create table public.cc_player_identity_attempts (
  bucket text not null,
  window_start timestamptz not null,
  attempts integer not null,
  primary key (bucket, window_start)
);

alter table public.cc_player_recovery_credentials enable row level security;
alter table public.cc_player_identity_attempts enable row level security;
revoke all on public.cc_player_recovery_credentials from public, anon, authenticated, service_role;
revoke all on public.cc_player_identity_attempts from public, anon, authenticated, service_role;

create or replace function public.cc_join_game_session(
  p_join_code text,
  p_name text default null,
  p_mobile text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Please update Chaos Crawl to join or recover your game.';
end;
$$;

create function public.cc_player_identity_rate_limit(p_handle uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := pg_catalog.date_trunc('minute', pg_catalog.now());
  v_global integer;
  v_handle integer;
begin
  delete from public.cc_player_identity_attempts
  where window_start < v_window - interval '2 hours';

  insert into public.cc_player_identity_attempts as a (bucket, window_start, attempts)
  values ('global', v_window, 1)
  on conflict (bucket, window_start) do update set attempts = a.attempts + 1
  returning attempts into v_global;
  if v_global > 300 then return false; end if;

  insert into public.cc_player_identity_attempts as a (bucket, window_start, attempts)
  values (p_handle::text, v_window, 1)
  on conflict (bucket, window_start) do update set attempts = a.attempts + 1
  returning attempts into v_handle;
  return v_handle <= 8;
end;
$$;

create function public.cc_register_player_with_recovery(
  p_join_code text,
  p_name text,
  p_mobile text,
  p_handle uuid,
  p_digest text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.cc_game_sessions%rowtype;
  v_player public.cc_game_session_players%rowtype;
  v_phone text := pg_catalog.regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g');
  v_name text := pg_catalog.btrim(coalesce(p_name, ''));
  v_token uuid := pg_catalog.gen_random_uuid();
begin
  if p_join_code !~ '^[0-9]{6}$' or p_handle is null
    or p_digest !~ '^[0-9a-f]{64}$' or v_name = ''
    or pg_catalog.length(v_name) > 60
    or pg_catalog.length(v_phone) < 8 or pg_catalog.length(v_phone) > 15 then
    return null;
  end if;
  if pg_catalog.left(v_phone, 2) = '00' then v_phone := pg_catalog.substr(v_phone, 3); end if;
  if pg_catalog.left(v_phone, 2) = '44' then
    if pg_catalog.length(v_phone) = 13 and pg_catalog.substr(v_phone, 3, 1) = '0' then
      v_phone := '0' || pg_catalog.substr(v_phone, 4);
    elsif pg_catalog.length(v_phone) = 12 then
      v_phone := '0' || pg_catalog.substr(v_phone, 3);
    end if;
  end if;
  select * into v_session from public.cc_game_sessions
  where join_code = p_join_code for update;
  if not found or v_session.status <> 'lobby'
    or (select pg_catalog.count(*) from public.cc_game_session_players
        where session_id = v_session.id) >= v_session.player_limit
    or exists (select 1 from public.cc_game_session_player_private
               where session_id = v_session.id and phone_normalized = v_phone)
    or exists (select 1 from public.cc_player_recovery_credentials where handle = p_handle) then
    return null;
  end if;
  insert into public.cc_game_session_players (session_id, name)
  values (v_session.id, v_name) returning * into v_player;
  insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized, player_token)
  values (v_player.id, v_session.id, v_phone, v_token);
  insert into public.cc_player_recovery_credentials (player_id, session_id, handle, secret_digest)
  values (v_player.id, v_session.id, p_handle, pg_catalog.decode(p_digest, 'hex'));
  return pg_catalog.jsonb_build_object(
    'join_code', v_session.join_code, 'player_name', v_player.name,
    'player_token', v_token, 'resumed', false
  );
end;
$$;

create function public.cc_player_recovery_candidate(p_join_code text, p_handle uuid)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'digest', pg_catalog.encode(c.secret_digest, 'hex'),
    'revision', c.revision,
    'player_token', k.player_token,
    'player_name', p.name
  )
  from public.cc_player_recovery_credentials c
  join public.cc_game_sessions s on s.id = c.session_id
  join public.cc_game_session_players p on p.id = c.player_id and p.session_id = c.session_id
  join public.cc_game_session_player_private k on k.player_id = c.player_id and k.session_id = c.session_id
  where c.handle = p_handle and s.join_code = p_join_code
    and s.status <> 'completed' and c.revoked_at is null;
$$;

create function public.cc_retry_player_registration(
  p_join_code text,
  p_handle uuid,
  p_revision bigint,
  p_expected_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_result jsonb;
begin
  select id into v_session_id from public.cc_game_sessions
  where join_code = p_join_code and status <> 'completed' for update;
  if not found then return null; end if;
  select pg_catalog.jsonb_build_object(
    'join_code', p_join_code, 'player_name', p.name,
    'player_token', k.player_token, 'resumed', false
  ) into v_result
  from public.cc_player_recovery_credentials c
  join public.cc_game_session_players p on p.id = c.player_id and p.session_id = c.session_id
  join public.cc_game_session_player_private k on k.player_id = c.player_id and k.session_id = c.session_id
  where c.session_id = v_session_id and c.handle = p_handle and c.revoked_at is null
    and c.revision = p_revision and k.player_token = p_expected_token
  for update of c, k;
  return v_result;
end;
$$;

create function public.cc_recover_player_with_credential(
  p_join_code text,
  p_handle uuid,
  p_revision bigint,
  p_expected_token uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_player_id uuid;
  v_player_name text;
  v_token uuid := pg_catalog.gen_random_uuid();
begin
  select id into v_session_id from public.cc_game_sessions
  where join_code = p_join_code and status <> 'completed' for update;
  if not found then return null; end if;
  select c.player_id, p.name into v_player_id, v_player_name
  from public.cc_player_recovery_credentials c
  join public.cc_game_session_players p on p.id = c.player_id and p.session_id = c.session_id
  where c.session_id = v_session_id and c.handle = p_handle
    and c.revoked_at is null and c.revision = p_revision
  for update of c;
  if not found then return null; end if;
  update public.cc_game_session_player_private
  set player_token = v_token
  where player_id = v_player_id and session_id = v_session_id and player_token = p_expected_token;
  if not found then return null; end if;
  update public.cc_player_recovery_credentials set revision = revision + 1 where handle = p_handle;
  update public.cc_game_session_players set last_seen_at = pg_catalog.now() where id = v_player_id;
  return pg_catalog.jsonb_build_object(
    'join_code', p_join_code, 'player_name', v_player_name,
    'player_token', v_token, 'resumed', true
  );
end;
$$;

revoke all on function public.cc_player_identity_rate_limit(uuid) from public, anon, authenticated;
revoke all on function public.cc_register_player_with_recovery(text, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.cc_player_recovery_candidate(text, uuid) from public, anon, authenticated;
revoke all on function public.cc_retry_player_registration(text, uuid, bigint, uuid) from public, anon, authenticated;
revoke all on function public.cc_recover_player_with_credential(text, uuid, bigint, uuid) from public, anon, authenticated;
grant execute on function public.cc_player_identity_rate_limit(uuid) to service_role;
grant execute on function public.cc_register_player_with_recovery(text, text, text, uuid, text) to service_role;
grant execute on function public.cc_player_recovery_candidate(text, uuid) to service_role;
grant execute on function public.cc_retry_player_registration(text, uuid, bigint, uuid) to service_role;
grant execute on function public.cc_recover_player_with_credential(text, uuid, bigint, uuid) to service_role;

notify pgrst, 'reload schema';
