begin;

insert into auth.users (id, email, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001', 'owner@example.invalid', now()),
  ('00000000-0000-0000-0000-000000000002', 'cohost@example.invalid', now()),
  ('00000000-0000-0000-0000-000000000003', 'other@example.invalid', now()),
  ('00000000-0000-0000-0000-000000000004', 'unverified@example.invalid', null),
  ('00000000-0000-0000-0000-000000000005', 'duplicate@example.invalid', now()),
  ('00000000-0000-0000-0000-000000000006', 'DUPLICATE@example.invalid', now());

insert into public.host_games (id, host_id, name)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Co-host test'
);

insert into public.host_games (id, host_id, name, status, plan_data)
values (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Launch test',
  'planned',
  '{"selectedTasks":[{"kind":"main","title":"Test challenge"}]}'
);

insert into public.cc_game_sessions (id, host_game_id, host_id, name, join_code)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Co-host session',
  '000001'
);

insert into public.cc_game_session_players (id, session_id, name)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Owner'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Player');
update public.cc_game_sessions
set host_player_id = '30000000-0000-0000-0000-000000000001'
where id = '20000000-0000-0000-0000-000000000001';
insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'host-test'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.cc_add_game_cohost('10000000-0000-0000-0000-000000000001', ' COHOST@example.invalid ');
select public.cc_add_game_cohost('10000000-0000-0000-0000-000000000001', 'cohost@example.invalid');
select public.cc_add_game_cohost('10000000-0000-0000-0000-000000000002', 'cohost@example.invalid');

do $$
begin
  if (select count(*) from public.cc_game_cohosts) <> 2 then
    raise exception 'Adding the same co-host must be idempotent';
  end if;
  if (select email from public.cc_list_game_cohosts('10000000-0000-0000-0000-000000000001')) is distinct from 'cohost@example.invalid' then
    raise exception 'Owner could not list the co-host email';
  end if;
  begin
    perform public.cc_add_game_cohost('10000000-0000-0000-0000-000000000001', 'unverified@example.invalid');
    raise exception 'Unverified account was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Could not identify one verified host account for that email.' then
      raise;
    end if;
  end;
  begin
    perform public.cc_add_game_cohost('10000000-0000-0000-0000-000000000001', 'duplicate@example.invalid');
    raise exception 'Ambiguous email was accepted';
  exception when raise_exception then
    if sqlerrm <> 'Could not identify one verified host account for that email.' then
      raise;
    end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
do $$
declare
  v_result jsonb;
  v_session_id uuid;
  v_main_challenge_id uuid;
  v_secret_challenge_id uuid;
  v_reward_id uuid;
  v_player_id uuid;
