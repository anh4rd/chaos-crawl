alter table public.cc_game_session_challenges
  add column secret_response_mode text not null default 'media'
  check (secret_response_mode in ('media', 'text')),
  add constraint cc_secret_text_requires_secret_kind
  check (secret_response_mode <> 'text' or (kind = 'secret' and not allow_photo_upload));

create table public.cc_secret_mission_answers (
  assignment_id uuid primary key references public.cc_game_session_secret_assignments(id) on delete cascade,
  answer text not null check (char_length(btrim(answer)) between 1 and 2000),
  updated_at timestamptz not null default now()
);
alter table public.cc_secret_mission_answers enable row level security;
revoke all on public.cc_secret_mission_answers from public, anon, authenticated;

create function public.cc_guard_secret_text_submission()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status is distinct from new.status)
     and exists (
       select 1 from public.cc_game_session_challenges c
       where c.id = new.challenge_id and c.session_id = new.session_id
         and c.secret_response_mode = 'text'
     )
     and not exists (
       select 1 from public.cc_secret_mission_answers a where a.assignment_id = new.id
     ) then
    raise exception 'Enter an answer before submitting this secret mission.';
  end if;
  return new;
end;
$$;
create trigger cc_guard_secret_text_submission
before insert or update of status on public.cc_game_session_secret_assignments
for each row execute function public.cc_guard_secret_text_submission();

