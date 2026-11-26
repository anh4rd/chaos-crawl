-- Abort rather than overwrite a host RPC whose deployed definition has changed.
do $$
begin
  if md5(pg_get_functiondef('cc_host_adjust_session_score(uuid,text,uuid,integer)'::regprocedure)) <> '645fb543bd7adb3a4570cff39c28de71' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_adjust_session_score';
  end if;
  if md5(pg_get_functiondef('cc_host_advance_secret_review(uuid)'::regprocedure)) <> '944f4f30a15352445d498c41bb749e94' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_advance_secret_review';
  end if;
  if md5(pg_get_functiondef('cc_host_advance_session_final_round_challenge(uuid)'::regprocedure)) <> '1b4e65029899eaac5eac5e7b6a94c676' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_advance_session_final_round_challenge';
  end if;
  if md5(pg_get_functiondef('cc_host_assign_secret_mission(uuid,uuid,uuid,timestamp with time zone)'::regprocedure)) <> 'a1d4f7bd231de88644e105acead6deed' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_assign_secret_mission';
  end if;
  if md5(pg_get_functiondef('cc_host_cancel_session_reward_round(uuid)'::regprocedure)) <> '37b5e304aae184fd5ad8d148b2c52261' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_cancel_session_reward_round';
  end if;
  if md5(pg_get_functiondef('cc_host_close_secret_review_vote(uuid)'::regprocedure)) <> '7a4f71e7f59b51cc8a81878afe7f50e4' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_close_secret_review_vote';
  end if;
  if md5(pg_get_functiondef('cc_host_complete_game_session(uuid)'::regprocedure)) <> '994b4450d3d5e8faba5d364dd71fec14' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_complete_game_session';
  end if;
  if md5(pg_get_functiondef('cc_host_complete_session_reward_round(uuid,uuid[],uuid[],integer)'::regprocedure)) <> 'c43db57feaf9d51ceb9ee46915a27d94' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_complete_session_reward_round';
  end if;
  if md5(pg_get_functiondef('cc_host_create_game_session(uuid)'::regprocedure)) <> 'a239978bff192c4c0828ddabacf7d073' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_create_game_session';
  end if;
  if md5(pg_get_functiondef('cc_host_dispatch_due_secret_missions(uuid)'::regprocedure)) <> 'f852d47eade7a53a635c6aa1cce107de' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_dispatch_due_secret_missions';
  end if;
  if md5(pg_get_functiondef('cc_host_manage_session_final_round(uuid,boolean,boolean)'::regprocedure)) <> '022e7dd56631a86eb4bfd538895fe34b' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_manage_session_final_round';
  end if;
  if md5(pg_get_functiondef('cc_host_open_secret_review(uuid,uuid)'::regprocedure)) <> '6c35735cdfdc9e48e8e5600f722093b8' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_open_secret_review';
  end if;
  if md5(pg_get_functiondef('cc_host_release_session_reward_round(uuid)'::regprocedure)) <> '325fe367dba434206864f6de438d4257' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_release_session_reward_round';
  end if;
  if md5(pg_get_functiondef('cc_host_reopen_secret_review(uuid,uuid)'::regprocedure)) <> 'c428570fc6f144fa163ebedcb1878316' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_reopen_secret_review';
  end if;
  if md5(pg_get_functiondef('cc_host_reopen_session_final_round_challenge(uuid,uuid)'::regprocedure)) <> 'b29d5ae68f5f7cd672516239e8dfb356' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_reopen_session_final_round_challenge';
  end if;
  if md5(pg_get_functiondef('cc_host_review_secret_mission(uuid,boolean,integer)'::regprocedure)) <> 'c28f7e56e231a8b333f4cc73519df710' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_review_secret_mission';
  end if;
  if md5(pg_get_functiondef('cc_host_review_session_submission(uuid,boolean,integer)'::regprocedure)) <> 'c6dc1a8ae51136e2dbfe49029833cc8f' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_review_session_submission';
  end if;
  if md5(pg_get_functiondef('cc_host_select_secret_review_assignment(uuid,uuid,uuid)'::regprocedure)) <> 'f29f3643432a9355023fb028592d1ba4' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_select_secret_review_assignment';
  end if;
  if md5(pg_get_functiondef('cc_host_select_session_final_round_challenge(uuid,uuid,uuid)'::regprocedure)) <> 'fc3733375772048b3fed9a3b5bf21d10' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_select_session_final_round_challenge';
  end if;
  if md5(pg_get_functiondef('cc_host_set_game_session_round(uuid,integer)'::regprocedure)) <> 'ca30e73abd8667c7a575b0970456653e' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_set_game_session_round';
  end if;
  if md5(pg_get_functiondef('cc_host_set_secret_review_evidence(uuid,uuid)'::regprocedure)) <> '07fdbcc647082e4bf7ddbba5e776fb15' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_set_secret_review_evidence';
  end if;
  if md5(pg_get_functiondef('cc_host_set_session_final_gallery(uuid,boolean,boolean)'::regprocedure)) <> 'ce2a2dc086cbcff9d49735c87a072aac' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_set_session_final_gallery';
  end if;
  if md5(pg_get_functiondef('cc_host_set_session_final_slideshow(uuid,uuid,uuid)'::regprocedure)) <> '1710fa5311d9af13516ac0877f3782ac' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_set_session_final_slideshow';
  end if;
  if md5(pg_get_functiondef('cc_host_start_game_session(uuid)'::regprocedure)) <> '7d14a71dd38f25e5d4e9a4d9a5b48e6b' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_start_game_session';
  end if;
  if md5(pg_get_functiondef('cc_host_start_session_reward_round(uuid,uuid,text,text,integer)'::regprocedure)) <> '7b9cf1a4a5db940628a7bf7f06661fce' then
    raise exception 'Host RPC changed since the co-host migration was prepared: cc_host_start_session_reward_round';
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.cc_host_adjust_session_score(p_session_id uuid, p_target_kind text, p_target_id uuid, p_delta integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if p_session_id is null or p_target_id is null
     or p_target_kind is null
     or p_target_kind not in ('player', 'team')
     or p_delta is null or p_delta = 0 then
    raise exception 'Choose a player or team and a nonzero points adjustment';
  end if;

  perform 1
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  if p_target_kind = 'player' then
    update public.cc_game_session_players
    set score = score + p_delta
    where id = p_target_id and session_id = p_session_id;
  else
    update public.cc_game_session_teams
    set manual_score_adjustment = manual_score_adjustment + p_delta
    where id = p_target_id and session_id = p_session_id;
  end if;

  if not found then
    raise exception 'Player or team not found in this game';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_advance_secret_review(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_secret_review_state%rowtype;
  v_next_assignment_id uuid;
  v_first_evidence_id uuid;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  select * into v_state
  from public.cc_game_session_secret_review_state
  where session_id = p_session_id
  for update;
  if not found or v_state.voting_open or v_state.current_assignment_id is null then
    raise exception 'Close the current secret mission vote before advancing';
  end if;

  if not exists (
    select 1 from public.cc_game_session_secret_review_assignments
    where session_id = p_session_id
      and assignment_id = v_state.current_assignment_id
      and status = 'results'
  ) then
    raise exception 'Reveal the current secret mission results before advancing';
  end if;

  select review.assignment_id into v_next_assignment_id
  from public.cc_game_session_secret_review_assignments review
  join public.cc_game_session_secret_assignments assignment
    on assignment.id = review.assignment_id and assignment.session_id = review.session_id
  where review.session_id = p_session_id
    and review.status = 'pending'
    and assignment.status = 'submitted'
    and review.assignment_id <> v_state.current_assignment_id
  order by assignment.submitted_at nulls last, assignment.created_at, assignment.id
  limit 1;

  if v_next_assignment_id is null then
    update public.cc_game_session_secret_review_state
    set is_open = false, voting_open = false, updated_at = now()
    where session_id = p_session_id;
    return jsonb_build_object('completed', true, 'is_open', false);
  end if;

  select e.id into v_first_evidence_id
  from public.cc_game_session_evidence e
  where e.session_id = p_session_id and e.secret_assignment_id = v_next_assignment_id
  order by e.created_at, e.id
  limit 1;

  update public.cc_game_session_secret_review_assignments
  set status = 'voting', success_votes = 0, fail_votes = 0, votes_cast = 0,
      outcome = null, points_awarded = 0, opened_at = now(), closed_at = null
  where session_id = p_session_id and assignment_id = v_next_assignment_id;

  update public.cc_game_session_secret_review_state
  set is_open = true, voting_open = true,
      current_assignment_id = v_next_assignment_id,
      current_evidence_id = v_first_evidence_id,
      updated_at = now()
  where session_id = p_session_id;

  return jsonb_build_object('assignment_id', v_next_assignment_id, 'voting_open', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_advance_session_final_round_challenge(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_final_round_state%rowtype;
  v_current_sort_order integer;
  v_next_challenge_id uuid;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  select * into v_state
  from public.cc_game_session_final_round_state
  where session_id = p_session_id
  for update;
  if not found or v_state.slideshow_challenge_id is null then
    raise exception 'There is no current side challenge to advance from';
  end if;

  if v_state.voting_open then
    raise exception 'Close the current vote before advancing';
  end if;

  if not exists (
    select 1 from public.cc_game_session_final_round_challenges
    where session_id = p_session_id
      and challenge_id = v_state.slideshow_challenge_id
      and status = 'results'
  ) then
    raise exception 'Reveal the current challenge results before advancing';
  end if;

  select c.sort_order into v_current_sort_order
  from public.cc_game_session_challenges c
  where c.id = v_state.slideshow_challenge_id and c.session_id = p_session_id;

  select state.challenge_id into v_next_challenge_id
  from public.cc_game_session_final_round_challenges state
  join public.cc_game_session_challenges c on c.id = state.challenge_id
  where state.session_id = p_session_id
    and state.status = 'pending'
    and c.kind = 'side'
    and c.sort_order > v_current_sort_order
  order by c.sort_order, c.id
  limit 1;

  if v_next_challenge_id is null then
    select state.challenge_id into v_next_challenge_id
    from public.cc_game_session_final_round_challenges state
    join public.cc_game_session_challenges c on c.id = state.challenge_id
    where state.session_id = p_session_id
      and state.status = 'pending'
      and c.kind = 'side'
    order by c.sort_order, c.id
    limit 1;
  end if;

  if v_next_challenge_id is null then
    raise exception 'All side challenges have already been reviewed';
  end if;

  delete from public.cc_game_session_final_round_votes
  where session_id = p_session_id and challenge_id = v_next_challenge_id;

  update public.cc_game_session_final_round_challenges
  set status = 'voting', votes_cast = 0, opened_at = now(), closed_at = null
  where session_id = p_session_id and challenge_id = v_next_challenge_id;

  update public.cc_game_session_final_round_state
  set is_open = true,
      voting_open = true,
      slideshow_challenge_id = v_next_challenge_id,
      slideshow_evidence_id = (
        select e.id
        from public.cc_game_session_evidence e
        join public.cc_game_session_submissions sub
          on sub.session_id = e.session_id
          and sub.player_id = e.player_id
          and sub.challenge_id = e.challenge_id
        where e.session_id = p_session_id
          and e.challenge_id = v_next_challenge_id
          and e.secret_assignment_id is null
          and sub.status in ('submitted', 'approved')
        order by e.created_at, e.id
        limit 1
      ),
      closed_at = null,
      updated_at = now()
  where session_id = p_session_id;

  update public.cc_game_sessions
  set final_gallery_open = true, final_voting_open = true, final_vote_completed_at = null
  where id = p_session_id;

  return jsonb_build_object(
    'challenge_id', v_next_challenge_id,
    'final_gallery_open', true,
    'final_voting_open', true
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_assign_secret_mission(p_session_id uuid, p_player_id uuid, p_challenge_id uuid, p_scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_challenge public.cc_game_session_challenges%rowtype;
  v_player public.cc_game_session_players%rowtype;
  v_assignment public.cc_game_session_secret_assignments%rowtype;
  v_due_at timestamptz := coalesce(p_scheduled_at, pg_catalog.now());
  v_next_status text;
begin
  if auth.uid() is null then
    raise exception 'Please log in as the host to assign a secret mission.';
  end if;

  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;

  if not found then raise exception 'Game session not found for this host.'; end if;
  if v_session.status not in ('lobby', 'live') then
    raise exception 'Secret missions cannot be assigned after the game has finished.';
  end if;

  select * into v_player
  from public.cc_game_session_players
  where id = p_player_id and session_id = v_session.id;

  if not found then raise exception 'Choose a player in this game.'; end if;

  select * into v_challenge
  from public.cc_game_session_challenges
  where id = p_challenge_id and session_id = v_session.id and kind = 'secret';

  if not found then
    raise exception 'Choose a secret mission from this game, not a main or side challenge.';
  end if;

  -- In the lobby, everything stays scheduled until the host starts the game.
  -- During a live game, a due/immediate mission can be delivered right away.
  if v_session.status = 'live' and v_due_at <= pg_catalog.now() then
    v_next_status := 'sent';
  else
    v_next_status := 'scheduled';
  end if;

  insert into public.cc_game_session_secret_assignments as existing_assignment (
    session_id, player_id, challenge_id, status, scheduled_at, sent_at
  ) values (
    v_session.id,
    v_player.id,
    v_challenge.id,
    v_next_status,
    v_due_at,
    case when v_next_status = 'sent' then pg_catalog.now() else null end
  )
  on conflict (session_id, player_id, challenge_id)
  do update set
    status = excluded.status,
    scheduled_at = excluded.scheduled_at,
    sent_at = excluded.sent_at,
    submitted_at = null,
    reviewed_at = null,
    awarded_points = 0
  where existing_assignment.status = 'scheduled'
  returning * into v_assignment;

  if not found then
    raise exception 'This player has already received or completed that mission. Choose another mission or player.';
  end if;

  return pg_catalog.jsonb_build_object(
    'assignment_id', v_assignment.id,
    'player_id', v_assignment.player_id,
    'challenge_id', v_assignment.challenge_id,
    'status', v_assignment.status,
    'scheduled_at', v_assignment.scheduled_at,
    'sent_at', v_assignment.sent_at
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_cancel_session_reward_round(p_reward_round_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_round public.cc_game_session_reward_rounds%rowtype;
begin
  if auth.uid() is null then raise exception 'Host login required.'; end if;
  select r.* into v_round from public.cc_game_session_reward_rounds r
  join public.cc_game_sessions s on s.id = r.session_id
  where r.id = p_reward_round_id and public.cc_can_host_session(s.id) for update of r;
  if not found then raise exception 'Reward round not found for this host.'; end if;
  if v_round.status <> 'open' then raise exception 'Only an open reward round can be cancelled.'; end if;
  update public.cc_game_session_reward_rounds
  set status = 'cancelled', completed_at = pg_catalog.now(), released_at = pg_catalog.now()
  where id = v_round.id;
  return pg_catalog.jsonb_build_object('success', true, 'cancelled', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_close_secret_review_vote(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_secret_review_state%rowtype;
  v_assignment public.cc_game_session_secret_assignments%rowtype;
  v_success_votes integer;
  v_fail_votes integer;
  v_vote_count integer;
  v_points integer;
  v_outcome text;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  select * into v_state
  from public.cc_game_session_secret_review_state
  where session_id = p_session_id
  for update;
  if not found or not v_state.is_open or not v_state.voting_open or v_state.current_assignment_id is null then
    raise exception 'There is no secret mission vote to close';
  end if;

  select * into v_assignment
  from public.cc_game_session_secret_assignments
  where id = v_state.current_assignment_id and session_id = p_session_id
  for update;
  if not found then
    raise exception 'Secret mission assignment not found';
  end if;

  select count(*) filter (where vote = 'success')::integer,
         count(*) filter (where vote = 'fail')::integer,
         count(*)::integer
  into v_success_votes, v_fail_votes, v_vote_count
  from public.cc_game_session_secret_review_votes
  where session_id = p_session_id and assignment_id = v_state.current_assignment_id;

  v_success_votes := coalesce(v_success_votes, 0);
  v_fail_votes := coalesce(v_fail_votes, 0);
  v_vote_count := coalesce(v_vote_count, 0);
  v_outcome := case when v_success_votes > v_fail_votes then 'success' else 'fail' end;

  select points into v_points
  from public.cc_game_session_challenges
  where id = v_assignment.challenge_id and session_id = p_session_id;
  v_points := case when v_outcome = 'success' then coalesce(v_points, 0) else 0 end;

  update public.cc_game_session_secret_assignments
  set status = case when v_outcome = 'success' then 'approved' else 'rejected' end,
      awarded_points = v_points,
      reviewed_at = now(),
      final_review_outcome = v_outcome
  where id = v_assignment.id and session_id = p_session_id;

  if v_points > 0 then
    update public.cc_game_session_players
    set score = score + v_points
    where id = v_assignment.player_id and session_id = p_session_id;
  end if;

  update public.cc_game_session_secret_review_assignments
  set status = 'results',
      success_votes = v_success_votes,
      fail_votes = v_fail_votes,
      votes_cast = v_vote_count,
      outcome = v_outcome,
      points_awarded = v_points,
      closed_at = now()
  where session_id = p_session_id and assignment_id = v_assignment.id;

  update public.cc_game_session_secret_review_state
  set voting_open = false, updated_at = now()
  where session_id = p_session_id;

  return jsonb_build_object(
    'assignment_id', v_assignment.id,
    'success_votes', v_success_votes,
    'fail_votes', v_fail_votes,
    'votes_cast', v_vote_count,
    'outcome', v_outcome,
    'points_awarded', v_points
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_complete_game_session(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;

  if not found then raise exception 'Game session not found for this host.'; end if;

  update public.cc_game_sessions
  set status = 'completed',
      completed_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
  where id = v_session.id;

  update public.cc_game_session_secret_assignments
  set status = 'cancelled'
  where session_id = v_session.id and status = 'scheduled';

  if v_session.host_game_id is not null then
    update public.host_games
    set status = 'completed'
    where id = v_session.host_game_id and host_id = v_session.host_id;
  end if;

  return pg_catalog.jsonb_build_object('success', true, 'status', 'completed');
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_complete_session_reward_round(p_reward_round_id uuid, p_winner_player_ids uuid[] DEFAULT NULL::uuid[], p_winner_team_ids uuid[] DEFAULT NULL::uuid[], p_points integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_round public.cc_game_session_reward_rounds%rowtype;
  v_host_id uuid;
  v_challenge_title text;
  v_candidate record;
  v_player record;
  v_award_id uuid;
  v_vote_count integer := 0;
  v_new_awards integer := 0;
  v_points_added integer := 0;
  v_winner_name text;
begin
  if auth.uid() is null then raise exception 'Host login required.'; end if;
  select * into v_round from public.cc_game_session_reward_rounds r
  where r.id = p_reward_round_id for update;
  if not found then raise exception 'Reward round not found.'; end if;
  select s.host_id into v_host_id from public.cc_game_sessions s where s.id = v_round.session_id;
  if not public.cc_can_host_session(v_round.session_id) then raise exception 'This reward round belongs to another host.'; end if;
  select c.title into v_challenge_title from public.cc_game_session_challenges c
  where c.id = v_round.challenge_id and c.session_id = v_round.session_id;

  if v_round.status = 'completed' then
    return pg_catalog.jsonb_build_object(
      'success', true, 'already_completed', true, 'reward_round_id', v_round.id,
      'winner_count', (select pg_catalog.count(*) from public.cc_game_session_reward_awards a where a.reward_round_id = v_round.id),
      'points_awarded', (select coalesce(pg_catalog.sum(a.points_awarded), 0) from public.cc_game_session_reward_awards a where a.reward_round_id = v_round.id)
    );
  end if;
  if v_round.status <> 'open' then raise exception 'This reward round is no longer open.'; end if;
  if v_round.reward_method <> 'voting' and p_points is not null then
    v_round.points := greatest(0, least(10000, p_points));
    update public.cc_game_session_reward_rounds set points = v_round.points where id = v_round.id;
  end if;

  if v_round.reward_method = 'voting' then
    for v_candidate in
      with vote_counts as (
        select v.target_player_id, v.target_team_id, pg_catalog.count(*)::integer as votes
        from public.cc_game_session_reward_votes v
        where v.reward_round_id = v_round.id
        group by v.target_player_id, v.target_team_id
      ), top_vote_count as (select pg_catalog.max(votes) as max_votes from vote_counts)
      select vc.target_player_id, vc.target_team_id, vc.votes
      from vote_counts vc cross join top_vote_count top
      where vc.votes = top.max_votes
      order by vc.target_player_id nulls last, vc.target_team_id nulls last
    loop
      v_award_id := null;
      insert into public.cc_game_session_reward_awards (
        reward_round_id, session_id, winner_player_id, winner_team_id, points_awarded, votes_received
      ) values (
        v_round.id, v_round.session_id, v_candidate.target_player_id, v_candidate.target_team_id,
        v_round.points, v_candidate.votes
      ) on conflict do nothing returning id into v_award_id;
      if v_award_id is not null then
        v_new_awards := v_new_awards + 1;
        v_points_added := v_points_added + v_round.points;
        if v_candidate.target_player_id is not null then
          update public.cc_game_session_players p set score = p.score + v_round.points
          where p.id = v_candidate.target_player_id and p.session_id = v_round.session_id;
        else
          update public.cc_game_session_players p set score = p.score + v_round.points
          where p.team_id = v_candidate.target_team_id and p.session_id = v_round.session_id;
        end if;
      end if;
    end loop;
  elsif v_round.target_kind = 'player' then
    if pg_catalog.cardinality(coalesce(p_winner_team_ids, array[]::uuid[])) > 0 then
      raise exception 'This reward round awards individual players, not teams.';
    end if;
    if pg_catalog.cardinality(coalesce(p_winner_player_ids, array[]::uuid[])) = 0 then
      raise exception 'Select at least one winner.';
    end if;
    if exists (
      select 1 from pg_catalog.unnest(coalesce(p_winner_player_ids, array[]::uuid[])) selected(id)
      where not exists (select 1 from public.cc_game_session_players p where p.id = selected.id and p.session_id = v_round.session_id)
    ) then raise exception 'One or more selected players are not in this game.'; end if;

    for v_candidate in
      select distinct selected.id as target_player_id from pg_catalog.unnest(p_winner_player_ids) selected(id)
    loop
      v_award_id := null;
      insert into public.cc_game_session_reward_awards (
        reward_round_id, session_id, winner_player_id, points_awarded, votes_received
      ) values (v_round.id, v_round.session_id, v_candidate.target_player_id, v_round.points, 0)
      on conflict do nothing returning id into v_award_id;
      if v_award_id is not null then
        update public.cc_game_session_players p set score = p.score + v_round.points
        where p.id = v_candidate.target_player_id and p.session_id = v_round.session_id;
        v_new_awards := v_new_awards + 1;
        v_points_added := v_points_added + v_round.points;
      end if;
    end loop;
  else
    if pg_catalog.cardinality(coalesce(p_winner_player_ids, array[]::uuid[])) > 0 then
      raise exception 'This reward round awards teams, not individual players.';
    end if;
    if pg_catalog.cardinality(coalesce(p_winner_team_ids, array[]::uuid[])) = 0 then
      raise exception 'Select at least one winning team.';
    end if;
    if exists (
      select 1 from pg_catalog.unnest(coalesce(p_winner_team_ids, array[]::uuid[])) selected(id)
      where not exists (select 1 from public.cc_game_session_teams t where t.id = selected.id and t.session_id = v_round.session_id)
    ) then raise exception 'One or more selected teams are not in this game.'; end if;

    for v_candidate in
      select distinct selected.id as target_team_id from pg_catalog.unnest(p_winner_team_ids) selected(id)
    loop
      v_award_id := null;
      insert into public.cc_game_session_reward_awards (
        reward_round_id, session_id, winner_team_id, points_awarded, votes_received
      ) values (v_round.id, v_round.session_id, v_candidate.target_team_id, v_round.points, 0)
      on conflict do nothing returning id into v_award_id;
      if v_award_id is not null then
        update public.cc_game_session_players p set score = p.score + v_round.points
        where p.team_id = v_candidate.target_team_id and p.session_id = v_round.session_id;
        v_new_awards := v_new_awards + 1;
        v_points_added := v_points_added + v_round.points;
      end if;
    end loop;
  end if;

  update public.cc_game_session_reward_rounds r
  set status = 'completed', completed_at = pg_catalog.now()
  where r.id = v_round.id;

  select pg_catalog.count(*)::integer into v_vote_count
  from public.cc_game_session_reward_votes v where v.reward_round_id = v_round.id;
  return pg_catalog.jsonb_build_object(
    'success', true,
    'already_completed', false,
    'reward_round_id', v_round.id,
    'challenge_title', v_challenge_title,
    'reward_method', v_round.reward_method,
    'winner_count', v_new_awards,
    'points_awarded', v_points_added,
    'votes_cast', v_vote_count
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_create_game_session(p_host_game_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_host_id uuid := auth.uid();
  v_plan public.host_games%rowtype;
  v_session public.cc_game_sessions%rowtype;
  v_tasks jsonb;
  v_task jsonb;
  v_kind text;
  v_round integer := 0;
  v_sort integer := 0;
  v_main_count integer := 0;
  v_points integer;
  v_minutes integer;
  v_code text;
  v_teams_enabled boolean;
  v_host_chooses_teams boolean;
  v_team_size integer;
  v_player_limit integer;
  v_allow_photo boolean;
begin
  if v_host_id is null then
    raise exception 'Please log in as the host before starting a game.';
  end if;

  select * into v_plan
  from public.host_games
  where id = p_host_game_id and public.cc_can_host_game(id)
  for update;

  if not found then
    raise exception 'That game plan was not found in your account.';
  end if;
  if v_plan.status not in ('planned', 'live') then
    raise exception 'Save this game plan as Planned before playing it.';
  end if;

  -- Idempotency: repeated clicks/resumes return the existing session without duplicating data.
  select * into v_session
  from public.cc_game_sessions
  where host_game_id = v_plan.id and status in ('lobby', 'live')
  order by created_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'id', v_session.id,
      'join_code', v_session.join_code,
      'status', v_session.status,
      'existing', true
    );
  end if;

  v_tasks := coalesce(v_plan.plan_data -> 'selectedTasks', '[]'::jsonb);
  if jsonb_typeof(v_tasks) <> 'array' then
    raise exception 'The saved plan has no usable challenge list. Edit and save the plan again.';
  end if;

  v_teams_enabled := coalesce((v_plan.plan_data ->> 'teamsEnabled')::boolean, true);
  v_host_chooses_teams := coalesce((v_plan.plan_data ->> 'hostChoosesTeams')::boolean, false);
  v_team_size := greatest(2, least(20, coalesce(nullif(v_plan.plan_data ->> 'teamSize', '')::integer, 4)));
  v_player_limit := greatest(2, least(100, coalesce(v_plan.player_count, 12)));

  loop
    v_code := lpad(floor(random() * 1000000)::integer::text, 6, '0');
    exit when not exists (select 1 from public.cc_game_sessions where join_code = v_code);
  end loop;

  insert into public.cc_game_sessions (
    host_game_id, host_id, name, event_date, start_time, end_time,
    venue_name, join_code, status, teams_enabled, host_chooses_teams,
    team_size, player_limit, current_round_number
  ) values (
    v_plan.id, v_plan.host_id, v_plan.name, v_plan.event_date, v_plan.start_time,
    v_plan.end_time, v_plan.venue_name, v_code, 'lobby',
    v_teams_enabled, v_host_chooses_teams, v_team_size, v_player_limit, 0
  ) returning * into v_session;

  for v_task in select value from jsonb_array_elements(v_tasks)
  loop
    v_kind := coalesce(v_task ->> 'kind', 'main');
    if v_kind not in ('main', 'side', 'secret') then
      v_kind := 'main';
    end if;
    if nullif(trim(coalesce(v_task ->> 'title', '')), '') is null then
      continue;
    end if;

    if v_kind = 'side' and not coalesce((v_plan.plan_data ->> 'sideChallenges')::boolean, true) then
      continue;
    end if;
    if v_kind = 'secret' then
      if not (
        coalesce((v_plan.plan_data ->> 'secretMissions')::boolean, false)
        or coalesce((v_plan.plan_data ->> 'sabotage')::boolean, false)
      ) then
        continue;
      end if;
      if v_task ->> 'id' = 'task-sabotage'
        and not coalesce((v_plan.plan_data ->> 'sabotage')::boolean, false) then
        continue;
      end if;
      if v_task ->> 'id' = 'task-secret-mission'
        and not coalesce((v_plan.plan_data ->> 'secretMissions')::boolean, false) then
        continue;
      end if;
    end if;

    v_points := case when coalesce(v_task ->> 'points', '') ~ '^-?[0-9]+$'
      then greatest(0, (v_task ->> 'points')::integer) else 10 end;
    v_minutes := case when coalesce(v_task ->> 'minutes', '') ~ '^[0-9]+$'
      then greatest(1, (v_task ->> 'minutes')::integer) else 10 end;
    v_sort := v_sort + 1;
    v_allow_photo := coalesce((v_plan.plan_data ->> 'evidenceRequired')::boolean, false);

    if v_kind = 'main' then
      v_round := v_round + 1;
      insert into public.cc_game_session_challenges (
        session_id, kind, round_number, title, description, points,
        duration_minutes, sort_order, allow_photo_upload
      ) values (
        v_session.id, 'main', v_round,
        trim(v_task ->> 'title'), coalesce(v_task ->> 'description', ''),
        v_points, v_minutes, v_round, v_allow_photo
      );
    else
      insert into public.cc_game_session_challenges (
        session_id, kind, round_number, title, description, points,
        duration_minutes, sort_order, allow_photo_upload
      ) values (
        v_session.id, v_kind, null,
        trim(v_task ->> 'title'), coalesce(v_task ->> 'description', ''),
        v_points, v_minutes, v_sort, v_allow_photo
      );
    end if;
  end loop;

  if v_round = 0 then
    raise exception 'Add at least one main challenge to the plan before playing.';
  end if;

  return jsonb_build_object(
    'id', v_session.id,
    'join_code', v_session.join_code,
    'status', v_session.status,
    'existing', false,
    'round_count', v_round
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_dispatch_due_secret_missions(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_count integer := 0;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id);

  if not found then raise exception 'Game session not found for this host.'; end if;

  if v_session.status = 'live' then
    update public.cc_game_session_secret_assignments
    set status = 'sent',
        sent_at = coalesce(sent_at, pg_catalog.now())
    where session_id = v_session.id
      and status = 'scheduled'
      and scheduled_at <= pg_catalog.now();

    get diagnostics v_count = row_count;
  end if;

  return pg_catalog.jsonb_build_object('sent_count', v_count);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_manage_session_final_round(p_session_id uuid, p_gallery_open boolean, p_voting_open boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_id uuid;
  v_challenge_status text;
  v_points integer;
  v_vote_count integer := 0;
  v_has_pending boolean := false;
  v_top_vote_count integer;
  v_winner record;
  v_result_completed_at timestamptz;
begin
  if p_voting_open and not p_gallery_open then
    raise exception 'Voting cannot open while the final gallery is hidden';
  end if;

  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
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

  if p_voting_open then
    insert into public.cc_game_session_final_round_challenges (session_id, challenge_id)
    select c.session_id, c.id
    from public.cc_game_session_challenges c
    where c.session_id = p_session_id and c.kind = 'side'
    on conflict (session_id, challenge_id) do nothing;

    if v_state.voting_open then
      select status into v_challenge_status
      from public.cc_game_session_final_round_challenges
      where session_id = p_session_id and challenge_id = v_state.slideshow_challenge_id;
      if v_challenge_status = 'voting' then
        update public.cc_game_sessions
        set final_gallery_open = true, final_voting_open = true
        where id = p_session_id;
        return jsonb_build_object(
          'final_gallery_open', true,
          'final_voting_open', true,
          'challenge_id', v_state.slideshow_challenge_id
        );
      end if;
      raise exception 'The current challenge is not ready for voting';
    end if;

    if v_state.is_open and v_state.slideshow_challenge_id is not null then
      select status into v_challenge_status
      from public.cc_game_session_final_round_challenges
      where session_id = p_session_id and challenge_id = v_state.slideshow_challenge_id;
      if v_challenge_status = 'results' then
        raise exception 'Use Next challenge to continue the final round';
      end if;
    end if;

    select state.challenge_id into v_challenge_id
    from public.cc_game_session_final_round_challenges state
    join public.cc_game_session_challenges c on c.id = state.challenge_id
    where state.session_id = p_session_id
      and state.status = 'pending'
      and state.challenge_id = v_state.slideshow_challenge_id
      and c.kind = 'side';

    if v_challenge_id is null then
      select state.challenge_id into v_challenge_id
      from public.cc_game_session_final_round_challenges state
      join public.cc_game_session_challenges c on c.id = state.challenge_id
      where state.session_id = p_session_id
        and state.status = 'pending'
        and c.kind = 'side'
      order by c.sort_order, c.id
      limit 1;
    end if;

    if v_challenge_id is null then
      raise exception 'There are no side challenges left to review';
    end if;

    update public.cc_game_session_final_round_challenges
    set status = 'voting', votes_cast = 0, opened_at = now(), closed_at = null
    where session_id = p_session_id and challenge_id = v_challenge_id;

    update public.cc_game_session_final_round_state
    set is_open = true,
        voting_open = true,
        slideshow_challenge_id = v_challenge_id,
        slideshow_evidence_id = (
          select e.id
          from public.cc_game_session_evidence e
          join public.cc_game_session_submissions sub
            on sub.session_id = e.session_id
            and sub.player_id = e.player_id
            and sub.challenge_id = e.challenge_id
          where e.session_id = p_session_id
            and e.challenge_id = v_challenge_id
            and e.secret_assignment_id is null
            and sub.status in ('submitted', 'approved')
          order by e.created_at, e.id
          limit 1
        ),
        opened_at = coalesce(opened_at, now()),
        closed_at = null,
        updated_at = now()
    where session_id = p_session_id;

    update public.cc_game_sessions
    set final_gallery_open = true, final_voting_open = true
    where id = p_session_id;

    return jsonb_build_object(
      'final_gallery_open', true,
      'final_voting_open', true,
      'challenge_id', v_challenge_id
    );
  end if;

  if not p_gallery_open then
    if v_state.voting_open then
      raise exception 'Close voting before hiding the final gallery';
    end if;
    update public.cc_game_session_final_round_state
    set is_open = false, updated_at = now()
    where session_id = p_session_id;
    update public.cc_game_sessions
    set final_gallery_open = false, final_voting_open = false
    where id = p_session_id;
    return jsonb_build_object(
      'final_gallery_open', false,
      'final_voting_open', false,
      'final_vote_completed_at', v_session.final_vote_completed_at
    );
  end if;

  v_challenge_id := v_state.slideshow_challenge_id;
  if v_challenge_id is null then
    raise exception 'Open a side-challenge vote before showing results';
  end if;

  select status into v_challenge_status
  from public.cc_game_session_final_round_challenges
  where session_id = p_session_id and challenge_id = v_challenge_id
  for update;

  if v_challenge_status = 'voting' then
    select c.points into v_points
    from public.cc_game_session_challenges c
    where c.id = v_challenge_id and c.session_id = p_session_id and c.kind = 'side';

    select count(*)::integer into v_vote_count
    from public.cc_game_session_final_round_votes v
    join public.cc_game_session_evidence e
      on e.id = v.evidence_id and e.session_id = v.session_id
    join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id
      and sub.player_id = e.player_id
      and sub.challenge_id = e.challenge_id
    where v.session_id = p_session_id
      and v.challenge_id = v_challenge_id
      and e.challenge_id = v_challenge_id
      and e.secret_assignment_id is null
      and sub.status in ('submitted', 'approved');

    if v_vote_count > 0 then
      for v_winner in
        with evidence_votes as (
          select e.id, e.player_id, count(v.player_id)::integer as vote_count
          from public.cc_game_session_evidence e
          join public.cc_game_session_submissions sub
            on sub.session_id = e.session_id
            and sub.player_id = e.player_id
            and sub.challenge_id = e.challenge_id
          left join public.cc_game_session_final_round_votes v
            on v.session_id = e.session_id
            and v.challenge_id = e.challenge_id
            and v.evidence_id = e.id
          where e.session_id = p_session_id
            and e.challenge_id = v_challenge_id
            and e.secret_assignment_id is null
            and sub.status in ('submitted', 'approved')
          group by e.id, e.player_id
        ),
        top_vote_count as (
          select max(vote_count) as vote_count from evidence_votes
        )
        select evidence_votes.player_id, max(evidence_votes.vote_count)::integer as vote_count
        from evidence_votes
        cross join top_vote_count
        where evidence_votes.vote_count = top_vote_count.vote_count
          and top_vote_count.vote_count > 0
        group by evidence_votes.player_id
      loop
        insert into public.cc_game_session_final_round_awards (
          session_id, challenge_id, player_id, points_awarded, votes_received
        ) values (
          p_session_id, v_challenge_id, v_winner.player_id, coalesce(v_points, 0), v_winner.vote_count
        )
        on conflict (session_id, challenge_id, player_id) do nothing;

        if found and coalesce(v_points, 0) > 0 then
          update public.cc_game_session_players
          set score = score + v_points
          where id = v_winner.player_id and session_id = p_session_id;
        end if;
      end loop;
    end if;

    update public.cc_game_session_final_round_challenges
    set status = 'results', votes_cast = v_vote_count, closed_at = now()
    where session_id = p_session_id and challenge_id = v_challenge_id;
  elsif v_challenge_status is distinct from 'results' then
    raise exception 'The current challenge is not open for voting';
  end if;

  select exists (
    select 1
    from public.cc_game_session_final_round_challenges
    where session_id = p_session_id and status = 'pending'
  ) into v_has_pending;

  update public.cc_game_sessions
  set final_gallery_open = true,
      final_voting_open = false,
      final_vote_completed_at = case when v_has_pending then null else coalesce(final_vote_completed_at, now()) end,
      final_vote_winner_player_id = null,
      final_vote_winner_evidence_id = null,
      final_vote_winner_points = 0,
      final_vote_winner_vote_count = 0
  where id = p_session_id
  returning final_vote_completed_at into v_result_completed_at;

  update public.cc_game_session_final_round_state
  set is_open = true, voting_open = false, closed_at = now(), updated_at = now()
  where session_id = p_session_id;

  return jsonb_build_object(
    'final_gallery_open', true,
    'final_voting_open', false,
    'challenge_id', v_challenge_id,
    'votes_cast', v_vote_count,
    'voting_completed', true,
    'sequence_completed', v_result_completed_at is not null
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_open_secret_review(p_session_id uuid, p_assignment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_secret_review_state%rowtype;
  v_assignment_status text;
  v_first_evidence_id uuid;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  insert into public.cc_game_session_secret_review_state (session_id)
  values (p_session_id)
  on conflict (session_id) do nothing;

  select * into v_state
  from public.cc_game_session_secret_review_state
  where session_id = p_session_id
  for update;
  if v_state.voting_open then
    raise exception 'A secret mission vote is already open';
  end if;

  insert into public.cc_game_session_secret_review_assignments (session_id, assignment_id)
  select a.session_id, a.id
  from public.cc_game_session_secret_assignments a
  where a.session_id = p_session_id and a.status = 'submitted'
  on conflict (session_id, assignment_id) do nothing;

  select review.status into v_assignment_status
  from public.cc_game_session_secret_review_assignments review
  join public.cc_game_session_secret_assignments assignment
    on assignment.id = review.assignment_id and assignment.session_id = review.session_id
  where review.session_id = p_session_id
    and review.assignment_id = p_assignment_id
    and assignment.status = 'submitted'
  for update of review;

  if v_assignment_status is distinct from 'pending' then
    raise exception 'Choose a submitted secret mission that has not been reviewed';
  end if;

  select e.id into v_first_evidence_id
  from public.cc_game_session_evidence e
  where e.session_id = p_session_id and e.secret_assignment_id = p_assignment_id
  order by e.created_at, e.id
  limit 1;

  update public.cc_game_session_secret_review_assignments
  set status = 'voting', success_votes = 0, fail_votes = 0, votes_cast = 0,
      outcome = null, points_awarded = 0, opened_at = now(), closed_at = null
  where session_id = p_session_id and assignment_id = p_assignment_id;

  update public.cc_game_session_secret_review_state
  set is_open = true, voting_open = true,
      current_assignment_id = p_assignment_id,
      current_evidence_id = v_first_evidence_id,
      updated_at = now()
  where session_id = p_session_id;

  return jsonb_build_object('assignment_id', p_assignment_id, 'voting_open', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_release_session_reward_round(p_reward_round_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_round public.cc_game_session_reward_rounds%rowtype;
begin
  if auth.uid() is null then raise exception 'Host login required.'; end if;
  select r.* into v_round from public.cc_game_session_reward_rounds r
  join public.cc_game_sessions s on s.id = r.session_id
  where r.id = p_reward_round_id and public.cc_can_host_session(s.id) for update of r;
  if not found then raise exception 'Reward round not found for this host.'; end if;
  if v_round.status <> 'completed' then raise exception 'Complete the reward round before returning to the game.'; end if;
  update public.cc_game_session_reward_rounds set released_at = pg_catalog.now()
  where id = v_round.id and released_at is null;
  return pg_catalog.jsonb_build_object('success', true, 'released', true);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_reopen_secret_review(p_session_id uuid, p_assignment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_secret_review_state%rowtype;
  v_review public.cc_game_session_secret_review_assignments%rowtype;
  v_first_evidence_id uuid;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  select * into v_state
  from public.cc_game_session_secret_review_state
  where session_id = p_session_id
  for update;
  if not found or v_state.voting_open then
    raise exception 'Close the current secret mission vote before reopening another';
  end if;

  select * into v_review
  from public.cc_game_session_secret_review_assignments
  where session_id = p_session_id and assignment_id = p_assignment_id
  for update;
  if not found or v_review.status <> 'results' then
    raise exception 'Only a reviewed secret mission can be reopened';
  end if;

  update public.cc_game_session_players p
  set score = greatest(0, p.score - v_review.points_awarded)
  from public.cc_game_session_secret_assignments a
  where a.id = p_assignment_id
    and a.session_id = p_session_id
    and p.id = a.player_id
    and v_review.points_awarded > 0;

  update public.cc_game_session_secret_assignments
  set status = 'submitted', awarded_points = 0, reviewed_at = null, final_review_outcome = null
  where id = p_assignment_id and session_id = p_session_id;

  delete from public.cc_game_session_secret_review_votes
  where session_id = p_session_id and assignment_id = p_assignment_id;

  select e.id into v_first_evidence_id
  from public.cc_game_session_evidence e
  where e.session_id = p_session_id and e.secret_assignment_id = p_assignment_id
  order by e.created_at, e.id
  limit 1;

  update public.cc_game_session_secret_review_assignments
  set status = 'voting', success_votes = 0, fail_votes = 0, votes_cast = 0,
      outcome = null, points_awarded = 0, opened_at = now(), closed_at = null
  where session_id = p_session_id and assignment_id = p_assignment_id;

  update public.cc_game_session_secret_review_state
  set is_open = true, voting_open = true,
      current_assignment_id = p_assignment_id,
      current_evidence_id = v_first_evidence_id,
      updated_at = now()
  where session_id = p_session_id;

  return jsonb_build_object('assignment_id', p_assignment_id, 'voting_open', true, 'votes_cast', 0);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_reopen_session_final_round_challenge(p_session_id uuid, p_challenge_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_round_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_status text;
  v_first_evidence_id uuid;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
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
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_review_secret_mission(p_assignment_id uuid, p_approve boolean, p_points integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_assignment public.cc_game_session_secret_assignments%rowtype;
  v_points integer := case when p_approve then greatest(0, least(10000, coalesce(p_points, 0))) else 0 end;
begin
  select a.* into v_assignment
  from public.cc_game_session_secret_assignments a
  join public.cc_game_sessions s on s.id = a.session_id
  where a.id = p_assignment_id and public.cc_can_host_session(s.id)
  for update of a;

  if not found then raise exception 'Secret mission not found for this host.'; end if;
  if v_assignment.status <> 'submitted' then
    raise exception 'Only submitted secret missions can be reviewed.';
  end if;

  update public.cc_game_session_players
  set score = greatest(0, score + v_points)
  where id = v_assignment.player_id and session_id = v_assignment.session_id;

  update public.cc_game_session_secret_assignments
  set status = case when p_approve then 'approved' else 'rejected' end,
      awarded_points = v_points,
      reviewed_at = pg_catalog.now()
  where id = v_assignment.id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'status', case when p_approve then 'approved' else 'rejected' end,
    'awarded_points', v_points
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_review_session_submission(p_submission_id uuid, p_approve boolean, p_points integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_sub public.cc_game_session_submissions%rowtype;
  v_kind text;
  v_points integer := 0;
  v_old_points integer := 0;
begin
  select sub.* into v_sub
  from public.cc_game_session_submissions sub
  join public.cc_game_sessions s on s.id = sub.session_id
  where sub.id = p_submission_id and public.cc_can_host_session(s.id)
  for update of sub;
  if not found then raise exception 'Submission not found for this host.'; end if;

  select c.kind into v_kind
  from public.cc_game_session_challenges c
  where c.id = v_sub.challenge_id and c.session_id = v_sub.session_id;
  if v_kind is null then raise exception 'Challenge not found for this submission.'; end if;

  if p_approve and v_kind <> 'side' then
    v_points := greatest(0, least(10000, coalesce(p_points, 0)));
  else
    v_points := 0;
  end if;

  if v_sub.status = 'approved' then
    v_old_points := coalesce(v_sub.awarded_points, 0);
  end if;

  update public.cc_game_session_players p
    set score = greatest(0, p.score - v_old_points + v_points)
    where p.id = v_sub.player_id and p.session_id = v_sub.session_id;

  update public.cc_game_session_submissions
    set status = case when p_approve then 'approved' else 'rejected' end,
        awarded_points = v_points,
        reviewed_at = pg_catalog.now(),
        reviewed_by = auth.uid()
    where id = v_sub.id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'status', case when p_approve then 'approved' else 'rejected' end,
    'awarded_points', v_points,
    'points_pending_final_vote', (p_approve and v_kind = 'side')
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_select_secret_review_assignment(p_session_id uuid, p_assignment_id uuid, p_evidence_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_secret_review_state%rowtype;
  v_assignment_status text;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  insert into public.cc_game_session_secret_review_state (session_id)
  values (p_session_id)
  on conflict (session_id) do nothing;

  select * into v_state
  from public.cc_game_session_secret_review_state
  where session_id = p_session_id
  for update;

  if v_state.voting_open then
    raise exception 'Close the current vote before changing secret missions';
  end if;

  insert into public.cc_game_session_secret_review_assignments (session_id, assignment_id)
  select a.session_id, a.id
  from public.cc_game_session_secret_assignments a
  where a.session_id = p_session_id and a.status = 'submitted'
  on conflict (session_id, assignment_id) do nothing;

  select review.status into v_assignment_status
  from public.cc_game_session_secret_review_assignments review
  join public.cc_game_session_secret_assignments assignment
    on assignment.id = review.assignment_id and assignment.session_id = review.session_id
  where review.session_id = p_session_id
    and review.assignment_id = p_assignment_id
    and (assignment.status = 'submitted' or review.status = 'results')
  for update of review;

  if v_assignment_status is null or v_assignment_status not in ('pending', 'results') then
    raise exception 'Choose a submitted or reviewed secret mission';
  end if;

  if p_evidence_id is not null and not exists (
    select 1 from public.cc_game_session_evidence e
    where e.id = p_evidence_id
      and e.session_id = p_session_id
      and e.secret_assignment_id = p_assignment_id
  ) then
    raise exception 'Choose evidence from this secret mission';
  end if;

  update public.cc_game_session_secret_review_state
  set current_assignment_id = p_assignment_id,
      current_evidence_id = p_evidence_id,
      updated_at = now()
  where session_id = p_session_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_select_session_final_round_challenge(p_session_id uuid, p_challenge_id uuid, p_evidence_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_status text;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
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
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_set_game_session_round(p_session_id uuid, p_round_number integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_round_count integer;
begin
  select * into v_session from public.cc_game_sessions
    where id=p_session_id and public.cc_can_host_session(id)
    for update;
  if not found then raise exception 'Game session not found for this host.'; end if;
  if v_session.status <> 'live' then raise exception 'Start the game before changing rounds.'; end if;
  select count(*)::integer into v_round_count from public.cc_game_session_challenges
    where session_id=v_session.id and kind='main';
  if p_round_number < 1 or p_round_number > v_round_count then raise exception 'That round does not exist.'; end if;
  update public.cc_game_sessions set current_round_number=p_round_number,updated_at=now() where id=v_session.id;
  return jsonb_build_object('success',true,'current_round_number',p_round_number,'round_count',v_round_count);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_set_secret_review_evidence(p_session_id uuid, p_evidence_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_secret_review_state%rowtype;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  select * into v_state
  from public.cc_game_session_secret_review_state
  where session_id = p_session_id
  for update;
  if not found or not v_state.is_open or v_state.current_assignment_id is null then
    raise exception 'There is no secret mission slideshow to update';
  end if;

  if p_evidence_id is not null and not exists (
    select 1 from public.cc_game_session_evidence e
    where e.id = p_evidence_id
      and e.session_id = p_session_id
      and e.secret_assignment_id = v_state.current_assignment_id
  ) then
    raise exception 'Choose evidence from the current secret mission';
  end if;

  update public.cc_game_session_secret_review_state
  set current_evidence_id = p_evidence_id, updated_at = now()
  where session_id = p_session_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_set_session_final_gallery(p_session_id uuid, p_gallery_open boolean, p_voting_open boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_gallery_open boolean := coalesce(p_gallery_open, false);
  v_voting_open boolean := coalesce(p_gallery_open, false) and coalesce(p_voting_open, false);
  v_winner_evidence_id uuid := null;
  v_winner_player_id uuid := null;
  v_winner_challenge_id uuid := null;
  v_winner_kind text := null;
  v_winner_points integer := 0;
  v_winner_vote_count integer := 0;
begin
  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id)
  for update;
  if not found then raise exception 'Game session not found for this host.'; end if;

  if v_session.final_vote_completed_at is not null then
    if v_voting_open then
      raise exception 'Final voting has already been completed and cannot be reopened.';
    end if;
    update public.cc_game_sessions
      set final_gallery_open = v_gallery_open,
          final_voting_open = false,
          updated_at = pg_catalog.now()
      where id = v_session.id
      returning * into v_session;
  elsif v_session.final_voting_open and not v_voting_open then
    -- Find the most-voted eligible evidence. This is the same population players
    -- can vote for: approved side-challenge entries and approved secret missions
    -- that the host marked Saved for final.
    select e.id, e.player_id, c.id, c.kind,
           greatest(0, least(10000, coalesce(c.points, 0))),
           count(v.id)::integer
      into v_winner_evidence_id, v_winner_player_id, v_winner_challenge_id,
           v_winner_kind, v_winner_points, v_winner_vote_count
    from public.cc_game_session_evidence e
    join public.cc_game_session_challenges c
      on c.id = e.challenge_id and c.session_id = e.session_id
    left join public.cc_game_session_final_votes v
      on v.session_id = e.session_id and v.evidence_id = e.id
    where e.session_id = v_session.id
      and e.saved_for_final = true
      and (
        (e.secret_assignment_id is null and c.kind = 'side' and exists (
          select 1 from public.cc_game_session_submissions sub
          where sub.session_id = e.session_id and sub.player_id = e.player_id
            and sub.challenge_id = e.challenge_id and sub.status = 'approved'
        ))
        or
        (e.secret_assignment_id is not null and exists (
          select 1 from public.cc_game_session_secret_assignments a
          where a.id = e.secret_assignment_id and a.session_id = e.session_id
            and a.player_id = e.player_id and a.status = 'approved'
        ))
      )
    group by e.id, e.player_id, c.id, c.kind, c.points, e.created_at
    having count(v.id) > 0
    order by count(v.id) desc, e.created_at asc, e.id asc
    limit 1;

    -- Reconcile any side-challenge points awarded under the old review behaviour.
    -- Side submissions now hold zero points until the final vote winner is known.
    update public.cc_game_session_players p
      set score = greatest(0, p.score - old_points.points)
    from (
      select sub.session_id, sub.player_id, sum(sub.awarded_points)::integer as points
      from public.cc_game_session_submissions sub
      join public.cc_game_session_challenges c
        on c.id = sub.challenge_id and c.session_id = sub.session_id
      where sub.session_id = v_session.id and c.kind = 'side' and sub.awarded_points > 0
      group by sub.session_id, sub.player_id
    ) old_points
    where p.session_id = old_points.session_id and p.id = old_points.player_id;

    update public.cc_game_session_submissions sub
      set awarded_points = 0
    from public.cc_game_session_challenges c
    where sub.session_id = v_session.id
      and c.id = sub.challenge_id and c.session_id = sub.session_id
      and c.kind = 'side' and sub.awarded_points <> 0;

    if v_winner_evidence_id is not null then
      v_winner_points := coalesce(v_winner_points, 0);
      v_winner_vote_count := coalesce(v_winner_vote_count, 0);

      update public.cc_game_session_players p
        set score = p.score + v_winner_points
        where p.session_id = v_session.id and p.id = v_winner_player_id;

      -- Reflect the side-challenge winner's points in the submission as well as
      -- the score, so the host and player screens display the same award.
      if v_winner_kind = 'side' then
        update public.cc_game_session_submissions sub
          set awarded_points = v_winner_points
          where sub.session_id = v_session.id
            and sub.player_id = v_winner_player_id
            and sub.challenge_id = v_winner_challenge_id
            and sub.status = 'approved';
      end if;
    else
      v_winner_points := 0;
      v_winner_vote_count := 0;
    end if;

    update public.cc_game_sessions
      set final_gallery_open = v_gallery_open,
          final_voting_open = false,
          final_vote_completed_at = pg_catalog.now(),
          final_vote_winner_player_id = v_winner_player_id,
          final_vote_winner_evidence_id = v_winner_evidence_id,
          final_vote_winner_points = coalesce(v_winner_points, 0),
          final_vote_winner_vote_count = coalesce(v_winner_vote_count, 0),
          updated_at = pg_catalog.now()
      where id = v_session.id
      returning * into v_session;
  else
    update public.cc_game_sessions
      set final_gallery_open = v_gallery_open,
          final_voting_open = v_voting_open,
          updated_at = pg_catalog.now()
      where id = v_session.id
      returning * into v_session;
  end if;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'final_gallery_open', v_session.final_gallery_open,
    'final_voting_open', v_session.final_voting_open,
    'final_vote_completed_at', v_session.final_vote_completed_at,
    'final_vote_winner_player_id', v_session.final_vote_winner_player_id,
    'final_vote_winner_evidence_id', v_session.final_vote_winner_evidence_id,
    'final_vote_winner_points', v_session.final_vote_winner_points,
    'final_vote_winner_vote_count', v_session.final_vote_winner_vote_count
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_set_session_final_slideshow(p_session_id uuid, p_challenge_id uuid, p_evidence_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_status text;
begin
  if not exists (
    select 1 from public.cc_game_sessions s
    where s.id = p_session_id and public.cc_can_host_session(s.id)
  ) then
    raise exception 'Game session not found or host access denied';
  end if;

  if not exists (
    select 1 from public.cc_game_session_challenges c
    where c.id = p_challenge_id and c.session_id = p_session_id and c.kind = 'side'
  ) then
    raise exception 'Choose a side challenge from this game';
  end if;

  insert into public.cc_game_session_final_round_state (session_id)
  values (p_session_id)
  on conflict (session_id) do nothing;

  select * into v_state
  from public.cc_game_session_final_round_state
  where session_id = p_session_id
  for update;

  select status into v_challenge_status
  from public.cc_game_session_final_round_challenges
  where session_id = p_session_id and challenge_id = p_challenge_id;
  if v_challenge_status is null then
    raise exception 'This side challenge is not part of the final round';
  end if;

  if v_state.is_open and v_state.slideshow_challenge_id is distinct from p_challenge_id then
    raise exception 'The slideshow must stay on the current challenge';
  end if;

  if not v_state.is_open and v_challenge_status <> 'pending' then
    raise exception 'Use Next challenge to select the next side challenge';
  end if;

  if p_evidence_id is not null and not exists (
    select 1
    from public.cc_game_session_evidence e
    join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id and sub.player_id = e.player_id and sub.challenge_id = e.challenge_id
    where e.id = p_evidence_id
      and e.session_id = p_session_id
      and e.challenge_id = p_challenge_id
      and e.secret_assignment_id is null
      and sub.status in ('submitted', 'approved')
  ) then
    raise exception 'Choose a submitted photo or video for this side challenge';
  end if;

  update public.cc_game_session_final_round_state
  set slideshow_challenge_id = p_challenge_id,
      slideshow_evidence_id = p_evidence_id,
      updated_at = now()
  where session_id = p_session_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_start_game_session(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_round_count integer;
begin
  select * into v_session from public.cc_game_sessions
    where id=p_session_id and public.cc_can_host_session(id)
    for update;
  if not found then raise exception 'Game session not found for this host.'; end if;
  if v_session.status='completed' then raise exception 'This game has already finished.'; end if;
  select count(*)::integer into v_round_count from public.cc_game_session_challenges
    where session_id=v_session.id and kind='main';
  if v_round_count=0 then raise exception 'This game has no main challenges.'; end if;

  if v_session.status='lobby' then
    update public.cc_game_sessions set status='live',current_round_number=1,started_at=now(),updated_at=now()
      where id=v_session.id;
    if v_session.host_game_id is not null then
      update public.host_games set status='live' where id=v_session.host_game_id and host_id=v_session.host_id;
    end if;
  end if;
  return jsonb_build_object('success',true,'status','live','current_round_number',1);
end;
$function$;

CREATE OR REPLACE FUNCTION public.cc_host_start_session_reward_round(p_session_id uuid, p_challenge_id uuid, p_reward_method text, p_target_kind text DEFAULT 'player'::text, p_points integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session public.cc_game_sessions%rowtype;
  v_challenge public.cc_game_session_challenges%rowtype;
  v_round public.cc_game_session_reward_rounds%rowtype;
  v_points integer;
begin
  if auth.uid() is null then raise exception 'Host login required.'; end if;

  select * into v_session from public.cc_game_sessions
  where id = p_session_id and public.cc_can_host_session(id) for update;
  if not found then raise exception 'Game session not found for this host.'; end if;
  if v_session.status <> 'live' then raise exception 'Start the game before rewarding points.'; end if;
  if p_reward_method not in ('voting', 'host_awards', 'audience_cheers')
    or not (p_reward_method = any(v_session.reward_methods)) then
    raise exception 'That reward method is not enabled in game setup.';
  end if;
  if p_target_kind not in ('player', 'team') then raise exception 'Choose players or teams as reward targets.'; end if;
  if p_target_kind = 'team' then
    if not v_session.teams_enabled then raise exception 'This game is configured for individual play.'; end if;
    if not exists (select 1 from public.cc_game_session_teams t where t.session_id = v_session.id) then
      raise exception 'Create or assign teams before rewarding a team.';
    end if;
  end if;

  select * into v_challenge from public.cc_game_session_challenges c
  where c.id = p_challenge_id and c.session_id = v_session.id;
  if not found then raise exception 'Choose a challenge from this game.'; end if;
  if exists (
    select 1 from public.cc_game_session_reward_rounds r
    where r.session_id = v_session.id and r.released_at is null and r.status in ('open', 'completed')
  ) then raise exception 'Finish the current reward round and return everyone to the game first.'; end if;

  v_points := greatest(0, least(10000, coalesce(p_points, v_challenge.points)));
  insert into public.cc_game_session_reward_rounds (
    session_id, challenge_id, reward_method, target_kind, points, status, created_by
  ) values (
    v_session.id, v_challenge.id, p_reward_method, p_target_kind, v_points, 'open', auth.uid()
  ) returning * into v_round;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'id', v_round.id,
    'reward_method', v_round.reward_method,
    'target_kind', v_round.target_kind,
    'points', v_round.points,
    'status', v_round.status,
    'challenge_title', v_challenge.title
  );
end;
$function$;
