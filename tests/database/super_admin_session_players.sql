begin;

insert into auth.users (id, email, email_confirmed_at) values
  ('00000000-0000-0000-0000-000000000011', 'admin@example.invalid', now()),
  ('00000000-0000-0000-0000-000000000012', 'other@example.invalid', now());
insert into public.cc_platform_admins (user_id, email)
values ('00000000-0000-0000-0000-000000000011', 'admin@example.invalid');
insert into public.cc_game_sessions (id, host_id, name, join_code)
values
  ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012', 'Session', '000011'),
  ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'Other session', '000012');
insert into public.cc_game_session_teams (id, session_id, name)
values
  ('40000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000011', 'Team'),
  ('40000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000012', 'Other team');
insert into public.cc_game_session_players (id, session_id, name)
values
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000011', 'Player'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000011', 'Host'),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000011', 'Other'),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000011', 'No phone');
update public.cc_game_sessions set host_player_id = '30000000-0000-0000-0000-000000000012', team_size = 2
where id = '20000000-0000-0000-0000-000000000011';
insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized, player_token)
values
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000011', '07111111111', '50000000-0000-0000-0000-000000000011'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000011', 'host:owner', '50000000-0000-0000-0000-000000000012'),
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000011', '07222222222', '50000000-0000-0000-0000-000000000013'),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000011', null, '50000000-0000-0000-0000-000000000014');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000012', true);
do $$
begin
  begin
    perform public.cc_super_admin_session_players('20000000-0000-0000-0000-000000000011');
    raise exception 'Non-admin read succeeded';
  exception when raise_exception then
    if sqlerrm <> 'Not authorised as platform administrator.' then raise; end if;
  end;
  begin
    perform public.cc_super_admin_update_session_player(
      '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011',
      'Changed', null, null, 5, '07333333333', null);
    raise exception 'Non-admin update succeeded';
  exception when raise_exception then
    if sqlerrm <> 'Not authorised as platform administrator.' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
do $$
declare
  v_data jsonb;
begin
  v_data := public.cc_super_admin_session_players('20000000-0000-0000-0000-000000000011');
  if jsonb_array_length(v_data -> 'players') <> 4
    or (v_data -> 'players' -> 0 ->> 'phone') <> '07111111111'
    or (v_data -> 'players' -> 1 ->> 'phone') is not null
    or (v_data -> 'players' -> 0) ? 'player_token' then
    raise exception 'Player detail or credential isolation failed';
  end if;
  perform public.cc_super_admin_update_session_player(
    '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000014',
    'Renamed', null, null, 2, null,
    '{"name":"No phone","avatar_url":null,"team_id":null,"score":0,"phone":null}');
  v_data := public.cc_super_admin_session_players('20000000-0000-0000-0000-000000000011');
  if v_data -> 'players' -> 3 ->> 'name' <> 'Renamed'
    or (v_data -> 'players' -> 3 ->> 'score')::integer <> 2 then
    raise exception 'Admin could not edit player without a phone';
  end if;
  perform public.cc_super_admin_update_session_player(
    '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011',
    ' Updated ', 'https://example.invalid/avatar', '40000000-0000-0000-0000-000000000011',
    17, '+44 7333 333333',
    '{"name":"Player","avatar_url":null,"team_id":null,"score":0,"phone":"07111111111"}');
  v_data := public.cc_super_admin_session_players('20000000-0000-0000-0000-000000000011');
  if v_data -> 'players' -> 0 ->> 'name' <> 'Updated'
    or v_data -> 'players' -> 0 ->> 'phone' <> '07333333333'
    or (v_data -> 'players' -> 0 ->> 'score')::integer <> 17 then
    raise exception 'Admin player update failed';
  end if;
  perform public.cc_super_admin_update_session_player(
    '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000012',
    'Host', null, '40000000-0000-0000-0000-000000000011', 0, null,
    '{"name":"Host","avatar_url":null,"team_id":null,"score":0,"phone":null}');
  begin
    perform public.cc_super_admin_update_session_player(
      '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000013',
      'Other', null, '40000000-0000-0000-0000-000000000011', 0, '07222222222',
      '{"name":"Other","avatar_url":null,"team_id":null,"score":0,"phone":"07222222222"}');
    raise exception 'Player was added to a full team';
  exception when raise_exception then
    if sqlerrm <> 'That team is full. Increase the team size or choose another team.' then raise; end if;
  end;
  begin
    perform public.cc_super_admin_update_session_player(
      '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011',
      'Updated', null, '40000000-0000-0000-0000-000000000012', 0, '07333333333', null);
    raise exception 'Foreign session team was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Choose a team from this session.' then raise; end if;
  end;
  begin
    perform public.cc_super_admin_update_session_player(
      '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011',
      'Updated', null, null, 0, '07222222222',
      '{"name":"Updated","avatar_url":"https://example.invalid/avatar","team_id":"40000000-0000-0000-0000-000000000011","score":17,"phone":"07333333333"}');
    raise exception 'Duplicate phone was accepted';
  exception when raise_exception then
    if sqlerrm <> 'That reconnect phone is already used in this game.' then raise; end if;
  end;
  begin
    perform public.cc_super_admin_update_session_player(
      '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000012',
      'Host', null, null, 0, '07333333333',
      '{"name":"Host","avatar_url":null,"team_id":"40000000-0000-0000-0000-000000000011","score":0,"phone":null}');
    raise exception 'Host reconnect identity was changed';
  exception when raise_exception then
    if sqlerrm <> 'This player does not have an editable reconnect phone.' then raise; end if;
  end;
  begin
    perform public.cc_super_admin_update_session_player(
      '20000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000011',
      'Stale', null, null, 0, '07333333333',
      '{"name":"Player","avatar_url":null,"team_id":null,"score":0,"phone":"07111111111"}');
    raise exception 'Stale update was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Player details changed. Return to the game and reopen the player before saving.' then raise; end if;
  end;
end;
$$;
reset role;
do $$
begin
  if (select player_token from public.cc_game_session_player_private where player_id = '30000000-0000-0000-0000-000000000011')
    <> '50000000-0000-0000-0000-000000000011'::uuid then
    raise exception 'Admin update changed the player token';
  end if;
end;
$$;
rollback;
