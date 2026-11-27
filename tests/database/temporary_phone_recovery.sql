-- Run only against an isolated disposable database with migrations applied.
begin;

insert into public.cc_game_sessions (id, join_code, status, player_limit)
values ('20000000-0000-0000-0000-000000000096', '000096', 'lobby', 10);
insert into public.cc_game_session_players (id, session_id, name)
values ('30000000-0000-0000-0000-000000000096', '20000000-0000-0000-0000-000000000096', 'Existing');
insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized, player_token)
values ('30000000-0000-0000-0000-000000000096', '20000000-0000-0000-0000-000000000096',
        '07111111096', '50000000-0000-0000-0000-000000000096');
insert into public.cc_player_recovery_credentials (player_id, session_id, handle, secret_digest)
values ('30000000-0000-0000-0000-000000000096', '20000000-0000-0000-0000-000000000096',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', decode(repeat('ab', 32), 'hex'));

do $$
declare
  result jsonb;
begin
  if has_function_privilege('anon', 'public.cc_recover_player_with_phone(text,text)', 'execute')
    or has_function_privilege('authenticated', 'public.cc_recover_player_with_phone(text,text)', 'execute')
    or has_table_privilege('anon', 'public.cc_temporary_phone_recovery', 'select')
    or has_table_privilege('service_role', 'public.cc_temporary_phone_recovery', 'insert') then
    raise exception 'Phone recovery has excess browser or table privileges';
  end if;
  if public.cc_recover_player_with_phone('000096', '07111111096') is not null then
    raise exception 'Phone recovery was enabled without a session grant';
  end if;
  insert into public.cc_temporary_phone_recovery (session_id, expires_at)
  values ('20000000-0000-0000-0000-000000000096', now() - interval '1 minute');
  if public.cc_recover_player_with_phone('000096', '07111111096') is not null then
    raise exception 'Expired phone recovery succeeded';
  end if;
  if now() < '2026-11-30 12:00:00+00'::timestamptz then
    update public.cc_temporary_phone_recovery
    set expires_at = least(now() + interval '5 minutes', '2026-11-30 12:00:00+00'::timestamptz);
    if public.cc_recover_player_with_phone('000096', '07111111097') is not null then
      raise exception 'Unknown number was accepted';
    end if;
    result := public.cc_recover_player_with_phone('000096', '+44 7111 111096');
    if result is null or result ->> 'player_name' <> 'Existing'
      or result ->> 'resumed' <> 'true'
      or (result ->> 'player_token')::uuid = '50000000-0000-0000-0000-000000000096' then
      raise exception 'Phone recovery failed to replace the token';
    end if;
    if (select player_token from public.cc_game_session_player_private
        where player_id = '30000000-0000-0000-0000-000000000096') <> (result ->> 'player_token')::uuid then
      raise exception 'Replacement token was not stored';
    end if;
    if (select revision from public.cc_player_recovery_credentials
        where handle = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> 1
      or public.cc_recover_player_with_credential('000096',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0,
        '50000000-0000-0000-0000-000000000096') is not null then
      raise exception 'Phone recovery did not invalidate stale credential operations';
    end if;
    update public.cc_game_sessions set status = 'completed' where id = '20000000-0000-0000-0000-000000000096';
    if public.cc_recover_player_with_phone('000096', '07111111096') is not null then
      raise exception 'Completed game recovery succeeded';
    end if;
  end if;
end;
$$;
rollback;