begin
  if not public.cc_can_host_game('10000000-0000-0000-0000-000000000001') then
    raise exception 'Added co-host cannot access their game';
  end if;
  if not public.cc_can_host_session('20000000-0000-0000-0000-000000000001') then
    raise exception 'Added co-host cannot access their session';
  end if;
  update public.host_games set name = 'Shared game'
  where id = '10000000-0000-0000-0000-000000000001';
  if not found then
    raise exception 'Co-host could not update the game';
  end if;
  update public.host_games set plan_data = '{"hostParticipates": false}'
  where id = '10000000-0000-0000-0000-000000000001';
  update public.cc_game_sessions set name = 'Shared session'
  where id = '20000000-0000-0000-0000-000000000001';
  if not found then
    raise exception 'Co-host could not update the session';
  end if;
  if (select count(*) from public.cc_game_session_players) <> 2 then
    raise exception 'Co-host could not read session players';
  end if;
  begin
    if (select count(*) from public.cc_game_session_player_private) <> 0 then
      raise exception 'Co-host can read private player credentials';
    end if;
  exception when insufficient_privilege then
    null;
  end;
  update public.cc_game_session_players set name = 'Updated player'
  where id = '30000000-0000-0000-0000-000000000002';
  if not found then
    raise exception 'Co-host could not update an ordinary player';
  end if;
  update public.cc_game_session_players set name = 'Changed owner'
  where id = '30000000-0000-0000-0000-000000000001';
  if not found then
    raise exception 'Co-host could not manage the owner player in the roster';
  end if;
  delete from public.cc_game_session_players
  where id = '30000000-0000-0000-0000-000000000001';
  if found then
    raise exception 'Co-host could delete the owner player';
  end if;
  begin
    update public.cc_game_session_players
    set id = '30000000-0000-0000-0000-000000000003'
    where id = '30000000-0000-0000-0000-000000000001';
    raise exception 'Co-host could replace the owner player identity';
  exception when raise_exception then
    if sqlerrm <> 'Co-hosts cannot move or replace a player identity.' then
      raise;
    end if;
  end;
  insert into public.cc_game_session_teams (session_id, name)
  values ('20000000-0000-0000-0000-000000000001', 'Team');
  insert into public.cc_game_session_timers (session_id, round_number)
  values ('20000000-0000-0000-0000-000000000001', 1);
  update public.cc_game_session_timers set remaining_seconds = 42
  where session_id = '20000000-0000-0000-0000-000000000001';
  if not found then
    raise exception 'Co-host could not update the session timer';
  end if;
  v_result := public.cc_host_create_game_session('10000000-0000-0000-0000-000000000002');
  v_session_id := (v_result ->> 'id')::uuid;
  if not exists (
    select 1 from public.cc_game_sessions
    where id = v_session_id and host_id = '00000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Co-host launch did not preserve the game owner';
  end if;
  if (public.cc_host_create_game_session('10000000-0000-0000-0000-000000000002') ->> 'id')::uuid <> v_session_id then
    raise exception 'Co-host launch was not idempotent';
  end if;
  perform public.cc_host_start_game_session(v_session_id);
  if (select status from public.host_games where id = '10000000-0000-0000-0000-000000000002') <> 'live' then
    raise exception 'Co-host start did not update the owner game';
  end if;
  perform public.cc_host_set_game_session_round(v_session_id, 1);
  update public.cc_game_sessions set reward_methods = array['host_awards']
  where id = v_session_id;
  insert into public.cc_game_session_players (session_id, name)
  values (v_session_id, 'Reward player') returning id into v_player_id;
  select id into v_main_challenge_id
  from public.cc_game_session_challenges where session_id = v_session_id and kind = 'main';
  perform public.cc_host_adjust_session_score(v_session_id, 'player', v_player_id, 3);
  v_result := public.cc_host_start_session_reward_round(v_session_id, v_main_challenge_id, 'host_awards', 'player', 7);
  v_reward_id := (v_result ->> 'id')::uuid;
  perform public.cc_host_complete_session_reward_round(v_reward_id, array[v_player_id], null, 7);
  perform public.cc_host_release_session_reward_round(v_reward_id);
  if (select score from public.cc_game_session_players where id = v_player_id) <> 10 then
    raise exception 'Co-host score adjustment and reward were not applied';
  end if;
  insert into public.cc_game_session_challenges (session_id, kind, title)
  values (v_session_id, 'secret', 'Secret test') returning id into v_secret_challenge_id;
  v_result := public.cc_host_assign_secret_mission(v_session_id, v_player_id, v_secret_challenge_id);
  if v_result ->> 'status' <> 'sent' then
    raise exception 'Co-host could not assign a secret mission';
  end if;
  perform public.cc_host_set_session_final_gallery(v_session_id, true, false);
  if not (select final_gallery_open from public.cc_game_sessions where id = v_session_id) then
    raise exception 'Co-host could not open the final gallery';
  end if;
  perform public.cc_host_complete_game_session(v_session_id);
  if (select status from public.host_games where id = '10000000-0000-0000-0000-000000000002') <> 'completed' then
    raise exception 'Co-host completion did not update the owner game';
  end if;
  begin
    perform public.cc_host_join_as_player('20000000-0000-0000-0000-000000000001', 'Co-host');
    raise exception 'Co-host could join using the owner player identity';
  exception when raise_exception then
    if sqlerrm <> 'Game session not found for this host.' then
      raise;
    end if;
  end;
  begin
    update public.cc_game_sessions set host_participates = true
    where id = '20000000-0000-0000-0000-000000000001';
    raise exception 'Co-host changed owner participation';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can change ownership or host participation.' then
      raise;
    end if;
  end;
  begin
    update public.host_games set plan_data = '{"hostParticipates": true}'
    where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'Co-host changed owner participation in the plan';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can change ownership or host participation.' then
      raise;
    end if;
  end;
  begin
    update public.cc_game_sessions set host_game_id = null
    where id = '20000000-0000-0000-0000-000000000001';
    raise exception 'Co-host changed the session game';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can change ownership or host participation.' then
      raise;
    end if;
  end;
  begin
    perform public.cc_add_game_cohost('10000000-0000-0000-0000-000000000001', 'other@example.invalid');
    raise exception 'Co-host could add another co-host';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can manage co-hosts.' then
      raise;
    end if;
  end;
  begin
    insert into public.cc_game_cohosts (host_game_id, user_id, added_by)
    values (
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000002'
    );
    raise exception 'Co-host could insert membership directly';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform public.cc_remove_game_cohost(
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    );
    raise exception 'Co-host could remove membership';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can manage co-hosts.' then
      raise;
    end if;
  end;
  begin
    perform public.cc_list_game_cohosts('10000000-0000-0000-0000-000000000001');
    raise exception 'Co-host could list account emails';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can manage co-hosts.' then
      raise;
    end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
do $$
begin
  if public.cc_can_host_game('10000000-0000-0000-0000-000000000001')
    or public.cc_can_host_session('20000000-0000-0000-0000-000000000001')
    or (select count(*) from public.cc_game_cohosts) <> 0
    or (select count(*) from public.host_games) <> 0
    or (select count(*) from public.cc_game_sessions) <> 0 then
    raise exception 'Unrelated user can access co-host membership';
  end if;
  begin
    perform public.cc_host_create_game_session('10000000-0000-0000-0000-000000000001');
    raise exception 'Unrelated user could launch the game';
  exception when raise_exception then
    if sqlerrm <> 'That game plan was not found in your account.' then
      raise;
    end if;
  end;
  begin
    perform public.cc_host_start_game_session('20000000-0000-0000-0000-000000000001');
    raise exception 'Unrelated user could start the session';
  exception when raise_exception then
    if sqlerrm <> 'Game session not found for this host.' then
      raise;
    end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select public.cc_remove_game_cohost(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
do $$
begin
  if public.cc_can_host_game('10000000-0000-0000-0000-000000000001')
    or public.cc_can_host_session('20000000-0000-0000-0000-000000000001') then
    raise exception 'Removed co-host retained access';
  end if;
  begin
    perform public.cc_host_start_game_session('20000000-0000-0000-0000-000000000001');
    raise exception 'Removed co-host could start the session';
  exception when raise_exception then
    if sqlerrm <> 'Game session not found for this host.' then
      raise;
    end if;
  end;
end;
$$;

rollback;
