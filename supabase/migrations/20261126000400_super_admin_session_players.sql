-- Player credentials and messaging consent are deliberately not exposed.
create function public.cc_super_admin_session_players(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.cc_is_platform_admin() then
    raise exception 'Not authorised as platform administrator.';
  end if;

  select pg_catalog.jsonb_build_object(
    'session_id', s.id,
    'session_name', s.name,
    'teams', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('id', t.id, 'name', t.name)
        order by t.name, t.id
      )
      from public.cc_game_session_teams t where t.session_id = s.id
    ), '[]'::jsonb),
    'players', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'avatar_url', p.avatar_url,
          'team_id', p.team_id,
          'score', p.score,
          'joined_at', p.joined_at,
          'last_seen_at', p.last_seen_at,
          'phone', case
            when p.id = s.host_player_id or pg_catalog.left(k.phone_normalized, 5) = 'host:' then null
            else k.phone_normalized
          end
        ) order by p.joined_at, p.id
      )
      from public.cc_game_session_players p
      left join public.cc_game_session_player_private k
        on k.player_id = p.id and k.session_id = p.session_id
      where p.session_id = s.id
    ), '[]'::jsonb)
  ) into v_result
  from public.cc_game_sessions s where s.id = p_session_id;
  if v_result is null then raise exception 'Game session not found.'; end if;
  return v_result;
end;
$$;

revoke all on function public.cc_super_admin_session_players(uuid) from public, anon, authenticated;
grant execute on function public.cc_super_admin_session_players(uuid) to authenticated;

create function public.cc_super_admin_update_session_player(
  p_session_id uuid,
  p_player_id uuid,
  p_name text,
  p_avatar_url text,
  p_team_id uuid,
  p_score integer,
  p_phone text,
  p_expected jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_host_player_id uuid;
  v_team_size integer;
  v_existing_team_id uuid;
  v_phone text;
  v_existing_phone text;
  v_player public.cc_game_session_players%rowtype;
begin
  if not public.cc_is_platform_admin() then
    raise exception 'Not authorised as platform administrator.';
  end if;
  if nullif(pg_catalog.btrim(p_name), '') is null or pg_catalog.length(p_name) > 60 then
    raise exception 'Enter a player name of at most 60 characters.';
  end if;
  if p_score is null then raise exception 'Enter a player score.'; end if;

  -- The join RPC locks this row too, serializing phone changes with rejoining.
  select s.host_player_id, s.team_size into v_host_player_id, v_team_size
  from public.cc_game_sessions s where s.id = p_session_id for update;
  if not found then raise exception 'Game session not found.'; end if;
  select p.* into v_player from public.cc_game_session_players p
  where p.id = p_player_id and p.session_id = p_session_id for update;
  if not found then raise exception 'Player not found in this session.'; end if;
  v_existing_team_id := v_player.team_id;
  if p_team_id is not null and not exists (
    select 1 from public.cc_game_session_teams t
    where t.id = p_team_id and t.session_id = p_session_id
  ) then raise exception 'Choose a team from this session.'; end if;
  if p_team_id is not null and p_team_id is distinct from v_existing_team_id
    and (select pg_catalog.count(*) from public.cc_game_session_players p
      where p.session_id = p_session_id and p.team_id = p_team_id) >= v_team_size
  then raise exception 'That team is full. Increase the team size or choose another team.'; end if;

  select k.phone_normalized into v_existing_phone
  from public.cc_game_session_player_private k
  where k.player_id = p_player_id and k.session_id = p_session_id for update;
  if p_expected is distinct from pg_catalog.jsonb_build_object(
    'name', v_player.name,
    'avatar_url', v_player.avatar_url,
    'team_id', v_player.team_id,
    'score', v_player.score,
    'phone', case
      when p_player_id = v_host_player_id or pg_catalog.left(v_existing_phone, 5) = 'host:' then null
      else v_existing_phone
    end
  ) then
    raise exception 'Player details changed. Return to the game and reopen the player before saving.';
  end if;
  if p_player_id = v_host_player_id or not found or pg_catalog.left(v_existing_phone, 5) = 'host:' then
    if p_phone is not null then
      raise exception 'This player does not have an editable reconnect phone.';
    end if;
  else
    v_phone := pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
    if pg_catalog.length(v_phone) < 8 or pg_catalog.length(v_phone) > 15 then
      raise exception 'Enter a valid mobile number so the player can rejoin.';
    end if;
    if pg_catalog.left(v_phone, 2) = '00' then v_phone := pg_catalog.substr(v_phone, 3); end if;
    if pg_catalog.left(v_phone, 2) = '44' then
      if pg_catalog.length(v_phone) = 13 and pg_catalog.substr(v_phone, 3, 1) = '0' then
        v_phone := '0' || pg_catalog.substr(v_phone, 4);
      elsif pg_catalog.length(v_phone) = 12 then
        v_phone := '0' || pg_catalog.substr(v_phone, 3);
      end if;
    end if;
    if v_phone is distinct from v_existing_phone then
      begin
        update public.cc_game_session_player_private set phone_normalized = v_phone
        where player_id = p_player_id and session_id = p_session_id;
      exception when unique_violation then
        raise exception 'That reconnect phone is already used in this game.';
      end;
    end if;
  end if;
  update public.cc_game_session_players
  set name = pg_catalog.btrim(p_name),
      avatar_url = nullif(pg_catalog.btrim(p_avatar_url), ''),
      team_id = p_team_id,
      score = p_score
  where id = p_player_id and session_id = p_session_id;
end;
$$;

revoke all on function public.cc_super_admin_update_session_player(uuid, uuid, text, text, uuid, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.cc_super_admin_update_session_player(uuid, uuid, text, text, uuid, integer, text, jsonb) to authenticated;
