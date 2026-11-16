do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cc_game_session_timers'
  ) then
    alter publication supabase_realtime add table public.cc_game_session_timers;
  end if;
end
$$;
