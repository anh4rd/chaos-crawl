create or replace function public.cc_get_final_round_player_view(
  p_join_code text,
  p_player_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_join_code_type text;
  v_player_token_type text;
  v_view jsonb;
begin
  select
    pg_catalog.format_type(function_row.proargtypes[0], null),
    pg_catalog.format_type(function_row.proargtypes[1], null)
  into v_join_code_type, v_player_token_type
  from pg_catalog.pg_proc function_row
  join pg_catalog.pg_namespace function_schema
    on function_schema.oid = function_row.pronamespace
  where function_schema.nspname = 'public'
    and function_row.proname = 'cc_get_game_session_view'
    and function_row.pronargs = 2
    and function_row.proargnames[1] = 'p_join_code'
    and function_row.proargnames[2] = 'p_player_token'
  order by function_row.oid desc
  limit 1;

  if v_join_code_type is null or v_player_token_type is null then
    raise exception 'Could not find the installed cc_get_game_session_view(join_code, player_token) function';
  end if;

  execute pg_catalog.format(
    'select pg_catalog.to_jsonb(public.cc_get_game_session_view($1::%s, $2::%s))',
    v_join_code_type,
    v_player_token_type
  )
  using p_join_code, p_player_token
  into v_view;

  return v_view;
end;
$$;

revoke all on function public.cc_get_final_round_player_view(text, text) from public, anon, authenticated;

do $$
declare
  v_function record;
  v_definition text;
  v_old_call constant text := 'to_jsonb(public.cc_get_game_session_view(p_join_code, p_player_token))';
  v_new_call constant text := 'public.cc_get_final_round_player_view(p_join_code, p_player_token)';
  v_updated_count integer := 0;
begin
  for v_function in
    select function_row.oid
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace function_schema
      on function_schema.oid = function_row.pronamespace
    where function_schema.nspname = 'public'
      and (
        (function_row.proname = 'cc_player_cast_session_final_round_vote' and function_row.pronargs = 3)
        or (function_row.proname = 'cc_player_get_session_final_round_gallery' and function_row.pronargs = 2)
      )
  loop
    v_definition := pg_catalog.pg_get_functiondef(v_function.oid);
    if pg_catalog.strpos(v_definition, v_old_call) = 0 then
      if pg_catalog.strpos(v_definition, v_new_call) = 0 then
        raise exception 'Could not find the core game-view call in final-round function %', v_function.oid::regprocedure;
      end if;
    else
      execute pg_catalog.replace(v_definition, v_old_call, v_new_call);
    end if;

    v_updated_count := v_updated_count + 1;
  end loop;

  if v_updated_count <> 2 then
    raise exception 'Expected to update two final-round player functions; updated %', v_updated_count;
  end if;
end;
$$;

notify pgrst, 'reload schema';
