begin;

insert into auth.users (id, email, email_confirmed_at) values
  ('a0000000-0000-0000-0000-000000000001', 'owner-host-tools@example.invalid', now()),
  ('a0000000-0000-0000-0000-000000000002', 'admin-host-tools@example.invalid', now()),
  ('a0000000-0000-0000-0000-000000000003', 'member-host-tools@example.invalid', now()),
  ('a0000000-0000-0000-0000-000000000004', 'outsider-host-tools@example.invalid', now()),
  ('a0000000-0000-0000-0000-000000000005', 'unverified-host-tools@example.invalid', null);
insert into public.cc_platform_admins (user_id, email)
values ('a0000000-0000-0000-0000-000000000002', 'admin-host-tools@example.invalid');
insert into public.host_games (id, host_id, name, plan_data) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Plan A',
   '{"customTasks":[{"id":"custom-1","title":"Custom task"},{"id":"pregame-2","title":"Pregame task"},{"id":"community-3","title":"Imported task"},7]}'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Plan B',
   '{"customTasks":{}}');
insert into public.host_favourites (host_id, item_type, item_id, item_data) values
  ('a0000000-0000-0000-0000-000000000001', 'task', 'task-1', '{"title":"Liked task","points":10}'),
  ('a0000000-0000-0000-0000-000000000001', 'venue', 'venue-1', '{"title":"Not a task"}'),
  ('a0000000-0000-0000-0000-000000000004', 'task', 'task-2', '{"title":"Other host task"}');
insert into public.cc_catalog_submissions (submitted_by, item_type, title, description, status) values
  ('a0000000-0000-0000-0000-000000000001', 'challenge', 'Submitted task', 'A useful description.', 'rejected'),
  ('a0000000-0000-0000-0000-000000000001', 'venue', 'Submitted venue', 'A useful description.', 'approved'),
  ('a0000000-0000-0000-0000-000000000004', 'challenge', 'Other task', 'A useful description.', 'approved');

do $$
begin
  if has_function_privilege('anon', 'public.cc_super_admin_host_challenges(uuid)', 'execute') then
    raise exception 'Anonymous users can execute the challenge RPC';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
select public.cc_add_game_cohost('b0000000-0000-0000-0000-000000000001', ' MEMBER-HOST-TOOLS@example.invalid ');
do $$
declare result jsonb;
begin
  if (select count(*) from public.cc_list_game_cohosts('b0000000-0000-0000-0000-000000000001')) <> 1 then
    raise exception 'Administrator could not list added co-host';
  end if;
  result := public.cc_super_admin_host_challenges('a0000000-0000-0000-0000-000000000001');
  if jsonb_array_length(result->'liked') <> 1 or result->'liked'->0->>'title' <> 'Liked task'
     or jsonb_array_length(result->'created') <> 3
     or not result @> '{"created":[{"title":"Submitted task","status":"rejected"}]}'::jsonb then
    raise exception 'Incorrect challenge projection: %', result;
  end if;
  begin
    perform public.cc_add_game_cohost('b0000000-0000-0000-0000-000000000001', 'owner-host-tools@example.invalid');
    raise exception 'Owner accepted as co-host';
  exception when raise_exception then
    if sqlerrm <> 'That account already owns this game.' then raise; end if;
  end;
  begin
    perform public.cc_add_game_cohost('b0000000-0000-0000-0000-000000000001', 'unverified-host-tools@example.invalid');
    raise exception 'Unverified account accepted';
  exception when raise_exception then
    if sqlerrm <> 'Could not identify one verified host account for that email.' then raise; end if;
  end;
  begin
    perform public.cc_remove_game_cohost('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003');
    raise exception 'Administrator could remove co-host';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can manage co-hosts.' then raise; end if;
  end;
  begin
    perform public.cc_super_admin_host_challenges('a0000000-0000-0000-0000-000000000099');
    raise exception 'Missing host accepted';
  exception when raise_exception then
    if sqlerrm <> 'Host account not found.' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);
do $$
begin
  begin
    perform public.cc_list_game_cohosts('b0000000-0000-0000-0000-000000000001');
    raise exception 'Outsider could list co-hosts';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can manage co-hosts.' then raise; end if;
  end;
  begin
    perform public.cc_add_game_cohost('b0000000-0000-0000-0000-000000000001', 'member-host-tools@example.invalid');
    raise exception 'Outsider could add co-hosts';
  exception when raise_exception then
    if sqlerrm <> 'Only the game owner can manage co-hosts.' then raise; end if;
  end;
  begin
    perform public.cc_super_admin_host_challenges('a0000000-0000-0000-0000-000000000001');
    raise exception 'Outsider could read host challenges';
  exception when raise_exception then
    if sqlerrm <> 'Not authorised as platform administrator.' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select public.cc_remove_game_cohost('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003');
do $$
begin
  if exists (select 1 from public.cc_list_game_cohosts('b0000000-0000-0000-0000-000000000001')) then
    raise exception 'Owner could not remove co-host';
  end if;
end $$;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
do $$
begin
  if exists (select 1 from public.cc_list_game_cohosts('b0000000-0000-0000-0000-000000000001')) then
    raise exception 'Administrator still sees revoked co-host';
  end if;
end $$;

rollback;
