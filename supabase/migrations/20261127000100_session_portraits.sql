create or replace function public.cc_get_session_portraits(
  p_join_code text,
  p_player_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_view jsonb;
  v_session_id uuid;
  v_player_id uuid;
  v_result jsonb;
begin
  v_view := public.cc_get_final_round_player_view(p_join_code, p_player_token);
  v_session_id := nullif(v_view #>> '{session,id}', '')::uuid;
  v_player_id := nullif(v_view #>> '{player,id}', '')::uuid;
  if v_session_id is null or v_player_id is null or not exists (
    select 1
    from public.cc_game_sessions s
    join public.cc_game_session_players p on p.session_id = s.id
    where s.id = v_session_id and s.join_code = p_join_code and p.id = v_player_id
  ) then
    raise exception 'Player session is invalid';
  end if;

  select pg_catalog.jsonb_build_object(
    'players', coalesce((
      select pg_catalog.jsonb_object_agg(p.id::text, p.avatar_url)
      from public.cc_game_session_players p
      where p.session_id = s.id and p.avatar_url is not null
    ), '{}'::jsonb),
    'teams', coalesce((
      select pg_catalog.jsonb_object_agg(t.id::text, g.plan_data -> 'teamPhotoUrls' ->> t.id::text)
      from public.cc_game_session_teams t
      where t.session_id = s.id
        and pg_catalog.jsonb_typeof(g.plan_data -> 'teamPhotoUrls' -> t.id::text) = 'string'
    ), '{}'::jsonb)
  ) into v_result
  from public.cc_game_sessions s
  left join public.host_games g on g.id = s.host_game_id
  where s.id = v_session_id;
  return v_result;
end;
$$;

revoke all on function public.cc_get_session_portraits(text, text) from public;
grant execute on function public.cc_get_session_portraits(text, text) to anon, authenticated;
