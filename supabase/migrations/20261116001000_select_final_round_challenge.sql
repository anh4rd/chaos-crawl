create or replace function public.cc_host_select_session_final_round_challenge(
  p_session_id uuid,
  p_challenge_id uuid,
  p_evidence_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_status text;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and host_id = auth.uid()
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  insert into public.cc_game_session_final_round_state (session_id)
  values (p_session_id)
  on conflict (session_id) do nothing;

  select * into v_state
  from public.cc_game_session_final_round_state
  where session_id = p_session_id
  for update;
  if not found then
    raise exception 'The final round is not initialized';
  end if;

  select state.status into v_challenge_status
  from public.cc_game_session_final_round_challenges state
  join public.cc_game_session_challenges challenge
    on challenge.id = state.challenge_id and challenge.session_id = state.session_id
  where state.session_id = p_session_id
    and state.challenge_id = p_challenge_id
    and challenge.kind = 'side'
  for update of state;

  if v_challenge_status is null or v_challenge_status not in ('pending', 'results') then
    raise exception 'Choose a pending or reviewed side challenge';
  end if;

  if v_state.voting_open then
    raise exception 'Close the current vote before changing challenges';
  end if;

  if p_evidence_id is not null and not exists (
    select 1
    from public.cc_game_session_evidence e
    join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id
      and sub.player_id = e.player_id
      and sub.challenge_id = e.challenge_id
    where e.id = p_evidence_id
      and e.session_id = p_session_id
      and e.challenge_id = p_challenge_id
      and e.secret_assignment_id is null
      and sub.status in ('submitted', 'approved')
  ) then
    raise exception 'Choose an eligible submission from this side challenge';
  end if;

  update public.cc_game_session_final_round_state
  set slideshow_challenge_id = p_challenge_id,
      slideshow_evidence_id = p_evidence_id,
      updated_at = now()
  where session_id = p_session_id;
end;
$$;

grant execute on function public.cc_host_select_session_final_round_challenge(uuid, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
