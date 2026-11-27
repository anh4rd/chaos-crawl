-- Run only against an isolated database with the application's V2 schema and
-- the secret text evidence migration already applied. Nothing is committed.
begin;

insert into auth.users (id) values ('10000000-0000-0000-0000-000000000001');
insert into public.cc_game_sessions (id, host_id, name, join_code, status)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Test', '123456', 'live');
insert into public.cc_game_session_players (id, session_id, name) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Pat'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Alex');
insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized, player_token) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '111', '40000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '222', '40000000-0000-0000-0000-000000000002');
insert into public.cc_game_session_challenges (id, session_id, kind, title, secret_response_mode, sort_order) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'secret', 'Question', 'text', 1),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'secret', 'Media', 'media', 2);
insert into public.cc_game_session_secret_assignments (id, session_id, player_id, challenge_id, status) values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'sent'),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'sent');

do $$
declare rejected boolean;
begin
  if has_table_privilege('anon', 'public.cc_secret_mission_answers', 'select')
    or has_table_privilege('authenticated', 'public.cc_secret_mission_answers', 'select') then
    raise exception 'Answer table is directly readable';
  end if;
  rejected := false;
  begin
    perform public.cc_player_submit_secret_mission('123456', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001');
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Old submission bypassed the answer requirement'; end if;
  rejected := false;
  begin
    perform public.cc_player_submit_secret_text('123456', '40000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'Wrong player');
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Another player submitted the answer'; end if;
  rejected := false;
  begin
    perform public.cc_player_submit_secret_text('123456', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '   ');
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Blank answer accepted'; end if;
  rejected := false;
  begin
    perform public.cc_player_submit_secret_text('123456', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', repeat('a', 2001));
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Oversized answer accepted'; end if;
  perform public.cc_player_submit_secret_text('123456', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '  My answer  ');
  if (select answer from public.cc_secret_mission_answers where assignment_id = '60000000-0000-0000-0000-000000000001') <> 'My answer' then
    raise exception 'Answer was not stored';
  end if;
  if public.cc_get_session_secret_review_slideshow('20000000-0000-0000-0000-000000000001')::text like '%My answer%' then
    raise exception 'Answer leaked before review';
  end if;
  if public.cc_get_player_secret_missions('123456', '40000000-0000-0000-0000-000000000002')::text like '%My answer%' then
    raise exception 'Answer leaked to another player';
  end if;
  insert into public.cc_game_session_secret_review_state (session_id, is_open, current_assignment_id)
  values ('20000000-0000-0000-0000-000000000001', true, '60000000-0000-0000-0000-000000000001');
  if public.cc_get_session_secret_review_slideshow('20000000-0000-0000-0000-000000000001') ->> 'answer' is distinct from 'My answer' then
    raise exception 'Slideshow did not reveal the selected answer';
  end if;
  if public.cc_player_get_session_secret_review('123456', '40000000-0000-0000-0000-000000000002') ->> 'answer' is distinct from 'My answer' then
    raise exception 'Participant review did not reveal the selected answer';
  end if;
  perform public.cc_player_submit_secret_mission('123456', '40000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002');
end;
$$;
insert into public.host_games (id, host_id, name, status, plan_data)
values (
  '70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Launch test', 'planned',
  '{"secretMissions":true,"selectedTasks":[{"id":"main","kind":"main","title":"Main"},{"id":"one","kind":"secret","title":"Same title","secretResponseMode":"media"},{"id":"two","kind":"secret","title":"Same title","secretResponseMode":"text"}]}'::jsonb
);
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
do $$
declare result jsonb;
begin
  result := public.cc_host_create_game_session('70000000-0000-0000-0000-000000000001');
  if (select count(*) from public.cc_game_session_challenges
      where session_id = (result ->> 'id')::uuid and kind = 'secret'
        and sort_order = 3 and secret_response_mode = 'text' and not allow_photo_upload) <> 1 then
    raise exception 'Saved text mission did not propagate to the correct challenge';
  end if;
  if (select count(*) from public.cc_game_session_challenges
      where session_id = (result ->> 'id')::uuid and kind = 'secret'
        and sort_order = 2 and secret_response_mode = 'media') <> 1 then
    raise exception 'Existing media mission changed';
  end if;
  if not (public.cc_host_create_game_session('70000000-0000-0000-0000-000000000001') ->> 'existing')::boolean then
    raise exception 'Session launch was not idempotent';
  end if;
end;
$$;
rollback;
