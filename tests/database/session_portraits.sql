begin;

insert into auth.users (id, email, email_confirmed_at)
values ('00000000-0000-0000-0000-000000000091', 'portrait-owner@example.invalid', now());

insert into public.host_games (id, host_id, name, plan_data)
values (
  '10000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000091',
  'Portrait test',
  '{"teamPhotoUrls":{"40000000-0000-0000-0000-000000000091":"https://example.invalid/team.jpg","40000000-0000-0000-0000-000000000092":"https://example.invalid/foreign.jpg"}}'
);
insert into public.cc_game_sessions (id, host_game_id, host_id, name, join_code)
values
  ('20000000-0000-0000-0000-000000000091', '10000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000091', 'Portrait session', '000091'),
  ('20000000-0000-0000-0000-000000000092', null, '00000000-0000-0000-0000-000000000091', 'Other session', '000092');
insert into public.cc_game_session_teams (id, session_id, name)
values
  ('40000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000091', 'Team'),
  ('40000000-0000-0000-0000-000000000092', '20000000-0000-0000-0000-000000000092', 'Other team');
insert into public.cc_game_session_players (id, session_id, name, avatar_url)
values
  ('30000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000091', 'Player', 'https://example.invalid/player.jpg'),
  ('30000000-0000-0000-0000-000000000092', '20000000-0000-0000-0000-000000000092', 'Other', 'https://example.invalid/other.jpg');
insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized, player_token)
values
  ('30000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000091', '07111111091', '50000000-0000-0000-0000-000000000091'),
  ('30000000-0000-0000-0000-000000000092', '20000000-0000-0000-0000-000000000092', '07111111092', '50000000-0000-0000-0000-000000000092');

set local role anon;
do $$
declare
  data jsonb;
  denied boolean := false;
begin
  data := public.cc_get_session_portraits('000091', '50000000-0000-0000-0000-000000000091');
  if data #>> '{players,30000000-0000-0000-0000-000000000091}' is distinct from 'https://example.invalid/player.jpg'
    or data #>> '{teams,40000000-0000-0000-0000-000000000091}' is distinct from 'https://example.invalid/team.jpg'
    or (data -> 'players') ? '30000000-0000-0000-0000-000000000092'
    or (data -> 'teams') ? '40000000-0000-0000-0000-000000000092' then
    raise exception 'Session portrait isolation failed';
  end if;
  begin
    perform public.cc_get_session_portraits('000091', '50000000-0000-0000-0000-000000000092');
  exception when others then
    denied := true;
  end;
  if not denied then raise exception 'A token from another session was accepted'; end if;
end;
$$;
rollback;
