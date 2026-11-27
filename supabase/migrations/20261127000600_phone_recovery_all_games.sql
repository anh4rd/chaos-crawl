create or replace function public.cc_recover_player_with_phone(p_join_code text, p_mobile text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_player_id uuid;
  v_player_name text;
  v_phone text := pg_catalog.regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g');
  v_token uuid := pg_catalog.gen_random_uuid();
begin
  if p_join_code !~ '^[0-9]{6}$'
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
  select s.id into v_session_id
  from public.cc_game_sessions s
  where s.join_code = p_join_code and s.status <> 'completed'
    and pg_catalog.clock_timestamp() < '2026-11-30 12:00:00+00'::timestamptz
  for update of s;
  if not found then return null; end if;

  select p.id, p.name into v_player_id, v_player_name
  from public.cc_game_session_players p
  join public.cc_game_session_player_private k on k.player_id = p.id and k.session_id = p.session_id
  where p.session_id = v_session_id and k.phone_normalized = v_phone
  for update of k;
  if not found or pg_catalog.clock_timestamp() >= '2026-11-30 12:00:00+00'::timestamptz then
    return null;
  end if;

  update public.cc_game_session_player_private
  set player_token = v_token where player_id = v_player_id and session_id = v_session_id;
  update public.cc_player_recovery_credentials
  set revision = revision + 1 where player_id = v_player_id and revoked_at is null;
  update public.cc_game_session_players set last_seen_at = pg_catalog.now() where id = v_player_id;
  return pg_catalog.jsonb_build_object(
    'join_code', p_join_code, 'player_name', v_player_name,
    'player_token', v_token, 'resumed', true
  );
end;
$$;

revoke all on function public.cc_recover_player_with_phone(text, text) from public, anon, authenticated;
grant execute on function public.cc_recover_player_with_phone(text, text) to service_role;
notify pgrst, 'reload schema';
