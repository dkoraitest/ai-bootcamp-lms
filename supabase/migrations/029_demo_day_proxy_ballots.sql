-- Ведущий может проставить оценки за другого голосующего.
-- Нужно на случай, когда человек не успевает зайти сам.
-- Кто внёс голос, записывается в cast_by: подмена не должна быть анонимной.
alter table public.demo_day_ballots add column cast_by uuid references auth.users(id);

-- Список голосующих для панели ведущего: имя и сколько оценок уже стоит.
create function public.get_demo_day_voters(p_cohort_id text) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_manage(p_cohort_id) then raise exception 'Forbidden'; end if;
  return coalesce((select jsonb_agg(to_jsonb(r) order by r.is_test, r.display_name) from (
    select v.user_id, coalesce(nullif(btrim(u.name),''), 'Без имени') as display_name, v.is_test,
      (select count(*)::integer from public.demo_day_ballots b
        where b.cohort_id=v.cohort_id and b.voter_id=v.user_id) as ballots_cast,
      (select count(*)::integer from public.demo_day_candidates c
        where c.cohort_id=v.cohort_id and c.owner_user_id is distinct from v.user_id) as ballots_possible
    from public.demo_day_voters v
    join public.cohort_members cm on cm.cohort_id=v.cohort_id and cm.user_id=v.user_id
    left join public.users u on u.id=v.user_id
    where v.cohort_id=p_cohort_id
  ) r), '[]'::jsonb);
end; $$;

-- Состояние карточек глазами выбранного голосующего.
create function public.get_demo_day_state_for(p_cohort_id text,p_voter_id uuid) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_manage(p_cohort_id) then raise exception 'Forbidden'; end if;
  if not exists(select 1 from public.demo_day_voters where cohort_id=p_cohort_id and user_id=p_voter_id) then
    raise exception 'Этот аккаунт не в списке голосующих';
  end if;
  return jsonb_build_object(
    'viewer_key',p_voter_id,
    'candidates',(select jsonb_agg(jsonb_build_object(
      'candidate_key',c.candidate_key,'display_name',c.display_name,
      'is_self',coalesce(c.owner_user_id=p_voter_id,false),
      'scores',case when b.voter_id is null then null else jsonb_build_object('usefulness',b.usefulness,'working',b.working,'understanding',b.understanding) end,
      'updated_at',b.updated_at) order by c.sort_order)
      from public.demo_day_candidates c left join public.demo_day_ballots b
        on b.cohort_id=c.cohort_id and b.candidate_key=c.candidate_key and b.voter_id=p_voter_id
      where c.cohort_id=p_cohort_id)
  );
end; $$;

-- Сохранение оценки за другого. Правила те же, что и для своего голоса.
create function public.save_demo_day_ballot_for(p_cohort_id text,p_candidate_key text,p_voter_id uuid,p_scores jsonb) returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_open boolean; v_owner uuid; v_key text;
begin
  if not public.demo_day_can_manage(p_cohort_id) then raise exception 'Forbidden'; end if;
  if not exists(select 1 from public.demo_day_voters where cohort_id=p_cohort_id and user_id=p_voter_id) then
    raise exception 'Этот аккаунт не в списке голосующих';
  end if;
  select is_open into v_open from public.demo_day_settings where cohort_id=p_cohort_id for update;
  if not coalesce(v_open,false) then raise exception 'Голосование закрыто'; end if;
  select owner_user_id into v_owner from public.demo_day_candidates
    where cohort_id=p_cohort_id and candidate_key=p_candidate_key for share;
  if not found or v_owner is null then raise exception 'Проект не найден'; end if;
  if v_owner=p_voter_id then raise exception 'Нельзя голосовать за свой проект'; end if;
  if p_scores is null or p_scores='null'::jsonb then
    delete from public.demo_day_ballots where cohort_id=p_cohort_id and candidate_key=p_candidate_key and voter_id=p_voter_id;
    return;
  end if;
  if jsonb_typeof(p_scores)<>'object' then raise exception 'Нужны три оценки от 0 до 3'; end if;
  if (select count(*) from jsonb_object_keys(p_scores))<>3 then raise exception 'Нужны ровно три оценки'; end if;
  foreach v_key in array array['usefulness','working','understanding'] loop
    if not p_scores ? v_key or jsonb_typeof(p_scores->v_key)<>'number'
      or (p_scores->>v_key) !~ '^[0-3]$' then raise exception 'Нужны целые оценки от 0 до 3'; end if;
  end loop;
  insert into public.demo_day_ballots(cohort_id,candidate_key,voter_id,usefulness,working,understanding,cast_by)
    values(p_cohort_id,p_candidate_key,p_voter_id,(p_scores->>'usefulness')::smallint,(p_scores->>'working')::smallint,(p_scores->>'understanding')::smallint,auth.uid())
    on conflict(cohort_id,candidate_key,voter_id) do update set usefulness=excluded.usefulness,
      working=excluded.working,understanding=excluded.understanding,cast_by=excluded.cast_by,updated_at=now();
end; $$;

revoke all on function public.get_demo_day_voters(text),public.get_demo_day_state_for(text,uuid),
  public.save_demo_day_ballot_for(text,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.get_demo_day_voters(text),public.get_demo_day_state_for(text,uuid),
  public.save_demo_day_ballot_for(text,text,uuid,jsonb) to authenticated;
