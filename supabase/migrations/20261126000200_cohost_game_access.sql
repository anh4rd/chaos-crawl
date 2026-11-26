-- Co-host host RPC access is granted by the following migration.
create function public.cc_can_host_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.cc_game_sessions s
    where s.id = p_session_id
      and (
        s.host_id = auth.uid()
        or exists (
          select 1 from public.host_games g
          where g.id = s.host_game_id
            and g.host_id = s.host_id
            and public.cc_can_host_game(g.id)
        )
      )
  );
$$;

revoke all on function public.cc_can_host_session(uuid) from public, anon, authenticated;
grant execute on function public.cc_can_host_session(uuid) to authenticated;

create function public.cc_guard_cohost_game_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is not null and auth.uid() <> old.host_id and (
    new.host_id is distinct from old.host_id
    or coalesce((new.plan_data ->> 'hostParticipates') = 'true', false)
      is distinct from coalesce((old.plan_data ->> 'hostParticipates') = 'true', false)
  ) then
    raise exception 'Only the game owner can change ownership or host participation.';
  end if;
  return new;
end;
$$;

create trigger cc_guard_cohost_game_update
before update on public.host_games
for each row execute function public.cc_guard_cohost_game_update();

create function public.cc_guard_cohost_session_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is not null and auth.uid() <> old.host_id and (
    new.host_id is distinct from old.host_id
    or new.host_game_id is distinct from old.host_game_id
    or new.host_participates is distinct from old.host_participates
    or new.host_player_id is distinct from old.host_player_id
  ) then
    raise exception 'Only the game owner can change ownership or host participation.';
  end if;
  return new;
end;
$$;

create trigger cc_guard_cohost_session_update
before update on public.cc_game_sessions
for each row execute function public.cc_guard_cohost_session_update();

create policy "Co-hosts can read shared games"
on public.host_games for select to authenticated
using (public.cc_can_host_game(id));

create policy "Co-hosts can update shared games"
on public.host_games for update to authenticated
using (public.cc_can_host_game(id))
with check (public.cc_can_host_game(id));

create policy "Co-hosts can read shared sessions"
on public.cc_game_sessions for select to authenticated
using (public.cc_can_host_session(id));

create policy "Co-hosts can update shared sessions"
on public.cc_game_sessions for update to authenticated
using (public.cc_can_host_session(id))
with check (public.cc_can_host_session(id));

create function public.cc_can_manage_session_player(p_session_id uuid, p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1 from public.cc_game_sessions s
    where s.id = p_session_id
      and public.cc_can_host_session(s.id)
      and (s.host_id = auth.uid() or s.host_player_id is distinct from p_player_id)
  );
$$;

revoke all on function public.cc_can_manage_session_player(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cc_can_manage_session_player(uuid, uuid) to authenticated;

create policy "Co-hosts can read session players"
on public.cc_game_session_players for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can add session players"
on public.cc_game_session_players for insert to authenticated
with check (public.cc_can_manage_session_player(session_id, id));

create policy "Co-hosts can update session players"
on public.cc_game_session_players for update to authenticated
using (public.cc_can_host_session(session_id))
with check (public.cc_can_host_session(session_id));

create policy "Co-hosts can delete session players"
on public.cc_game_session_players for delete to authenticated
using (public.cc_can_manage_session_player(session_id, id));

create function public.cc_guard_cohost_player_update()
returns trigger
language plpgsql
set search_path = pg_catalog, public, auth
as $$
begin
  if auth.uid() is not null
    and exists (
      select 1 from public.cc_game_sessions s
      where s.id = old.session_id and s.host_id <> auth.uid()
    )
    and (new.id is distinct from old.id or new.session_id is distinct from old.session_id)
  then
    raise exception 'Co-hosts cannot move or replace a player identity.';
  end if;
  return new;
end;
$$;

create trigger cc_guard_cohost_player_update
before update on public.cc_game_session_players
for each row execute function public.cc_guard_cohost_player_update();

create policy "Co-hosts can manage session challenges"
on public.cc_game_session_challenges for all to authenticated
using (public.cc_can_host_session(session_id))
with check (public.cc_can_host_session(session_id));

create policy "Co-hosts can manage session teams"
on public.cc_game_session_teams for all to authenticated
using (public.cc_can_host_session(session_id))
with check (public.cc_can_host_session(session_id));

create policy "Co-hosts can manage session submissions"
on public.cc_game_session_submissions for all to authenticated
using (public.cc_can_host_session(session_id))
with check (public.cc_can_host_session(session_id));

create policy "Co-hosts can read session evidence"
on public.cc_game_session_evidence for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can update session evidence"
on public.cc_game_session_evidence for update to authenticated
using (public.cc_can_host_session(session_id))
with check (public.cc_can_host_session(session_id));

create policy "Co-hosts can read final votes"
on public.cc_game_session_final_votes for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read final round awards"
on public.cc_game_session_final_round_awards for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read final round challenges"
on public.cc_game_session_final_round_challenges for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read final round state"
on public.cc_game_session_final_round_state for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read final round votes"
on public.cc_game_session_final_round_votes for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read reward rounds"
on public.cc_game_session_reward_rounds for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read reward votes"
on public.cc_game_session_reward_votes for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read reward awards"
on public.cc_game_session_reward_awards for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read secret assignments"
on public.cc_game_session_secret_assignments for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read secret review assignments"
on public.cc_game_session_secret_review_assignments for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read secret review state"
on public.cc_game_session_secret_review_state for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can read secret review votes"
on public.cc_game_session_secret_review_votes for select to authenticated
using (public.cc_can_host_session(session_id));

create policy "Co-hosts can create session timers"
on public.cc_game_session_timers for insert to authenticated
with check (public.cc_can_host_session(session_id));

create policy "Co-hosts can update session timers"
on public.cc_game_session_timers for update to authenticated
using (public.cc_can_host_session(session_id))
with check (public.cc_can_host_session(session_id));
