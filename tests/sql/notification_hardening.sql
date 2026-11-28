-- Run only against the isolated notification_hardening_fixture.sql database.
insert into public.cc_game_sessions (join_code, status, player_limit)
values ('123456', 'lobby', 10);
set role service_role;
select public.cc_register_player_with_recovery(
  '123456', 'Alice', '441234567890', '10000000-0000-0000-0000-000000000001', repeat('a', 64)
) ->> 'player_token' as token_a \gset
select public.cc_register_player_with_recovery(
  '123456', 'Bob', '441234567891', '10000000-0000-0000-0000-000000000002', repeat('b', 64)
) ->> 'player_token' as token_b \gset
reset role;
select set_config('test.token_a', :'token_a', false);
select set_config('test.token_b', :'token_b', false);

set role anon;
do $$
declare rejected boolean := false;
begin
  begin
    perform public.cc_register_push_subscription(
      '123456', '10000000-0000-0000-0000-000000000099',
      'https://fcm.googleapis.com/fcm/send/a', repeat('a', 87), repeat('a', 22)
    );
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Invalid token registered a subscription'; end if;
  rejected := false;
  begin
    perform public.cc_get_player_notifications('000000', current_setting('test.token_a')::uuid);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Wrong game code retrieved notifications'; end if;
  if has_table_privilege('anon', 'public.cc_player_notifications', 'select')
    or has_table_privilege('anon', 'public.cc_push_subscriptions', 'select')
    or has_function_privilege('anon', 'public.cc_claim_push_deliveries()', 'execute') then
    raise exception 'Private notification data or queue is exposed';
  end if;
  perform public.cc_register_push_subscription(
    '123456', current_setting('test.token_a')::uuid,
    'https://fcm.googleapis.com/fcm/send/a', repeat('a', 87), repeat('a', 22)
  );
  perform public.cc_register_push_subscription(
    '123456', current_setting('test.token_a')::uuid,
    'https://fcm.googleapis.com/fcm/send/a', repeat('a', 87), repeat('a', 22)
  );
  perform public.cc_register_push_subscription(
    '123456', current_setting('test.token_b')::uuid,
    'https://fcm.googleapis.com/fcm/send/b', repeat('b', 87), repeat('b', 22)
  );
end;
$$;
reset role;

create function public.test_fail_push_queue()
returns trigger language plpgsql as $$
begin
  if current_setting('test.fail_push', true) = 'on' then
    raise exception 'Simulated push queue failure';
  end if;
  return new;
end;
$$;
create trigger test_fail_push_queue before insert on public.cc_push_deliveries
for each row execute function public.test_fail_push_queue();

select set_config('test.fail_push', 'on', false);
update public.cc_game_sessions set status = 'live', current_round_number = 1;
do $$
begin
  if (select count(*) from public.cc_player_notifications where event_type = 'round_started' and push_queue_pending) <> 2
    or (select status from public.cc_game_sessions where join_code = '123456') <> 'live'
    or exists (select 1 from public.cc_push_deliveries) then
    raise exception 'Queue failure rolled back the event or in-app notices';
  end if;
end;
$$;
select set_config('test.fail_push', 'off', false);
do $$
declare
  claimed jsonb := public.cc_claim_push_deliveries();
  first_delivery jsonb;
  second_delivery jsonb;
begin
  if jsonb_array_length(claimed) <> 2
    or exists (select 1 from public.cc_player_notifications where push_queue_pending) then
    raise exception 'Failed queue was not retried';
  end if;
  first_delivery := claimed -> 0;
  second_delivery := claimed -> 1;
  perform public.cc_finish_push_delivery(
    (first_delivery ->> 'id')::uuid, (first_delivery ->> 'lease')::uuid, 'retry'
  );
  if not exists (
    select 1 from public.cc_push_deliveries
    where id = (first_delivery ->> 'id')::uuid and attempts = 1
      and lease_token is null and next_attempt_at > now()
  ) then raise exception 'Delivery was not scheduled for retry'; end if;
  perform public.cc_finish_push_delivery(
    (second_delivery ->> 'id')::uuid, (second_delivery ->> 'lease')::uuid, 'expired'
  );
  if exists (
    select 1 from public.cc_push_subscriptions
    where endpoint = second_delivery ->> 'endpoint'
  ) then raise exception 'Expired subscription was not removed'; end if;
end;
$$;

insert into public.cc_game_session_secret_assignments (session_id, player_id, status)
select session_id, player_id, 'sent' from public.cc_game_session_player_private
where player_token = current_setting('test.token_a')::uuid;
update public.cc_game_session_secret_assignments set status = 'sent';
update public.cc_game_sessions set final_voting_open = true;
update public.cc_game_sessions set final_voting_open = true;
do $$
declare
  a uuid := public.cc_notification_player('123456', current_setting('test.token_a')::uuid);
  b uuid := public.cc_notification_player('123456', current_setting('test.token_b')::uuid);
  secret_id uuid;
