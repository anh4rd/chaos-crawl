create table if not exists public.cc_game_session_timers (
  session_id uuid primary key references public.cc_game_sessions(id) on delete cascade,
  round_number integer not null,
  remaining_seconds integer not null default 0 check (remaining_seconds >= 0),
  is_running boolean not null default false,
  is_on_break boolean not null default false,
  resume_round_number integer,
  break_ends_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.cc_game_session_timers add column if not exists resume_round_number integer;
alter table public.cc_game_session_timers add column if not exists break_ends_at timestamptz;

alter table public.cc_game_session_timers enable row level security;
grant select on public.cc_game_session_timers to anon, authenticated;
grant insert, update on public.cc_game_session_timers to authenticated;

drop policy if exists "Players can read session timers" on public.cc_game_session_timers;
create policy "Players can read session timers"
  on public.cc_game_session_timers for select to anon, authenticated
  using (true);

drop policy if exists "Hosts can create their session timers" on public.cc_game_session_timers;
create policy "Hosts can create their session timers"
  on public.cc_game_session_timers for insert to authenticated
  with check (exists (
    select 1 from public.cc_game_sessions s
    where s.id = session_id and s.host_id = auth.uid()
  ));

drop policy if exists "Hosts can update their session timers" on public.cc_game_session_timers;
create policy "Hosts can update their session timers"
  on public.cc_game_session_timers for update to authenticated
  using (exists (
    select 1 from public.cc_game_sessions s
    where s.id = session_id and s.host_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.cc_game_sessions s
    where s.id = session_id and s.host_id = auth.uid()
  ));

notify pgrst, 'reload schema';
