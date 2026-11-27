begin;

insert into public.cc_game_sessions (id, join_code, status, player_limit)
values ('20000000-0000-0000-0000-000000000099', '000099', 'lobby', 10);
insert into public.cc_game_session_players (id, session_id, name)
values ('30000000-0000-0000-0000-000000000099', '20000000-0000-0000-0000-000000000099', 'Existing');
insert into public.cc_game_session_player_private (player_id, session_id, phone_normalized, player_token)
values ('30000000-0000-0000-0000-000000000099', '20000000-0000-0000-0000-000000000099',
        '07111111099', '50000000-0000-0000-0000-000000000099');

set local role anon;
do $$
declare denied boolean := false;
begin
  begin
    perform public.cc_join_game_session('000099', null, '07111111099');
  exception when raise_exception then
    denied := sqlerrm like '%update%';
  end;
  if not denied then raise exception 'Phone-only rejoin was not blocked'; end if;
  if exists (
    select 1 from (values ('anon'), ('authenticated'), ('service_role')) as r(role_name)
    where pg_catalog.has_table_privilege(r.role_name, 'public.cc_player_recovery_credentials', 'select')
       or pg_catalog.has_table_privilege(r.role_name, 'public.cc_player_recovery_credentials', 'insert')
       or pg_catalog.has_table_privilege(r.role_name, 'public.cc_player_identity_attempts', 'select')
  ) or pg_catalog.has_function_privilege('anon', 'public.cc_recover_player_with_credential(text,uuid,bigint,uuid)', 'execute')
    or pg_catalog.has_function_privilege('authenticated', 'public.cc_recover_player_with_credential(text,uuid,bigint,uuid)', 'execute') then
    raise exception 'Direct identity access was granted';
  end if;
end;
$$;
reset role;

do $$
declare
  result jsonb;
  candidate jsonb;
  old_token uuid;
begin
  if (select player_token from public.cc_game_session_player_private
      where player_id = '30000000-0000-0000-0000-000000000099')
      <> '50000000-0000-0000-0000-000000000099' then
    raise exception 'Existing player token changed';
  end if;
  result := public.cc_register_player_with_recovery(
    '000099', 'New player', '07111111098',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', pg_catalog.repeat('ab', 32));
  if result is null or result ->> 'resumed' <> 'false' then raise exception 'Registration failed'; end if;
  if (select pg_catalog.encode(secret_digest, 'hex') from public.cc_player_recovery_credentials
      where handle = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') <> pg_catalog.repeat('ab', 32) then
    raise exception 'Digest was not stored';
  end if;
  if public.cc_register_player_with_recovery('000099', 'Duplicate', '07111111098',
       'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', pg_catalog.repeat('cd', 32)) is not null then
    raise exception 'Duplicate phone was accepted';
  end if;
  if public.cc_register_player_with_recovery('000099', 'Duplicate UK', '+44 7111 111098',
       '44444444-4444-4444-8444-444444444444', pg_catalog.repeat('78', 32)) is not null then
    raise exception 'UK international duplicate was accepted';
  end if;
  if public.cc_register_player_with_recovery('000099', 'No phone', '',
       '11111111-1111-4111-8111-111111111111', pg_catalog.repeat('12', 32)) is null
    or public.cc_register_player_with_recovery('000099', 'Also no phone', null,
       '22222222-2222-4222-8222-222222222222', pg_catalog.repeat('34', 32)) is null then
    raise exception 'Registration without a phone failed';
  end if;
  if (select count(*) from public.cc_game_session_player_private
      where session_id = '20000000-0000-0000-0000-000000000099'
        and phone_normalized is null) <> 2 then
    raise exception 'Phone-less players were not stored separately';
  end if;
  if public.cc_register_player_with_recovery('000099', 'Invalid phone', 'abc',
       '33333333-3333-4333-8333-333333333333', pg_catalog.repeat('56', 32)) is not null then
    raise exception 'Invalid nonempty phone was accepted';
  end if;
  candidate := public.cc_player_recovery_candidate('000099', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  old_token := (candidate ->> 'player_token')::uuid;
  if public.cc_retry_player_registration('000099',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, old_token) is null then
    raise exception 'Interrupted registration retry failed';
  end if;
  result := public.cc_recover_player_with_credential('000099',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, old_token);
  if result is null or (result ->> 'player_token')::uuid = old_token then
    raise exception 'Recovery did not replace the token';
  end if;
  if public.cc_recover_player_with_credential('000099',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, old_token) is not null then
    raise exception 'A concurrent stale recovery succeeded';
  end if;
  if public.cc_retry_player_registration('000099',
       'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 0, old_token) is not null then
    raise exception 'A stale registration retry succeeded';
  end if;
  candidate := public.cc_player_recovery_candidate('000099', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  result := public.cc_recover_player_with_credential('000099',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, (candidate ->> 'player_token')::uuid);
  if result is null then raise exception 'Reusable recovery credential failed'; end if;
  update public.cc_player_recovery_credentials set revoked_at = now()
  where handle = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if public.cc_player_recovery_candidate('000099', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') is not null then
    raise exception 'Revoked credential remained usable';
  end if;
  for i in 1..8 loop
    if not public.cc_player_identity_rate_limit('cccccccc-cccc-4ccc-8ccc-cccccccccccc') then
      raise exception 'Rate limit rejected an allowed attempt';
    end if;
  end loop;
  if public.cc_player_identity_rate_limit('cccccccc-cccc-4ccc-8ccc-cccccccccccc') then
    raise exception 'Rate limit did not reject excess attempts';
  end if;
end;
$$;
rollback;
