create or replace function public.cc_require_votes_for_final_vote_completion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.final_vote_completed_at is not null and not exists (
    select 1
    from public.cc_game_session_final_round_votes v
    join public.cc_game_session_evidence e
      on e.id = v.evidence_id and e.session_id = v.session_id
    join public.cc_game_session_challenges c
      on c.id = e.challenge_id and c.session_id = e.session_id
    left join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id
      and sub.player_id = e.player_id
      and sub.challenge_id = e.challenge_id
    left join public.cc_game_session_secret_assignments sa
      on sa.id = e.secret_assignment_id and sa.session_id = e.session_id
    where v.session_id = new.id
      and (
        (e.secret_assignment_id is null and c.kind = 'side' and sub.status in ('submitted', 'approved'))
        or (e.secret_assignment_id is not null and c.kind = 'secret' and sa.status = 'approved' and e.saved_for_final)
      )
  ) then
    new.final_vote_completed_at := null;
    new.final_vote_winner_player_id := null;
    new.final_vote_winner_evidence_id := null;
    new.final_vote_winner_points := 0;
    new.final_vote_winner_vote_count := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists cc_require_votes_for_final_vote_completion
  on public.cc_game_sessions;
create trigger cc_require_votes_for_final_vote_completion
before update of final_vote_completed_at on public.cc_game_sessions
for each row
execute function public.cc_require_votes_for_final_vote_completion();

update public.cc_game_sessions s
set final_vote_completed_at = null,
    final_vote_winner_player_id = null,
    final_vote_winner_evidence_id = null,
    final_vote_winner_points = 0,
    final_vote_winner_vote_count = 0
where s.final_vote_completed_at is not null
  and not exists (
    select 1
    from public.cc_game_session_final_round_votes v
    join public.cc_game_session_evidence e
      on e.id = v.evidence_id and e.session_id = v.session_id
    join public.cc_game_session_challenges c
      on c.id = e.challenge_id and c.session_id = e.session_id
    left join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id
      and sub.player_id = e.player_id
      and sub.challenge_id = e.challenge_id
    left join public.cc_game_session_secret_assignments sa
      on sa.id = e.secret_assignment_id and sa.session_id = e.session_id
    where v.session_id = s.id
      and (
        (e.secret_assignment_id is null and c.kind = 'side' and sub.status in ('submitted', 'approved'))
        or (e.secret_assignment_id is not null and c.kind = 'secret' and sa.status = 'approved' and e.saved_for_final)
      )
  );

notify pgrst, 'reload schema';
