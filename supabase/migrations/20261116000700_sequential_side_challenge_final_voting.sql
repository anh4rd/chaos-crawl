drop trigger if exists cc_require_votes_for_final_vote_completion
  on public.cc_game_sessions;

update public.cc_game_session_players p
set score = greatest(0, p.score - s.final_vote_winner_points)
from public.cc_game_sessions s
where s.final_vote_completed_at is not null
  and s.final_vote_winner_player_id = p.id
  and p.session_id = s.id
  and s.final_vote_winner_points > 0;

delete from public.cc_game_session_final_round_votes;

update public.cc_game_sessions
set final_gallery_open = false,
    final_voting_open = false,
    final_vote_completed_at = null,
    final_vote_winner_player_id = null,
    final_vote_winner_evidence_id = null,
    final_vote_winner_points = 0,
    final_vote_winner_vote_count = 0;

update public.cc_game_session_final_round_state
set is_open = false,
    voting_open = false,
    slideshow_evidence_id = null,
    opened_at = null,
    closed_at = null,
    updated_at = now();

alter table public.cc_game_session_final_round_votes
  drop constraint if exists cc_game_session_final_round_votes_pkey;
alter table public.cc_game_session_final_round_votes
  add column if not exists challenge_id uuid;
alter table public.cc_game_session_final_round_votes
  alter column challenge_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cc_game_session_final_round_votes'::regclass
      and conname = 'cc_game_session_final_round_votes_challenge_id_fkey'
  ) then
    alter table public.cc_game_session_final_round_votes
      add constraint cc_game_session_final_round_votes_challenge_id_fkey
      foreign key (challenge_id)
      references public.cc_game_session_challenges(id)
      on delete cascade;
  end if;
end;
$$;

alter table public.cc_game_session_final_round_votes
  add constraint cc_game_session_final_round_votes_pkey
  primary key (session_id, challenge_id, player_id);

create index if not exists cc_game_session_final_round_votes_challenge_evidence_idx
  on public.cc_game_session_final_round_votes (session_id, challenge_id, evidence_id);

create table if not exists public.cc_game_session_final_round_challenges (
  session_id uuid not null references public.cc_game_sessions(id) on delete cascade,
  challenge_id uuid not null references public.cc_game_session_challenges(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'voting', 'results')),
  votes_cast integer not null default 0 check (votes_cast >= 0),
  opened_at timestamptz,
  closed_at timestamptz,
  primary key (session_id, challenge_id)
);

create table if not exists public.cc_game_session_final_round_awards (
  session_id uuid not null references public.cc_game_sessions(id) on delete cascade,
  challenge_id uuid not null references public.cc_game_session_challenges(id) on delete cascade,
  player_id uuid not null references public.cc_game_session_players(id) on delete cascade,
  points_awarded integer not null default 0 check (points_awarded >= 0),
  votes_received integer not null default 0 check (votes_received > 0),
  awarded_at timestamptz not null default now(),
  primary key (session_id, challenge_id, player_id)
);

insert into public.cc_game_session_final_round_challenges (session_id, challenge_id)
select c.session_id, c.id
from public.cc_game_session_challenges c
where c.kind = 'side'
on conflict (session_id, challenge_id) do nothing;

alter table public.cc_game_session_final_round_challenges enable row level security;
alter table public.cc_game_session_final_round_awards enable row level security;

grant select on public.cc_game_session_final_round_challenges to authenticated;
grant select on public.cc_game_session_final_round_awards to authenticated;

drop policy if exists "Hosts can read final round challenges"
  on public.cc_game_session_final_round_challenges;
create policy "Hosts can read final round challenges"
  on public.cc_game_session_final_round_challenges for select to authenticated
  using (exists (
    select 1 from public.cc_game_sessions s
    where s.id = session_id and s.host_id = auth.uid()
  ));

drop policy if exists "Hosts can read final round awards"
  on public.cc_game_session_final_round_awards;
create policy "Hosts can read final round awards"
  on public.cc_game_session_final_round_awards for select to authenticated
  using (exists (
    select 1 from public.cc_game_sessions s
    where s.id = session_id and s.host_id = auth.uid()
  ));

