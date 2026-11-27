-- Owners retain co-host removal; administrators may list and add co-hosts.
create or replace function public.cc_add_game_cohost(p_host_game_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_owner_id uuid;
  v_user_ids uuid[];
begin
  select g.host_id into v_owner_id from public.host_games g where g.id = p_host_game_id;
  if auth.uid() is null or not found or
    (v_owner_id <> auth.uid() and not public.cc_is_platform_admin()) then
    raise exception 'Only the game owner can manage co-hosts.';
  end if;

  select array_agg(u.id) into v_user_ids
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
    and u.email_confirmed_at is not null;
  if coalesce(cardinality(v_user_ids), 0) <> 1 then
    raise exception 'Could not identify one verified host account for that email.';
  end if;
  if v_user_ids[1] = v_owner_id then
    if v_owner_id = auth.uid() then raise exception 'You already own this game.'; end if;
    raise exception 'That account already owns this game.';
  end if;
  insert into public.cc_game_cohosts (host_game_id, user_id, added_by)
  values (p_host_game_id, v_user_ids[1], auth.uid())
  on conflict (host_game_id, user_id) do nothing;
end;
$$;

create or replace function public.cc_list_game_cohosts(p_host_game_id uuid)
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.host_games g
    where g.id = p_host_game_id
      and (g.host_id = auth.uid() or public.cc_is_platform_admin())
  ) then
    raise exception 'Only the game owner can manage co-hosts.';
  end if;
  return query
  select c.user_id, u.email::text
  from public.cc_game_cohosts c
  join auth.users u on u.id = c.user_id
  where c.host_game_id = p_host_game_id
  order by c.created_at, c.user_id;
end;
$$;

create function public.cc_super_admin_host_challenges(p_host_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.cc_is_platform_admin() then
    raise exception 'Not authorised as platform administrator.';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_host_id) then
    raise exception 'Host account not found.';
  end if;

  select pg_catalog.jsonb_build_object(
    'liked', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', f.id,
          'title', coalesce(nullif(f.item_data ->> 'title', ''), 'Saved challenge'),
          'description', f.item_data ->> 'description',
          'source', 'Saved challenge',
          'status', null,
          'details', f.item_data
        ) order by f.created_at desc, f.id
      )
      from public.host_favourites f
      where f.host_id = p_host_id and f.item_type = 'task'
    ), '[]'::jsonb),
    'created', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', c.id,
          'title', c.title,
          'description', c.description,
          'source', c.source,
          'status', c.status,
          'details', c.details
        ) order by c.created_at desc, c.id
      )
      from (
        select 'submission:' || s.id::text as id, s.title, s.description,
          'Community submission'::text as source, s.status, s.payload as details, s.created_at
        from public.cc_catalog_submissions s
        where s.submitted_by = p_host_id and s.item_type = 'challenge'
        union all
        select 'plan:' || g.id::text || ':' || task.position::text,
          coalesce(nullif(task.value ->> 'title', ''), 'Untitled challenge'),
          task.value ->> 'description',
          'Custom challenge in game plan: ' || g.name, null::text, task.value, g.created_at
        from public.host_games g
        cross join lateral pg_catalog.jsonb_array_elements(
          case when pg_catalog.jsonb_typeof(g.plan_data -> 'customTasks') = 'array'
            then g.plan_data -> 'customTasks' else '[]'::jsonb end
        ) with ordinality as task(value, position)
        where g.host_id = p_host_id
          and pg_catalog.jsonb_typeof(task.value) = 'object'
          and (task.value ->> 'id' like 'custom-%' or task.value ->> 'id' like 'pregame-%')
      ) c
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.cc_super_admin_host_challenges(uuid) from public, anon, authenticated;
grant execute on function public.cc_super_admin_host_challenges(uuid) to authenticated;
