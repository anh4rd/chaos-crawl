-- Run only against an isolated disposable database with migration 007 applied.
begin;

insert into public.host_games (id, plan_data)
values ('10000000-0000-0000-0000-000000000071', '{"secretMissionPoints":23}'::jsonb);
insert into public.cc_game_sessions (id, host_game_id, status)
values ('20000000-0000-0000-0000-000000000071', '10000000-0000-0000-0000-000000000071', 'lobby');
insert into public.cc_game_session_challenges (id, session_id, kind, points, sort_order)
values
  ('40000000-0000-0000-0000-000000000071', '20000000-0000-0000-0000-000000000071', 'secret', 2, 1),
  ('40000000-0000-0000-0000-000000000072', '20000000-0000-0000-0000-000000000071', 'secret', 80, 2),
  ('40000000-0000-0000-0000-000000000073', '20000000-0000-0000-0000-000000000071', 'main', 40, 3);
insert into public.cc_game_session_players (id, session_id, score)
values ('30000000-0000-0000-0000-000000000071', '20000000-0000-0000-0000-000000000071', 4);
insert into public.cc_game_session_secret_assignments (id, session_id, player_id, challenge_id, status, awarded_points)
values
  ('50000000-0000-0000-0000-000000000071', '20000000-0000-0000-0000-000000000071',
   '30000000-0000-0000-0000-000000000071', '40000000-0000-0000-0000-000000000071', 'submitted', 0),
  ('50000000-0000-0000-0000-000000000072', '20000000-0000-0000-0000-000000000071',
   '30000000-0000-0000-0000-000000000071', '40000000-0000-0000-0000-000000000072', 'submitted', 0);
insert into public.cc_game_session_secret_review_state (session_id, is_open, voting_open, current_assignment_id)
values ('20000000-0000-0000-0000-000000000071', true, true, '50000000-0000-0000-0000-000000000072');
insert into public.cc_game_session_secret_review_assignments (session_id, assignment_id, status)
values ('20000000-0000-0000-0000-000000000071', '50000000-0000-0000-0000-000000000072', 'voting');
insert into public.cc_game_session_secret_review_votes (session_id, assignment_id, player_id, vote)
values ('20000000-0000-0000-0000-000000000071', '50000000-0000-0000-0000-000000000072',
        '30000000-0000-0000-0000-000000000071', 'success');

do $$
declare
  result jsonb;
begin
  if (select secret_mission_points from public.cc_game_sessions
      where id = '20000000-0000-0000-0000-000000000071') <> 23
    or (select count(*) from public.cc_game_session_challenges
        where session_id = '20000000-0000-0000-0000-000000000071'
          and kind = 'secret' and points = 23) <> 2 then
    raise exception 'New missions did not use the game-wide points';
  end if;
  if public.cc_secret_mission_points_from_plan(
      '{"selectedTasks":[{"kind":"secret","points":7}]}'::jsonb) <> 7 then
    raise exception 'An old plan did not retain its first mission points';
  end if;
  update public.cc_game_session_challenges set points = 99
  where id = '40000000-0000-0000-0000-000000000071';
  if (select points from public.cc_game_session_challenges
      where id = '40000000-0000-0000-0000-000000000071') <> 23 then
    raise exception 'Individual secret mission points changed';
  end if;
  update public.host_games set plan_data = '{"secretMissionPoints":17}'::jsonb
  where id = '10000000-0000-0000-0000-000000000071';
  if (select count(*) from public.cc_game_session_challenges
      where session_id = '20000000-0000-0000-0000-000000000071'
        and kind = 'secret' and points = 17) <> 2
    or (select points from public.cc_game_session_challenges
        where id = '40000000-0000-0000-0000-000000000073') <> 40 then
    raise exception 'Editing the plan failed to update only secret missions';
  end if;
  result := public.cc_host_review_secret_mission('50000000-0000-0000-0000-000000000071', true, 999);
  if (result ->> 'awarded_points')::integer <> 17
    or (select score from public.cc_game_session_players
        where id = '30000000-0000-0000-0000-000000000071') <> 21 then
    raise exception 'Manual review did not use the shared points';
  end if;
  result := public.cc_host_close_secret_review_vote('20000000-0000-0000-0000-000000000071');
  if (result ->> 'points_awarded')::integer <> 17
    or (select score from public.cc_game_session_players
        where id = '30000000-0000-0000-0000-000000000071') <> 38 then
    raise exception 'Secret vote did not award the shared points';
  end if;
  update public.host_games set plan_data = '{"secretMissionPoints":0}'::jsonb
  where id = '10000000-0000-0000-0000-000000000071';
  if (select awarded_points from public.cc_game_session_secret_assignments
      where id = '50000000-0000-0000-0000-000000000071') <> 17
    or (select score from public.cc_game_session_players
        where id = '30000000-0000-0000-0000-000000000071') <> 38
    or exists (select 1 from public.cc_game_session_challenges
      where session_id = '20000000-0000-0000-0000-000000000071'
        and kind = 'secret' and points <> 0) then
    raise exception 'Changing points changed an existing award or ignored zero';
  end if;
  begin
    update public.host_games set plan_data = '{"secretMissionPoints":10001}'::jsonb
    where id = '10000000-0000-0000-0000-000000000071';
    raise exception 'Invalid points were accepted';
  exception when raise_exception then
    if sqlerrm = 'Invalid points were accepted' then raise; end if;
  end;
  if (select secret_mission_points from public.cc_game_sessions
      where id = '20000000-0000-0000-0000-000000000071') <> 0 then
    raise exception 'Invalid plan changed the game points';
  end if;
end;
$$;
rollback;
