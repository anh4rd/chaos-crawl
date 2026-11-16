create or replace function public.cc_host_reopen_session_final_round_challenge(
  p_session_id uuid,
  p_challenge_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.cc_game_sessions%rowtype;
  v_round_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_status text;
  v_first_evidence_id uuid;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and host_id = auth.uid()
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  if not exists (
    select 1
    from public.cc_game_session_challenges c
    where c.id = p_challenge_id
      and c.session_id = p_session_id
      and c.kind = 'side'
  ) then
    raise exception 'Choose a side challenge from this game';
  end if;

  select * into v_round_state
  from public.cc_game_session_final_round_state
  where session_id = p_session_id
  for update;
  if not found then
    raise exception 'The final round is not initialized';
  end if;

  select state.status into v_challenge_status
  from public.cc_game_session_final_round_challenges state
  where state.session_id = p_session_id
    and state.challenge_id = p_challenge_id
  for update;

  if v_challenge_status is distinct from 'results' then
    raise exception 'Only a reviewed side challenge can be reopened';
  end if;

  update public.cc_game_session_players p
  set score = greatest(0, p.score - award.points_awarded)
  from public.cc_game_session_final_round_awards award
  where award.session_id = p_session_id
    and award.challenge_id = p_challenge_id
    and award.player_id = p.id
    and award.points_awarded > 0;

  delete from public.cc_game_session_final_round_awards
  where session_id = p_session_id and challenge_id = p_challenge_id;

  delete from public.cc_game_session_final_round_votes
  where session_id = p_session_id and challenge_id = p_challenge_id;

  select e.id into v_first_evidence_id
  from public.cc_game_session_evidence e
  join public.cc_game_session_submissions sub
    on sub.session_id = e.session_id
    and sub.player_id = e.player_id
    and sub.challenge_id = e.challenge_id
  where e.session_id = p_session_id
    and e.challenge_id = p_challenge_id
    and e.secret_assignment_id is null
    and sub.status in ('submitted', 'approved')
  order by e.created_at, e.id
  limit 1;

  update public.cc_game_session_final_round_challenges
  set status = 'voting',
      votes_cast = 0,
      opened_at = now(),
      closed_at = null
  where session_id = p_session_id and challenge_id = p_challenge_id;

  update public.cc_game_session_final_round_state
  set is_open = true,
      voting_open = true,
      slideshow_challenge_id = p_challenge_id,
      slideshow_evidence_id = v_first_evidence_id,
      opened_at = now(),
      closed_at = null,
      updated_at = now()
  where session_id = p_session_id;

  update public.cc_game_sessions
  set final_gallery_open = true,
      final_voting_open = true,
      final_vote_completed_at = null,
      final_vote_winner_player_id = null,
      final_vote_winner_evidence_id = null,
      final_vote_winner_points = 0,
      final_vote_winner_vote_count = 0
  where id = p_session_id;

  return jsonb_build_object(
    'challenge_id', p_challenge_id,
    'final_gallery_open', true,
    'final_voting_open', true,
    'votes_cast', 0
  );
end;
$$;

grant execute on function public.cc_host_reopen_session_final_round_challenge(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
