create or replace function public.cc_require_side_challenge_upload()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'side' then
    new.allow_photo_upload := true;
  end if;
  return new;
end;
$$;

drop trigger if exists cc_require_side_challenge_upload
  on public.cc_game_session_challenges;

create trigger cc_require_side_challenge_upload
before insert or update on public.cc_game_session_challenges
for each row
execute function public.cc_require_side_challenge_upload();

update public.cc_game_session_challenges
set allow_photo_upload = true
where kind = 'side'
  and allow_photo_upload is distinct from true;

notify pgrst, 'reload schema';