create function public.cc_player_submit_secret_text(
  p_join_code text, p_player_token uuid, p_assignment_id uuid, p_answer text
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_session_id uuid;
  v_player_id uuid;
  v_assignment public.cc_game_session_secret_assignments%rowtype;
  v_answer text := pg_catalog.btrim(coalesce(p_answer, ''));
begin
  if pg_catalog.char_length(v_answer) not between 1 and 2000 then
    raise exception 'Enter an answer between 1 and 2000 characters.';
  end if;
  select s.id, p.id into v_session_id, v_player_id
  from public.cc_game_sessions s
  join public.cc_game_session_players p on p.session_id = s.id
  join public.cc_game_session_player_private k on k.player_id = p.id and k.session_id = s.id
  where s.join_code = pg_catalog.regexp_replace(
    pg_catalog.upper(pg_catalog.btrim(coalesce(p_join_code, ''))), '[^0-9]', '', 'g'
  ) and s.status = 'live' and k.player_token = p_player_token;
  if v_player_id is null then raise exception 'Player session is invalid or the game is not live.'; end if;

  select a.* into v_assignment
  from public.cc_game_session_secret_assignments a
  join public.cc_game_session_challenges c on c.id = a.challenge_id and c.session_id = a.session_id
  where a.id = p_assignment_id and a.session_id = v_session_id
    and a.player_id = v_player_id and c.kind = 'secret' and c.secret_response_mode = 'text'
  for update of a;
  if not found or v_assignment.status not in ('sent', 'rejected') then
    raise exception 'This secret mission is not available for submission.';
  end if;
  if exists (
    select 1 from public.cc_game_session_secret_review_assignments r
    where r.session_id = v_session_id and r.assignment_id = v_assignment.id
      and r.status in ('voting', 'results')
  ) then raise exception 'This secret mission is already under review.'; end if;

  insert into public.cc_secret_mission_answers (assignment_id, answer)
  values (v_assignment.id, v_answer)
  on conflict (assignment_id) do update
    set answer = excluded.answer, updated_at = pg_catalog.now();
  return public.cc_player_submit_secret_mission(p_join_code, p_player_token, p_assignment_id);
end;
$$;

alter function public.cc_get_player_secret_missions(text, uuid) rename to cc_get_player_secret_missions_without_modes;
revoke all on function public.cc_get_player_secret_missions_without_modes(text, uuid) from public, anon, authenticated;

create function public.cc_get_player_secret_missions(p_join_code text, p_player_token uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_missions jsonb;
begin
  v_missions := public.cc_get_player_secret_missions_without_modes(p_join_code, p_player_token);
  return coalesce((
    select pg_catalog.jsonb_agg(entry.value || pg_catalog.jsonb_build_object(
      'response_mode', c.secret_response_mode, 'answer', answer.answer
    ) order by entry.ordinality)
    from pg_catalog.jsonb_array_elements(v_missions) with ordinality as entry(value, ordinality)
    join public.cc_game_session_secret_assignments a on a.id = (entry.value ->> 'assignment_id')::uuid
    join public.cc_game_session_challenges c on c.id = a.challenge_id and c.session_id = a.session_id
    left join public.cc_secret_mission_answers answer on answer.assignment_id = a.id
  ), '[]'::jsonb);
end;
$$;

alter function public.cc_get_session_secret_review_slideshow(uuid) rename to cc_get_secret_review_slideshow_without_answer;
revoke all on function public.cc_get_secret_review_slideshow_without_answer(uuid) from public, anon, authenticated;

create function public.cc_get_session_secret_review_slideshow(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_view jsonb;
begin
  v_view := public.cc_get_secret_review_slideshow_without_answer(p_session_id);
  if coalesce((v_view ->> 'open')::boolean, false) then
    return v_view || pg_catalog.jsonb_build_object('review_opened_at', (
      select r.opened_at
      from public.cc_game_session_secret_review_assignments r
      where r.session_id = p_session_id and r.assignment_id = (v_view ->> 'assignment_id')::uuid
    ), 'answer', (
      select answer.answer
      from public.cc_game_session_secret_assignments a
      join public.cc_game_session_challenges c on c.id = a.challenge_id and c.session_id = a.session_id
      join public.cc_secret_mission_answers answer on answer.assignment_id = a.id
      where a.id = (v_view ->> 'assignment_id')::uuid and a.session_id = p_session_id
        and c.secret_response_mode = 'text'
    ));
  end if;
  return v_view;
end;
$$;

alter function public.cc_player_get_session_secret_review(text, text) rename to cc_player_get_secret_review_without_answer;
revoke all on function public.cc_player_get_secret_review_without_answer(text, text) from public, anon, authenticated;

create function public.cc_player_get_session_secret_review(p_join_code text, p_player_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_view jsonb;
begin
  v_view := public.cc_player_get_secret_review_without_answer(p_join_code, p_player_token);
  if coalesce((v_view ->> 'open')::boolean, false) then
    return v_view || pg_catalog.jsonb_build_object('answer', (
      select answer.answer from public.cc_secret_mission_answers answer
      where answer.assignment_id = nullif(v_view ->> 'assignment_id', '')::uuid
    ));
  end if;
  return v_view;
end;
$$;

alter function public.cc_host_create_game_session(uuid) rename to cc_host_create_game_session_without_secret_modes;
revoke all on function public.cc_host_create_game_session_without_secret_modes(uuid) from public, anon, authenticated;

create function public.cc_host_create_game_session(p_host_game_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_result jsonb;
  v_plan jsonb;
  v_item record;
  v_session_id uuid;
begin
  v_result := public.cc_host_create_game_session_without_secret_modes(p_host_game_id);
  if coalesce((v_result ->> 'existing')::boolean, false) then return v_result; end if;
  v_session_id := (v_result ->> 'id')::uuid;
  select plan_data into v_plan from public.host_games where id = p_host_game_id;
  for v_item in
    select item.value, row_number() over (order by item.ordinality) as sort_order
    from pg_catalog.jsonb_array_elements(coalesce(v_plan -> 'selectedTasks', '[]'::jsonb))
      with ordinality as item(value, ordinality)
    where nullif(pg_catalog.btrim(coalesce(item.value ->> 'title', '')), '') is not null
      and (coalesce(item.value ->> 'kind', 'main') <> 'side'
        or coalesce((v_plan ->> 'sideChallenges')::boolean, true))
      and (coalesce(item.value ->> 'kind', 'main') <> 'secret'
        or ((coalesce((v_plan ->> 'secretMissions')::boolean, false)
             or coalesce((v_plan ->> 'sabotage')::boolean, false))
          and (item.value ->> 'id' is distinct from 'task-sabotage'
            or coalesce((v_plan ->> 'sabotage')::boolean, false))
          and (item.value ->> 'id' is distinct from 'task-secret-mission'
            or coalesce((v_plan ->> 'secretMissions')::boolean, false))))
  loop
    if v_item.value ->> 'kind' = 'secret'
       and v_item.value ->> 'secretResponseMode' = 'text' then
      update public.cc_game_session_challenges
      set secret_response_mode = 'text', allow_photo_upload = false
      where session_id = v_session_id and kind = 'secret' and sort_order = v_item.sort_order;
      if not found then raise exception 'Could not configure a secret mission from the saved plan.'; end if;
    end if;
  end loop;
  return v_result;
end;
$$;

revoke all on function public.cc_guard_secret_text_submission() from public, anon, authenticated;
revoke all on function public.cc_player_submit_secret_text(text, uuid, uuid, text) from public;
revoke all on function public.cc_get_player_secret_missions(text, uuid) from public;
revoke all on function public.cc_get_session_secret_review_slideshow(uuid) from public;
revoke all on function public.cc_player_get_session_secret_review(text, text) from public;
revoke all on function public.cc_host_create_game_session(uuid) from public;
grant execute on function public.cc_player_submit_secret_text(text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.cc_get_player_secret_missions(text, uuid) to anon, authenticated, service_role;
grant execute on function public.cc_get_session_secret_review_slideshow(uuid) to anon, authenticated, service_role;
grant execute on function public.cc_player_get_session_secret_review(text, text) to anon, authenticated, service_role;
grant execute on function public.cc_host_create_game_session(uuid) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