create or replace function public.cc_register_final_round_side_challenge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'side' then
    insert into public.cc_game_session_final_round_challenges (session_id, challenge_id)
    values (new.session_id, new.id)
    on conflict (session_id, challenge_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists cc_register_final_round_side_challenge
  on public.cc_game_session_challenges;
create trigger cc_register_final_round_side_challenge
after insert on public.cc_game_session_challenges
for each row
execute function public.cc_register_final_round_side_challenge();

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
$$;

create or replace function public.cc_host_advance_session_final_round_challenge(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_final_round_state%rowtype;
  v_current_sort_order integer;
  v_next_challenge_id uuid;
begin
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
declare
  v_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_status text;
begin
  if not exists (
    select 1 from public.cc_game_sessions s
    where s.id = p_session_id and s.host_id = auth.uid()
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
  v_challenge_id uuid;
begin
  v_view := to_jsonb(public.cc_get_final_round_player_view(p_join_code, p_player_token));
  v_player_id := nullif(v_view #>> '{player,id}', '')::uuid;
  if v_player_id is null then
    raise exception 'Player session is invalid';
  end if;

  select id into v_session_id
  from public.cc_game_sessions
  where join_code = p_join_code;
  if v_session_id is null then
    raise exception 'Game session not found';
  end if;

  select slideshow_challenge_id into v_challenge_id
  from public.cc_game_session_final_round_state
  where session_id = v_session_id and is_open and voting_open
  for update;
  if v_challenge_id is null then
    raise exception 'Final voting is closed';
  end if;

  if not exists (
    select 1
    from public.cc_game_session_final_round_challenges
    where session_id = v_session_id
      and challenge_id = v_challenge_id
      and status = 'voting'
  ) then
    raise exception 'The current challenge is not open for voting';
  end if;

  if not exists (
    select 1
    from public.cc_game_session_evidence e
    join public.cc_game_session_challenges c
      on c.id = e.challenge_id and c.session_id = e.session_id
    join public.cc_game_session_submissions sub
      on sub.session_id = e.session_id
      and sub.player_id = e.player_id
      and sub.challenge_id = e.challenge_id
    where e.id = p_evidence_id
      and e.session_id = v_session_id
      and e.challenge_id = v_challenge_id
      and e.secret_assignment_id is null
      and c.kind = 'side'
      and sub.status in ('submitted', 'approved')
  ) then
    raise exception 'This entry is not eligible for the current challenge vote';
  end if;

  insert into public.cc_game_session_final_round_votes (
    session_id, challenge_id, player_id, evidence_id, voted_at
  ) values (
    v_session_id, v_challenge_id, v_player_id, p_evidence_id, now()
  )
  on conflict (session_id, challenge_id, player_id) do update
    set evidence_id = excluded.evidence_id, voted_at = now();
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
  v_session public.cc_game_sessions%rowtype;
  v_state public.cc_game_session_final_round_state%rowtype;
  v_challenge_id uuid;
  v_challenge_status text;
  v_top_vote_count integer;
  v_my_vote_id uuid;
  v_result jsonb;
begin
  v_view := to_jsonb(public.cc_get_final_round_player_view(p_join_code, p_player_token));
  v_player_id := nullif(v_view #>> '{player,id}', '')::uuid;
  if v_player_id is null then
    raise exception 'Player session is invalid';
  end if;

  select id into v_session_id
  from public.cc_game_sessions
  where join_code = p_join_code;
  if v_session_id is null then
    raise exception 'Game session not found';
  end if;

  select * into v_session
  from public.cc_game_sessions
  where id = v_session_id;

  select * into v_state
  from public.cc_game_session_final_round_state
  where session_id = v_session_id;

  v_challenge_id := v_state.slideshow_challenge_id;
  if v_challenge_id is not null then
    select status into v_challenge_status
    from public.cc_game_session_final_round_challenges
    where session_id = v_session_id and challenge_id = v_challenge_id;
  end if;

  select evidence_id into v_my_vote_id
  from public.cc_game_session_final_round_votes
  where session_id = v_session_id
    and challenge_id = v_challenge_id
    and player_id = v_player_id;

  if v_challenge_status = 'results' then
    select max(counts.vote_count)::integer into v_top_vote_count
    from (
      select count(v.player_id)::integer as vote_count
      from public.cc_game_session_evidence e
      join public.cc_game_session_submissions sub
        on sub.session_id = e.session_id
        and sub.player_id = e.player_id
        and sub.challenge_id = e.challenge_id
      left join public.cc_game_session_final_round_votes v
        on v.session_id = e.session_id
        and v.challenge_id = e.challenge_id
        and v.evidence_id = e.id
      where e.session_id = v_session_id
        and e.challenge_id = v_challenge_id
        and e.secret_assignment_id is null
        and sub.status in ('submitted', 'approved')
      group by e.id
    ) counts;
  end if;

  select jsonb_build_object(
    'gallery_open', coalesce(v_state.is_open, false),
    'voting_open', coalesce(v_state.voting_open, false),
    'voting_completed', v_challenge_status = 'results',
    'sequence_completed', v_session.final_vote_completed_at is not null,
    'challenge_id', v_challenge_id,
    'challenge_title', challenge.title,
    'challenge_description', challenge.description,
    'challenge_points', coalesce(challenge.points, 0),
    'challenge_status', v_challenge_status,
    'votes_cast', case
      when v_challenge_status = 'results' then coalesce(challenge_state.votes_cast, 0)
      when v_state.voting_open then (
        select count(*)::integer
        from public.cc_game_session_final_round_votes v
        where v.session_id = v_session_id and v.challenge_id = v_challenge_id
      )
      else 0
    end,
    'my_vote_id', v_my_vote_id,
    'items', case
      when coalesce(v_state.is_open, false) and v_challenge_id is not null then coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', e.id,
          'player_id', p.id,
          'player_name', p.name,
          'player_avatar_url', p.avatar_url,
          'challenge_title', challenge.title,
          'challenge_kind', challenge.kind,
          'media_type', e.media_type,
          'storage_path', e.storage_path,
          'vote_count', case
            when v_challenge_status = 'results' then coalesce(vote_counts.vote_count, 0)
            else null
          end,
          'is_my_vote', v_my_vote_id = e.id,
          'is_winner', v_challenge_status = 'results'
            and coalesce(vote_counts.vote_count, 0) > 0
            and vote_counts.vote_count = v_top_vote_count,
          'voters', case
            when v_challenge_status = 'results' then coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', voter.id,
                'name', voter.name,
                'avatar_url', voter.avatar_url
              ) order by vote.voted_at, voter.name)
              from public.cc_game_session_final_round_votes vote
              join public.cc_game_session_players voter
                on voter.id = vote.player_id and voter.session_id = vote.session_id
              where vote.session_id = e.session_id
                and vote.challenge_id = e.challenge_id
                and vote.evidence_id = e.id
            ), '[]'::jsonb)
            else '[]'::jsonb
          end
        ) order by e.created_at, e.id)
        from public.cc_game_session_evidence e
        join public.cc_game_session_players p on p.id = e.player_id and p.session_id = e.session_id
        join public.cc_game_session_challenges challenge
          on challenge.id = e.challenge_id and challenge.session_id = e.session_id
        join public.cc_game_session_submissions sub
          on sub.session_id = e.session_id
          and sub.player_id = e.player_id
          and sub.challenge_id = e.challenge_id
        left join lateral (
          select count(*)::integer as vote_count
          from public.cc_game_session_final_round_votes vote
          where vote.session_id = e.session_id
            and vote.challenge_id = e.challenge_id
            and vote.evidence_id = e.id
        ) vote_counts on true
        where e.session_id = v_session_id
          and e.challenge_id = v_challenge_id
          and e.secret_assignment_id is null
          and challenge.kind = 'side'
          and sub.status in ('submitted', 'approved')
      ), '[]'::jsonb)
      else '[]'::jsonb
    end,
    'leaderboard', case
      when v_challenge_status = 'results' then coalesce((
        select jsonb_agg(jsonb_build_object(
          'player_id', p.id,
          'name', p.name,
          'avatar_url', p.avatar_url,
          'score', p.score,
          'team_id', p.team_id,
          'team_name', team.name
        ) order by p.score desc, p.name, p.id)
        from public.cc_game_session_players p
        left join public.cc_game_session_teams team
          on team.id = p.team_id and team.session_id = p.session_id
        where p.session_id = v_session_id
      ), '[]'::jsonb)
      else '[]'::jsonb
    end
  )
  into v_result
  from public.cc_game_session_final_round_state state
  left join public.cc_game_session_final_round_challenges challenge_state
    on challenge_state.session_id = state.session_id
    and challenge_state.challenge_id = v_challenge_id
  left join public.cc_game_session_challenges challenge
    on challenge.id = v_challenge_id and challenge.session_id = state.session_id
  where state.session_id = v_session_id;

  if v_result is null then
    v_result := jsonb_build_object(
      'gallery_open', false,
      'voting_open', false,
      'voting_completed', false,
      'sequence_completed', v_session.final_vote_completed_at is not null,
      'challenge_id', null,
      'challenge_title', null,
      'challenge_description', null,
      'challenge_points', 0,
      'challenge_status', null,
      'votes_cast', 0,
      'my_vote_id', null,
      'items', '[]'::jsonb,
      'leaderboard', '[]'::jsonb
    );
  end if;

  return v_result;
end;
$$;

grant execute on function public.cc_host_manage_session_final_round(uuid, boolean, boolean) to authenticated;
grant execute on function public.cc_host_advance_session_final_round_challenge(uuid) to authenticated;
grant execute on function public.cc_host_set_session_final_slideshow(uuid, uuid, uuid) to authenticated;
grant execute on function public.cc_player_cast_session_final_round_vote(text, text, uuid) to anon, authenticated;
grant execute on function public.cc_player_get_session_final_round_gallery(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