begin
  if (select count(*) from public.cc_player_notifications where player_id = a) <> 3
    or (select count(*) from public.cc_player_notifications where player_id = b) <> 2 then
    raise exception 'Wrong event recipients or duplicate event';
  end if;
  select id into secret_id from public.cc_player_notifications
  where player_id = a and event_type = 'secret_mission';
  if public.cc_get_player_notifications('123456', current_setting('test.token_b')::uuid)::text like '%secret_mission%' then
    raise exception 'Secret notification leaked to another player';
  end if;
  perform public.cc_dismiss_player_notification('123456', current_setting('test.token_b')::uuid, secret_id);
  if (select dismissed_at from public.cc_player_notifications where id = secret_id) is not null then
    raise exception 'Another player dismissed the notice';
  end if;
  perform public.cc_dismiss_player_notification('123456', current_setting('test.token_a')::uuid, secret_id);
  if public.cc_get_player_notifications('123456', current_setting('test.token_a')::uuid)::text like '%secret_mission%' then
    raise exception 'Dismissal did not persist';
  end if;
  update public.cc_player_notifications set created_at = now() - interval '25 hours';
  update public.cc_push_deliveries set lease_until = null, next_attempt_at = now(), delivered_at = null;
  if jsonb_array_length(public.cc_claim_push_deliveries()) <> 0 then
    raise exception 'An expired notification was sent';
  end if;
  update public.cc_player_notifications set created_at = now() - interval '31 days';
  perform public.cc_claim_push_deliveries();
  if exists (select 1 from public.cc_player_notifications) then
    raise exception 'Old notifications were not deleted';
  end if;
end;
$$;

set role anon;
select public.cc_register_push_subscription(
  '123456', current_setting('test.token_a')::uuid,
  'https://fcm.googleapis.com/fcm/send/shared', repeat('a', 87), repeat('a', 22)
);
reset role;
select public.cc_enqueue_notification(
  (select id from public.cc_game_sessions where join_code = '123456'),
  public.cc_notification_player('123456', current_setting('test.token_a')::uuid),
  'secret_mission'
);
set role anon;
select public.cc_register_push_subscription(
  '123456', current_setting('test.token_b')::uuid,
  'https://fcm.googleapis.com/fcm/send/shared', repeat('b', 87), repeat('b', 22)
);
reset role;
do $$
begin
  if (select count(*) from public.cc_push_subscriptions where endpoint = 'https://fcm.googleapis.com/fcm/send/shared') <> 1
    or not exists (
      select 1 from public.cc_push_subscriptions s
      join public.cc_game_session_player_private p on p.player_id = s.player_id
      where s.endpoint = 'https://fcm.googleapis.com/fcm/send/shared'
        and p.player_token = current_setting('test.token_b')::uuid
    ) then raise exception 'Shared endpoint was not transferred safely'; end if;
  if exists (
    select 1 from public.cc_push_deliveries d
    join public.cc_player_notifications n on n.id = d.notification_id
    join public.cc_push_subscriptions s on s.id = d.subscription_id
    where s.endpoint = 'https://fcm.googleapis.com/fcm/send/shared'
      and n.player_id <> s.player_id
  ) then raise exception 'Transferred endpoint retained another player''s deliveries'; end if;
end;
$$;
set role service_role;
select public.cc_recover_player_with_credential(
  '123456', '10000000-0000-0000-0000-000000000002', 0,
  current_setting('test.token_b')::uuid
) ->> 'player_token' as new_token_b \gset
reset role;
select set_config('test.new_token_b', :'new_token_b', false);
do $$
begin
  if exists (
    select 1 from public.cc_push_subscriptions s
    join public.cc_player_recovery_credentials c on c.player_id = s.player_id
    where c.handle = '10000000-0000-0000-0000-000000000002'
  ) then raise exception 'Subscriptions survived token rotation'; end if;
end;
$$;
set role anon;
do $$
declare rejected boolean := false;
begin
  begin
    perform public.cc_register_push_subscription(
      '123456', current_setting('test.token_b')::uuid,
      'https://fcm.googleapis.com/fcm/send/shared', repeat('a', 87), repeat('a', 22)
    );
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Rotated token registered a subscription'; end if;
  perform public.cc_register_push_subscription(
    '123456', current_setting('test.new_token_b')::uuid,
    'https://fcm.googleapis.com/fcm/send/shared', repeat('b', 87), repeat('b', 22)
  );
end;
$$;
reset role;
select clock_timestamp() < '2026-11-30 12:00:00+00'::timestamptz as phone_recovery_available \gset
\if :phone_recovery_available
set role service_role;
select public.cc_recover_player_with_phone('123456', '441234567891') ->> 'player_token' as phone_token \gset
reset role;
select set_config('test.phone_token', coalesce(:'phone_token', ''), false);
do $$
begin
  if current_setting('test.phone_token') = '' then
    raise exception 'Phone recovery did not return a token';
  end if;
  if exists (
    select 1 from public.cc_push_subscriptions s
    join public.cc_player_recovery_credentials c on c.player_id = s.player_id
    where c.handle = '10000000-0000-0000-0000-000000000002'
  ) then raise exception 'Phone recovery left a stale subscription'; end if;
end;
$$;
set role anon;
select public.cc_register_push_subscription(
  '123456', current_setting('test.phone_token')::uuid,
  'https://fcm.googleapis.com/fcm/send/shared', repeat('b', 87), repeat('b', 22)
);
\else
\echo 'Temporary phone recovery has expired; credential recovery was tested.'
\endif
