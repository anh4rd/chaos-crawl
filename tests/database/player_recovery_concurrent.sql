-- Run only against an isolated disposable database with the migration applied.
create extension if not exists dblink;

insert into public.cc_game_sessions (id, join_code, status, player_limit)
values ('20000000-0000-0000-0000-000000000098', '000098', 'lobby', 10);
select public.cc_register_player_with_recovery(
  '000098', 'Concurrent test', '07111111097',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd', repeat('ef', 32));

select dblink_connect('recovery_a', 'dbname=' || current_database());
select dblink_connect('recovery_b', 'dbname=' || current_database());
select dblink_send_query('recovery_a', format(
  'select public.cc_recover_player_with_credential(%L,%L,0,%L)',
  '000098', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  (select player_token from public.cc_game_session_player_private
   where phone_normalized = '07111111097')));
select dblink_send_query('recovery_b', format(
  'select public.cc_recover_player_with_credential(%L,%L,0,%L)',
  '000098', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  (select player_token from public.cc_game_session_player_private
   where phone_normalized = '07111111097')));

create temporary table concurrent_results (result jsonb);
insert into concurrent_results select result from dblink_get_result('recovery_a') as r(result jsonb);
insert into concurrent_results select result from dblink_get_result('recovery_b') as r(result jsonb);
do $$
begin
  if (select count(*) from concurrent_results where result is not null) <> 1 then
    raise exception 'Concurrent recovery must issue exactly one replacement token';
  end if;
end;
$$;
select dblink_disconnect('recovery_a');
select dblink_disconnect('recovery_b');
