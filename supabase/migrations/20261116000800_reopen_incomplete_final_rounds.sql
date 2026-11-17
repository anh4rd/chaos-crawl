update public.cc_game_sessions s
set final_vote_completed_at = null,
    final_vote_winner_player_id = null,
    final_vote_winner_evidence_id = null,
    final_vote_winner_points = 0,
    final_vote_winner_vote_count = 0
where s.final_vote_completed_at is not null
  and exists (
    select 1
    from public.cc_game_session_challenges c
    left join public.cc_game_session_final_round_challenges state
      on state.session_id = c.session_id and state.challenge_id = c.id
    where c.session_id = s.id
      and c.kind = 'side'
      and state.status is distinct from 'results'
  );

notify pgrst, 'reload schema';
