-- Run only against an isolated disposable database with migrations applied.
begin;

insert into public.cc_game_sessions (id, join_code, status, player_limit)
values
  ('20000000-0000-0000-0000-000000000091', '000091', 'lobby', 10),
  ('20000000-0000-0000-0000-000000000092', '000092', 'lobby', 10);
insert into public.cc_game_session_players (id, session_id, name)
values
  ('30000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000091', 'First'),
  ('30000000-0000-0000-0000-000000000092', '20000000-0000-0000-0000-000000000092', 'Second');
insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized, player_token)
values
  ('30000000-0000-0000-0000-000000000091', '20000000-0000-0000-0000-000000000091',
   '07111111091', '50000000-0000-0000-0000-000000000091'),
  ('30000000-0000-0000-0000-000000000092', '20000000-0000-0000-0000-000000000092',
   '07111111092', '50000000-0000-0000-0000-000000000092');
insert into public.cc_temporary_phone_recovery (session_id, expires_at)
values ('20000000-0000-0000-0000-000000000092', now() - interval '1 minute');

do $$
declare
  result jsonb;
begin
  if has_function_privilege('anon', 'public.cc_recover_player_with_phone(text,text)', 'execute')
    or has_function_privilege('authenticated', 'public.cc_recover_player_with_phone(text,text)', 'execute')
    or not has_function_privilege('service_role', 'public.cc_recover_player_with_phone(text,text)', 'execute') then
    raise exception 'Phone recovery RPC has incorrect privileges';
  end if;
  if public.cc_recover_player_with_phone('000091', '07111111092') is not null then
    raise exception 'Phone recovery crossed game boundaries';
  end if;
  if now() < '2026-11-30 12:00:00+00'::timestamptz then
    result := public.cc_recover_player_with_phone('000091', '+44 7111 111091');
    if result is null or result ->> 'player_name' <> 'First'
      or (result ->> 'player_token')::uuid = '50000000-0000-0000-0000-000000000091' then
      raise exception 'A game without an allowlist row could not recover';
    end if;
    result := public.cc_recover_player_with_phone('000092', '07111111092');
    if result is null or result ->> 'player_name' <> 'Second' then
      raise exception 'An obsolete allowlist expiry blocked recovery';
    end if;
    update public.cc_game_sessions set status = 'completed' where join_code = '000091';
    if public.cc_recover_player_with_phone('000091', '07111111091') is not null then
      raise exception 'Completed game recovery succeeded';
    end if;
  elsif public.cc_recover_player_with_phone('000091', '07111111091') is not null then
    raise exception 'Phone recovery succeeded after the deadline';
  end if;
end;
$$;
rollback;
