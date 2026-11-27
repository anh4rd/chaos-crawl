-- Membership only: game and session access are granted by the following migrations.
create table public.cc_game_cohosts (
  host_game_id uuid not null references public.host_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (host_game_id, user_id)
);

alter table public.cc_game_cohosts enable row level security;

create policy "Hosts can read game cohosts"
  on public.cc_game_cohosts for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.host_games g
      where g.id = host_game_id and g.host_id = auth.uid()
    )
  );

revoke all on public.cc_game_cohosts from public, anon, authenticated;
grant select on public.cc_game_cohosts to authenticated;

create function public.cc_can_host_game(p_host_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.host_games g
    where g.id = p_host_game_id
      and (
        g.host_id = auth.uid()
        or exists (
          select 1 from public.cc_game_cohosts c
          where c.host_game_id = g.id and c.user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function public.cc_can_host_game(uuid) from public, anon, authenticated;
grant execute on function public.cc_can_host_game(uuid) to authenticated;

create function public.cc_add_game_cohost(p_host_game_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user_ids uuid[];
begin
  if auth.uid() is null or not exists (
    select 1 from public.host_games g
    where g.id = p_host_game_id and g.host_id = auth.uid()
  ) then
    raise exception 'Only the game owner can manage co-hosts.';
  end if;

  select array_agg(u.id) into v_user_ids
  from auth.users u
  where lower(u.email) = lower(trim(p_email))
    and u.email_confirmed_at is not null;

  if coalesce(cardinality(v_user_ids), 0) <> 1 then
    raise exception 'Could not identify one verified host account for that email.';
  end if;
  if v_user_ids[1] = auth.uid() then
    raise exception 'You already own this game.';
  end if;

  insert into public.cc_game_cohosts (host_game_id, user_id, added_by)
  values (p_host_game_id, v_user_ids[1], auth.uid())
  on conflict (host_game_id, user_id) do nothing;
end;
$$;

revoke all on function public.cc_add_game_cohost(uuid, text) from public, anon, authenticated;
grant execute on function public.cc_add_game_cohost(uuid, text) to authenticated;

create function public.cc_remove_game_cohost(p_host_game_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.host_games g
    where g.id = p_host_game_id and g.host_id = auth.uid()
  ) then
    raise exception 'Only the game owner can manage co-hosts.';
  end if;

  delete from public.cc_game_cohosts
  where host_game_id = p_host_game_id and user_id = p_user_id;
end;
$$;

revoke all on function public.cc_remove_game_cohost(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cc_remove_game_cohost(uuid, uuid) to authenticated;

create function public.cc_list_game_cohosts(p_host_game_id uuid)
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.host_games g
    where g.id = p_host_game_id and g.host_id = auth.uid()
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

revoke all on function public.cc_list_game_cohosts(uuid) from public, anon, authenticated;
grant execute on function public.cc_list_game_cohosts(uuid) to authenticated;
