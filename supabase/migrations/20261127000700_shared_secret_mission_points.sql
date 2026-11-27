alter table public.cc_game_sessions
  add column secret_mission_points integer not null default 10
  check (secret_mission_points between 0 and 10000);

-- Existing active games keep their first mission's value; awarded scores are untouched.
update public.cc_game_sessions s
set secret_mission_points = coalesce((
  select greatest(0, least(10000, c.points))
  from public.cc_game_session_challenges c
  where c.session_id = s.id and c.kind = 'secret'
  order by c.sort_order, c.id
  limit 1
), 10)
where s.status in ('lobby', 'live');

update public.cc_game_session_challenges c
set points = s.secret_mission_points
from public.cc_game_sessions s
where c.session_id = s.id and c.kind = 'secret'
  and s.status in ('lobby', 'live');

create function public.cc_secret_mission_points_from_plan(p_plan jsonb)
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_points text := p_plan ->> 'secretMissionPoints';
begin
  if v_points is null then
    if pg_catalog.jsonb_typeof(p_plan -> 'selectedTasks') = 'array' then
      select item.value ->> 'points' into v_points
      from pg_catalog.jsonb_array_elements(p_plan -> 'selectedTasks')
        with ordinality as item(value, position)
      where item.value ->> 'kind' = 'secret'
        and coalesce(item.value ->> 'points', '') ~ '^[0-9]{1,5}$'
      order by item.position
      limit 1;
    end if;
    return least(10000, coalesce(v_points::integer, 10));
  end if;
  if pg_catalog.jsonb_typeof(p_plan -> 'secretMissionPoints') <> 'number'
    or v_points !~ '^[0-9]{1,5}$' or v_points::integer > 10000 then
    raise exception 'Secret mission points must be a whole number between 0 and 10000.';
  end if;
  return v_points::integer;
end;
$$;

create function public.cc_set_session_secret_points_from_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan jsonb;
begin
  if new.host_game_id is not null then
    select plan_data into v_plan from public.host_games where id = new.host_game_id;
    new.secret_mission_points := public.cc_secret_mission_points_from_plan(v_plan);
  end if;
  return new;
end;
$$;

create trigger cc_session_secret_points_from_plan
before insert on public.cc_game_sessions
for each row execute function public.cc_set_session_secret_points_from_plan();

create function public.cc_sync_plan_secret_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.plan_data -> 'secretMissionPoints' is distinct from old.plan_data -> 'secretMissionPoints'
    and new.plan_data ? 'secretMissionPoints' then
    update public.cc_game_sessions
    set secret_mission_points = public.cc_secret_mission_points_from_plan(new.plan_data)
    where host_game_id = new.id and status in ('lobby', 'live');
  end if;
  return new;
end;
$$;

create trigger cc_plan_secret_points_sync
after update of plan_data on public.host_games
for each row execute function public.cc_sync_plan_secret_points();

create function public.cc_apply_shared_secret_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'secret' then
    select s.secret_mission_points into new.points
    from public.cc_game_sessions s where s.id = new.session_id
    for share;
    if not found then raise exception 'Game session not found.'; end if;
  end if;
  return new;
end;
$$;

create trigger cc_challenge_shared_secret_points
before insert or update of points, kind, session_id on public.cc_game_session_challenges
for each row execute function public.cc_apply_shared_secret_points();

create function public.cc_sync_session_secret_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.secret_mission_points is distinct from old.secret_mission_points then
    update public.cc_game_session_challenges
    set points = new.secret_mission_points
    where session_id = new.id and kind = 'secret';
  end if;
  return new;
end;
$$;

create trigger cc_session_secret_points_sync
after update of secret_mission_points on public.cc_game_sessions
for each row execute function public.cc_sync_session_secret_points();

create or replace function public.cc_host_review_secret_mission(
  p_assignment_id uuid, p_approve boolean, p_points integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.cc_game_sessions%rowtype;
  v_assignment public.cc_game_session_secret_assignments%rowtype;
  v_points integer;
begin
  select s.* into v_session
  from public.cc_game_sessions s
  join public.cc_game_session_secret_assignments a on a.session_id = s.id
  where a.id = p_assignment_id and public.cc_can_host_session(s.id)
  for update of s;
  if not found then raise exception 'Secret mission not found for this host.'; end if;

  select * into v_assignment
  from public.cc_game_session_secret_assignments
  where id = p_assignment_id and session_id = v_session.id
  for update;
  if not found then raise exception 'Secret mission not found for this host.'; end if;
  if v_assignment.status <> 'submitted' then
    raise exception 'Only submitted secret missions can be reviewed.';
  end if;
  v_points := case when p_approve then v_session.secret_mission_points else 0 end;

  update public.cc_game_session_players
  set score = greatest(0, score + v_points)
  where id = v_assignment.player_id and session_id = v_assignment.session_id;
  update public.cc_game_session_secret_assignments
  set status = case when p_approve then 'approved' else 'rejected' end,
      awarded_points = v_points,
      reviewed_at = pg_catalog.now()
  where id = v_assignment.id;
  return pg_catalog.jsonb_build_object(
    'success', true,
    'status', case when p_approve then 'approved' else 'rejected' end,
    'awarded_points', v_points
  );
end;
$$;

revoke all on function public.cc_secret_mission_points_from_plan(jsonb) from public, anon, authenticated;
revoke all on function public.cc_set_session_secret_points_from_plan() from public, anon, authenticated;
revoke all on function public.cc_sync_plan_secret_points() from public, anon, authenticated;
revoke all on function public.cc_apply_shared_secret_points() from public, anon, authenticated;
revoke all on function public.cc_sync_session_secret_points() from public, anon, authenticated;
revoke all on function public.cc_host_review_secret_mission(uuid, boolean, integer) from public, anon;
grant execute on function public.cc_host_review_secret_mission(uuid, boolean, integer) to authenticated, service_role;
notify pgrst, 'reload schema';
