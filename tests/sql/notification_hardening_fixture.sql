-- Isolated contract fixture, not a Supabase baseline or a substitute for the game.
create role anon;
create role authenticated;
create role service_role;

create table public.cc_game_sessions (
  id uuid primary key default gen_random_uuid(),
  join_code text not null unique,
  status text not null,
  player_limit integer not null,
  current_round_number integer,
  final_voting_open boolean not null default false
);
create table public.cc_game_session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cc_game_sessions(id),
  name text not null,
  last_seen_at timestamptz,
  unique (id, session_id)
);
create table public.cc_game_session_player_private (
  player_id uuid not null,
  session_id uuid not null,
  player_token uuid not null,
  phone_normalized text,
  foreign key (player_id, session_id)
    references public.cc_game_session_players(id, session_id)
);
create table public.cc_game_session_secret_assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  player_id uuid not null,
  status text not null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  foreign key (player_id, session_id)
    references public.cc_game_session_players(id, session_id)
);
alter table public.cc_game_session_player_private enable row level security;
revoke all on public.cc_game_session_player_private from public, anon, authenticated;

\ir ../../supabase/migrations/20261127000200_player_recovery.sql
\ir ../../supabase/migrations/20261127000400_optional_player_phone.sql
\ir ../../supabase/migrations/20261127000500_temporary_phone_recovery.sql
\ir ../../supabase/migrations/20261127000600_phone_recovery_all_games.sql
\ir ../../supabase/migrations/20261128000100_player_notifications.sql
\ir ../../supabase-test/notification-migrations/20261128000200_notification_hardening.sql
