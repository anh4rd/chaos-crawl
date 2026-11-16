create table if not exists public.cc_game_session_final_round_state (
  session_id uuid primary key references public.cc_game_sessions(id) on delete cascade,
  is_open boolean not null default false,
  voting_open boolean not null default false,
  slideshow_challenge_id uuid,
  slideshow_evidence_id uuid,
  opened_at timestamptz,
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_game_session_final_round_votes (
  session_id uuid not null references public.cc_game_sessions(id) on delete cascade,
  player_id uuid not null references public.cc_game_session_players(id) on delete cascade,
  evidence_id uuid not null,
  voted_at timestamptz not null default now(),
  primary key (session_id, player_id)
);

create index if not exists cc_game_session_final_round_votes_evidence_idx
  on public.cc_game_session_final_round_votes (session_id, evidence_id);

alter table public.cc_game_session_final_round_state enable row level security;
alter table public.cc_game_session_final_round_votes enable row level security;
grant select on public.cc_game_session_final_round_state to authenticated;
grant select on public.cc_game_session_final_round_votes to authenticated;

drop policy if exists "Hosts can read final round state" on public.cc_game_session_final_round_state;
create policy "Hosts can read final round state"
  on public.cc_game_session_final_round_state for select to authenticated
  using (exists (
    select 1 from public.cc_game_sessions s
    where s.id = session_id and s.host_id = auth.uid()
  ));

drop policy if exists "Hosts can read final round votes" on public.cc_game_session_final_round_votes;
create policy "Hosts can read final round votes"
  on public.cc_game_session_final_round_votes for select to authenticated
  using (exists (
    select 1 from public.cc_game_sessions s
    where s.id = session_id and s.host_id = auth.uid()
  ));

create or replace function public.cc_host_manage_session_final_round(
  p_session_id uuid,
  p_gallery_open boolean,
  p_voting_open boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_final_round_state%rowtype;
  v_winner_player_id uuid;
  v_winner_evidence_id uuid;
  v_winner_points integer;
  v_winner_vote_count integer;
  v_vote_count integer := 0;
begin
  if p_voting_open and not p_gallery_open then
    raise exception 'Voting cannot open while the final gallery is hidden';
  end if;

  select * into v_session
  from public.cc_game_sessions
  where id = p_session_id and host_id = auth.uid()
  for update;

  if not found then
    raise exception 'Game session not found or host access denied';
  end if;

  select * into v_state
  from public.cc_game_session_final_round_state
  where session_id = p_session_id
  for update;

  if p_voting_open and v_session.final_vote_completed_at is not null then
    raise exception 'Final voting has already been completed';
  end if;

  if coalesce(v_state.voting_open, false) and not p_voting_open then
    select count(*) into v_vote_count
    from public.cc_game_session_final_round_votes v
    join public.cc_game_session_evidence e on e.id = v.evidence_id and e.session_id = v.session_id
    join public.cc_game_session_challenges c on c.id = e.challenge_id and c.session_id = e.session_id
    left join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id and sub.player_id = e.player_id and sub.challenge_id = e.challenge_id
    left join public.cc_game_session_secret_assignments sa
      on sa.id = e.secret_assignment_id and sa.session_id = e.session_id
    where v.session_id = p_session_id
      and (
        (e.secret_assignment_id is null and c.kind = 'side' and sub.status in ('submitted', 'approved'))
        or (e.secret_assignment_id is not null and c.kind = 'secret' and sa.status = 'approved' and e.saved_for_final)
      );

    select e.player_id, e.id, c.points, count(*)::integer
    into v_winner_player_id, v_winner_evidence_id, v_winner_points, v_winner_vote_count
    from public.cc_game_session_final_round_votes v
    join public.cc_game_session_evidence e on e.id = v.evidence_id and e.session_id = v.session_id
    join public.cc_game_session_challenges c on c.id = e.challenge_id and c.session_id = e.session_id
    left join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id and sub.player_id = e.player_id and sub.challenge_id = e.challenge_id
    left join public.cc_game_session_secret_assignments sa
      on sa.id = e.secret_assignment_id and sa.session_id = e.session_id
    where v.session_id = p_session_id
      and (
        (e.secret_assignment_id is null and c.kind = 'side' and sub.status in ('submitted', 'approved'))
        or (e.secret_assignment_id is not null and c.kind = 'secret' and sa.status = 'approved' and e.saved_for_final)
      )
    group by e.player_id, e.id, e.created_at, c.points
    order by count(*) desc, e.created_at asc, e.id asc
    limit 1;

    if v_winner_player_id is not null and v_winner_points > 0 then
      update public.cc_game_session_players
      set score = score + v_winner_points
      where id = v_winner_player_id and session_id = p_session_id;
    end if;

    update public.cc_game_sessions
    set final_gallery_open = p_gallery_open,
        final_voting_open = false,
        final_vote_completed_at = now(),
        final_vote_winner_player_id = v_winner_player_id,
        final_vote_winner_evidence_id = v_winner_evidence_id,
        final_vote_winner_points = case when v_winner_player_id is null then 0 else coalesce(v_winner_points, 0) end,
        final_vote_winner_vote_count = coalesce(v_winner_vote_count, 0)
    where id = p_session_id;

    update public.cc_game_session_final_round_state
    set is_open = p_gallery_open,
        voting_open = false,
        closed_at = now(),
        updated_at = now()
    where session_id = p_session_id;
  else
    insert into public.cc_game_session_final_round_state (
      session_id, is_open, voting_open, opened_at, updated_at
    ) values (
      p_session_id, p_gallery_open, p_voting_open,
      case when p_gallery_open then now() else null end, now()
    )
    on conflict (session_id) do update
      set is_open = excluded.is_open,
          voting_open = excluded.voting_open,
          opened_at = case
            when excluded.is_open and public.cc_game_session_final_round_state.opened_at is null then now()
            else public.cc_game_session_final_round_state.opened_at
          end,
          updated_at = now();

    update public.cc_game_sessions
    set final_gallery_open = p_gallery_open,
        final_voting_open = p_voting_open
    where id = p_session_id;
  end if;

  return jsonb_build_object(
    'final_gallery_open', p_gallery_open,
    'final_voting_open', case when coalesce(v_state.voting_open, false) and not p_voting_open then false else p_voting_open end,
    'final_vote_completed_at', (select final_vote_completed_at from public.cc_game_sessions where id = p_session_id),
    'final_vote_winner_player_id', (select final_vote_winner_player_id from public.cc_game_sessions where id = p_session_id),
    'final_vote_winner_evidence_id', (select final_vote_winner_evidence_id from public.cc_game_sessions where id = p_session_id),
    'final_vote_winner_points', (select final_vote_winner_points from public.cc_game_sessions where id = p_session_id),
    'final_vote_winner_vote_count', (select final_vote_winner_vote_count from public.cc_game_sessions where id = p_session_id),
    'votes_cast', coalesce(v_vote_count, 0)
  );
end;
$$;

create or replace function public.cc_host_set_session_final_slideshow(
  p_session_id uuid,
  p_challenge_id uuid,
  p_evidence_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.cc_game_sessions s
    where s.id = p_session_id and s.host_id = auth.uid()
  ) then
    raise exception 'Game session not found or host access denied';
  end if;

  if not exists (
    select 1 from public.cc_game_session_final_round_state state
    where state.session_id = p_session_id and state.is_open
  ) then
    raise exception 'Open the final round before controlling its slideshow';
  end if;

  if not exists (
    select 1 from public.cc_game_session_challenges c
    where c.id = p_challenge_id and c.session_id = p_session_id and c.kind = 'side'
  ) then
    raise exception 'Choose a side challenge from this game';
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
$$;

create or replace function public.cc_player_cast_session_final_round_vote(
  p_join_code text,
  p_player_token text,
  p_evidence_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_view jsonb;
  v_session_id uuid;
  v_player_id uuid;
  v_round_open boolean;
  v_voting_open boolean;
begin
  v_view := to_jsonb(public.cc_get_game_session_view(p_join_code, p_player_token));
  v_player_id := nullif(v_view #>> '{player,id}', '')::uuid;
  if v_player_id is null then
    raise exception 'Player session is invalid';
  end if;

  select id into v_session_id
  from public.cc_game_sessions
  where join_code = p_join_code;

  select is_open, voting_open into v_round_open, v_voting_open
  from public.cc_game_session_final_round_state
  where session_id = v_session_id
  for update;

  if not found or not coalesce(v_round_open, false) or not coalesce(v_voting_open, false) then
    raise exception 'Final voting is closed';
  end if;

  if not exists (
    select 1
    from public.cc_game_session_evidence e
    join public.cc_game_session_challenges c on c.id = e.challenge_id and c.session_id = e.session_id
    left join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id and sub.player_id = e.player_id and sub.challenge_id = e.challenge_id
    left join public.cc_game_session_secret_assignments sa
      on sa.id = e.secret_assignment_id and sa.session_id = e.session_id
    where e.id = p_evidence_id
      and e.session_id = v_session_id
      and (
        (e.secret_assignment_id is null and c.kind = 'side' and sub.status in ('submitted', 'approved'))
        or (e.secret_assignment_id is not null and c.kind = 'secret' and sa.status = 'approved' and e.saved_for_final)
      )
  ) then
    raise exception 'This entry is not eligible for the final vote';
  end if;

  insert into public.cc_game_session_final_round_votes (session_id, player_id, evidence_id, voted_at)
  values (v_session_id, v_player_id, p_evidence_id, now())
  on conflict (session_id, player_id) do update
    set evidence_id = excluded.evidence_id,
        voted_at = now();
end;
$$;

create or replace function public.cc_player_get_session_final_round_gallery(
  p_join_code text,
  p_player_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_view jsonb;
  v_session_id uuid;
  v_player_id uuid;
  v_result jsonb;
begin
  v_view := to_jsonb(public.cc_get_game_session_view(p_join_code, p_player_token));
  v_player_id := nullif(v_view #>> '{player,id}', '')::uuid;
  if v_player_id is null then
    raise exception 'Player session is invalid';
  end if;

  select id into v_session_id
  from public.cc_game_sessions
  where join_code = p_join_code;

  select jsonb_build_object(
    'gallery_open', s.final_gallery_open,
    'voting_open', s.final_voting_open,
    'voting_completed', s.final_vote_completed_at is not null,
    'completed_at', s.final_vote_completed_at,
    'winner_player_id', s.final_vote_winner_player_id,
    'winner_player_name', winner.name,
    'winner_evidence_id', s.final_vote_winner_evidence_id,
    'winner_challenge_title', winner_challenge.title,
    'winner_points', s.final_vote_winner_points,
    'winner_vote_count', s.final_vote_winner_vote_count,
    'my_vote_id', my_vote.evidence_id,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'player_name', p.name,
        'challenge_title', c.title,
        'challenge_kind', c.kind,
        'media_type', e.media_type,
        'storage_path', e.storage_path,
        'vote_count', case when s.final_voting_open then null else coalesce(vote_counts.vote_count, 0) end,
        'is_my_vote', my_vote.evidence_id = e.id
      ) order by e.created_at, e.id)
      from public.cc_game_session_evidence e
      join public.cc_game_session_players p on p.id = e.player_id and p.session_id = e.session_id
      join public.cc_game_session_challenges c on c.id = e.challenge_id and c.session_id = e.session_id
      left join public.cc_game_session_submissions sub
        on sub.session_id = e.session_id and sub.player_id = e.player_id and sub.challenge_id = e.challenge_id
      left join public.cc_game_session_secret_assignments sa
        on sa.id = e.secret_assignment_id and sa.session_id = e.session_id
      left join lateral (
        select count(*)::integer as vote_count
        from public.cc_game_session_final_round_votes v
        where v.session_id = e.session_id and v.evidence_id = e.id
      ) vote_counts on true
      where e.session_id = v_session_id
        and s.final_gallery_open
        and (
          (e.secret_assignment_id is null and c.kind = 'side' and sub.status in ('submitted', 'approved'))
          or (e.secret_assignment_id is not null and c.kind = 'secret' and sa.status = 'approved' and e.saved_for_final)
        )
    ), '[]'::jsonb)
  )
  into v_result
  from public.cc_game_sessions s
  left join public.cc_game_session_players winner
    on winner.id = s.final_vote_winner_player_id and winner.session_id = s.id
  left join public.cc_game_session_evidence winner_evidence
    on winner_evidence.id = s.final_vote_winner_evidence_id and winner_evidence.session_id = s.id
  left join public.cc_game_session_challenges winner_challenge
    on winner_challenge.id = winner_evidence.challenge_id and winner_challenge.session_id = s.id
  left join public.cc_game_session_final_round_votes my_vote
    on my_vote.session_id = s.id and my_vote.player_id = v_player_id
  where s.id = v_session_id;

  return v_result;
end;
$$;

create or replace function public.cc_get_session_final_slideshow(p_session_id uuid)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'open', coalesce(state.is_open, false),
    'challenge_id', state.slideshow_challenge_id,
    'evidence_id', state.slideshow_evidence_id,
    'items', case when state.is_open then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'player_name', p.name,
        'challenge_id', c.id,
        'challenge_title', c.title,
        'media_type', e.media_type,
        'storage_path', e.storage_path
      ) order by e.created_at, e.id)
      from public.cc_game_session_evidence e
      join public.cc_game_session_players p on p.id = e.player_id and p.session_id = e.session_id
      join public.cc_game_session_challenges c on c.id = e.challenge_id and c.session_id = e.session_id
      join public.cc_game_session_submissions sub
        on sub.session_id = e.session_id and sub.player_id = e.player_id and sub.challenge_id = e.challenge_id
      where e.session_id = p_session_id
        and e.secret_assignment_id is null
        and c.kind = 'side'
        and sub.status in ('submitted', 'approved')
        and c.id = state.slideshow_challenge_id
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from (select p_session_id as session_id) requested
  left join public.cc_game_session_final_round_state state on state.session_id = requested.session_id;
$$;

grant execute on function public.cc_host_manage_session_final_round(uuid, boolean, boolean) to authenticated;
grant execute on function public.cc_host_set_session_final_slideshow(uuid, uuid, uuid) to authenticated;
grant execute on function public.cc_player_cast_session_final_round_vote(text, text, uuid) to anon, authenticated;
grant execute on function public.cc_player_get_session_final_round_gallery(text, text) to anon, authenticated;
grant execute on function public.cc_get_session_final_slideshow(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
