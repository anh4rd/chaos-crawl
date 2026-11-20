insert into storage.buckets (id, name, public, file_size_limit)
values ('challenge-icons', 'challenge-icons', true, 8388608)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

create policy "Public can read challenge icons"
  on storage.objects
  for select
  to public
  using (bucket_id = 'challenge-icons');

create policy "Hosts can upload challenge icons"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'challenge-icons'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.cc_get_public_main_challenge_art(
  p_join_code text,
  p_challenge_id text,
  p_challenge_title text
)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when jsonb_typeof(
      (game.plan_data::jsonb -> 'challengeArtUrls') -> (task.value ->> 'id')
    ) = 'string'
      then nullif(
        (game.plan_data::jsonb -> 'challengeArtUrls') ->> (task.value ->> 'id'),
        ''
      )
    else null
  end
  from public.cc_game_sessions as session
  join public.host_games as game
    on game.id = session.host_game_id
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(game.plan_data::jsonb -> 'selectedTasks') = 'array'
        then game.plan_data::jsonb -> 'selectedTasks'
      else '[]'::jsonb
    end
  ) as task(value)
  where session.join_code = p_join_code
    and task.value ->> 'kind' = 'main'
    and (
      task.value ->> 'id' = p_challenge_id
      or lower(
        regexp_replace(
          p_challenge_title,
          '[[:space:]]*[-–—][[:space:]]*(player prep|player performance)$',
          '',
          'i'
        )
      ) = lower(task.value ->> 'title')
    )
  order by
    coalesce(task.value ->> 'id' = p_challenge_id, false) desc,
    coalesce(task.value ->> 'title' = p_challenge_title, false) desc
  limit 1;
$$;

revoke all on function public.cc_get_public_main_challenge_art(text, text, text)
  from public;
grant execute on function public.cc_get_public_main_challenge_art(text, text, text)
  to anon, authenticated;

notify pgrst, 'reload schema';
