create or replace function public.cc_auto_approve_side_challenge_submission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.cc_game_session_challenges c
    where c.id = new.challenge_id
      and c.session_id = new.session_id
      and c.kind = 'side'
  ) then
    new.status := 'approved';
    new.awarded_points := 5;
  end if;
  return new;
end;
$$;

create or replace function public.cc_award_side_challenge_submission_points()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_previous_awarded_points integer := 0;
  v_score_delta integer;
begin
  if not exists (
    select 1
    from public.cc_game_session_challenges c
    where c.id = new.challenge_id
      and c.session_id = new.session_id
      and c.kind = 'side'
  ) or new.status <> 'approved' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'approved' then
      v_previous_awarded_points := coalesce(old.awarded_points, 0);
    end if;
  end if;

  v_score_delta := coalesce(new.awarded_points, 0) - v_previous_awarded_points;
  if v_score_delta <> 0 then
    update public.cc_game_session_players
    set score = coalesce(score, 0) + v_score_delta
    where id = new.player_id
      and session_id = new.session_id;
  end if;

  return new;
end;
$$;

drop trigger if exists cc_auto_approve_side_challenge_submission
  on public.cc_game_session_submissions;
create trigger cc_auto_approve_side_challenge_submission
before insert or update on public.cc_game_session_submissions
for each row
execute function public.cc_auto_approve_side_challenge_submission();

drop trigger if exists cc_award_side_challenge_submission_points
  on public.cc_game_session_submissions;
create trigger cc_award_side_challenge_submission_points
after insert or update on public.cc_game_session_submissions
for each row
execute function public.cc_award_side_challenge_submission_points();

update public.cc_game_session_submissions sub
set status = 'approved',
    awarded_points = 5
from public.cc_game_session_challenges challenge
where challenge.id = sub.challenge_id
  and challenge.session_id = sub.session_id
  and challenge.kind = 'side'
  and sub.status in ('submitted', 'approved')
  and (sub.status is distinct from 'approved' or sub.awarded_points is distinct from 5);

notify pgrst, 'reload schema';
