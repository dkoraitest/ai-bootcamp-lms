-- Применена в Supabase под именем 025_demo_day_explicit_voter_roster,
-- версия 20260915102636. В репозитории перенумерована в 026: номер 025
-- параллельно занят миграцией записи урока 7.
-- Право голоса отделено от права управления.
-- Раньше любой admin/expert потока автоматически получал голос. По решению
-- Дмитрия голосуют ровно семеро: пять авторов проектов, Дима и Паша (Paul).
-- Кира остаётся администратором платформы, но голос не подаёт.
create table public.demo_day_voters (
  cohort_id text not null references public.demo_day_settings(cohort_id),
  user_id uuid not null references auth.users(id),
  primary key (cohort_id,user_id)
);
alter table public.demo_day_voters enable row level security;
revoke all on public.demo_day_voters from public,anon,authenticated;
grant select on public.demo_day_voters to authenticated;

-- Кто имеет право подать голос.
create function public.demo_day_can_cast(p_cohort_id text) returns boolean
language sql stable security definer set search_path=public,auth as $$
  select auth.uid() is not null and public.can_access_cohort(p_cohort_id)
    and exists(select 1 from public.cohort_members where cohort_id=p_cohort_id and user_id=auth.uid())
    and exists(select 1 from public.demo_day_voters where cohort_id=p_cohort_id and user_id=auth.uid());
$$;

-- Кто имеет право открыть страницу голосования: голосующие и ведущие.
create or replace function public.demo_day_can_vote(p_cohort_id text) returns boolean
language sql stable security definer set search_path=public,auth as $$
  select public.demo_day_can_cast(p_cohort_id) or public.demo_day_can_manage(p_cohort_id);
$$;

create policy demo_voters_read on public.demo_day_voters for select to authenticated using(public.demo_day_can_vote(cohort_id));

-- Подать голос может только тот, кто есть в списке голосующих.
create or replace function public.save_demo_day_ballot(p_cohort_id text,p_candidate_key text,p_scores jsonb) returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_open boolean; v_owner uuid; v_key text;
begin
  if not public.demo_day_can_cast(p_cohort_id) then raise exception 'Ваш аккаунт не в списке голосующих'; end if;
  -- Same row lock is used by closing/opening: no ballot can race closure.
  select is_open into v_open from public.demo_day_settings where cohort_id=p_cohort_id for update;
  if not coalesce(v_open,false) then raise exception 'Голосование закрыто'; end if;
  select owner_user_id into v_owner from public.demo_day_candidates
    where cohort_id=p_cohort_id and candidate_key=p_candidate_key for share;
  if not found or v_owner is null then raise exception 'Проект не найден'; end if;
  if v_owner=auth.uid() then raise exception 'Нельзя голосовать за свой проект'; end if;
  if p_scores is null or p_scores='null'::jsonb then
    delete from public.demo_day_ballots where cohort_id=p_cohort_id and candidate_key=p_candidate_key and voter_id=auth.uid();
    return;
  end if;
  if jsonb_typeof(p_scores)<>'object' then raise exception 'Нужны три оценки от 0 до 3'; end if;
  if (select count(*) from jsonb_object_keys(p_scores))<>3 then raise exception 'Нужны ровно три оценки'; end if;
  foreach v_key in array array['usefulness','working','understanding'] loop
    if not p_scores ? v_key or jsonb_typeof(p_scores->v_key)<>'number'
      or (p_scores->>v_key) !~ '^[0-3]$' then raise exception 'Нужны целые оценки от 0 до 3'; end if;
  end loop;
  insert into public.demo_day_ballots(cohort_id,candidate_key,voter_id,usefulness,working,understanding)
    values(p_cohort_id,p_candidate_key,auth.uid(),(p_scores->>'usefulness')::smallint,(p_scores->>'working')::smallint,(p_scores->>'understanding')::smallint)
    on conflict(cohort_id,candidate_key,voter_id) do update set usefulness=excluded.usefulness,
      working=excluded.working,understanding=excluded.understanding,updated_at=now();
end; $$;

-- Состояние теперь отдельно сообщает право голоса и число голосующих.
create or replace function public.get_demo_day_state(p_cohort_id text) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_vote(p_cohort_id) then raise exception 'Доступ к голосованию не настроен для этого аккаунта'; end if;
  return jsonb_build_object(
    'viewer_key',auth.uid(),
    'is_open',(select is_open from public.demo_day_settings where cohort_id=p_cohort_id),
    'can_manage',public.demo_day_can_manage(p_cohort_id),
    'can_cast',public.demo_day_can_cast(p_cohort_id),
    'voter_count',(select count(*) from public.demo_day_voters v join public.cohort_members cm
      on cm.cohort_id=v.cohort_id and cm.user_id=v.user_id where v.cohort_id=p_cohort_id),
    'ready',not exists(select 1 from public.demo_day_candidates c where c.cohort_id=p_cohort_id
      and (c.owner_user_id is null or not exists(select 1 from public.cohort_members cm where cm.cohort_id=p_cohort_id and cm.user_id=c.owner_user_id)))
      and (select count(*) from public.demo_day_candidates where cohort_id=p_cohort_id)=5
      and exists(select 1 from public.demo_day_voters where cohort_id=p_cohort_id),
    'candidates',(select jsonb_agg(jsonb_build_object(
      'candidate_key',c.candidate_key,'display_name',c.display_name,'is_self',coalesce(c.owner_user_id=auth.uid(),false),
      'scores',case when b.voter_id is null then null else jsonb_build_object('usefulness',b.usefulness,'working',b.working,'understanding',b.understanding) end,
      'updated_at',b.updated_at) order by c.sort_order)
      from public.demo_day_candidates c left join public.demo_day_ballots b
        on b.cohort_id=c.cohort_id and b.candidate_key=c.candidate_key and b.voter_id=auth.uid()
      where c.cohort_id=p_cohort_id)
  );
end; $$;

-- Открыть голосование нельзя с пустым списком голосующих или выпавшим участником.
create or replace function public.set_demo_day_open(p_cohort_id text,p_is_open boolean) returns void
language plpgsql security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_manage(p_cohort_id) then raise exception 'Forbidden'; end if;
  perform 1 from public.demo_day_settings where cohort_id=p_cohort_id for update;
  if p_is_open is null then raise exception 'Укажите состояние голосования'; end if;
  if p_is_open and ((select count(*) from public.demo_day_candidates where cohort_id=p_cohort_id)<>5
    or exists(select 1 from public.demo_day_candidates c where c.cohort_id=p_cohort_id
      and (c.owner_user_id is null or not exists(select 1 from public.cohort_members cm where cm.cohort_id=p_cohort_id and cm.user_id=c.owner_user_id)))) then
    raise exception 'Сначала подтвердите аккаунты всех пяти участников';
  end if;
  if p_is_open and not exists(select 1 from public.demo_day_voters v join public.cohort_members cm
    on cm.cohort_id=v.cohort_id and cm.user_id=v.user_id where v.cohort_id=p_cohort_id) then
    raise exception 'Список голосующих пуст';
  end if;
  update public.demo_day_settings set is_open=p_is_open where cohort_id=p_cohort_id;
end; $$;

revoke all on function public.demo_day_can_cast(text) from public,anon,authenticated;
grant execute on function public.demo_day_can_cast(text) to authenticated;

-- Состав голосующих: пять авторов проектов плюс Дима и Паша (Paul).
do $$
declare v_user uuid; v_count integer; r record;
begin
  insert into public.demo_day_voters(cohort_id,user_id)
  select 'flow-2',c.owner_user_id from public.demo_day_candidates c
  where c.cohort_id='flow-2' and c.owner_user_id is not null
  on conflict do nothing;
  if (select count(*) from public.demo_day_voters where cohort_id='flow-2')<>5 then
    raise exception 'Ожидались пять авторов проектов в списке голосующих';
  end if;
  for r in select * from (values ('Дима'),('Paul')) as x(account_first_name) loop
    select count(*),(array_agg(u.id))[1] into v_count,v_user from public.users u
      join public.cohort_members cm on cm.user_id=u.id and cm.cohort_id='flow-2'
      where split_part(u.name,' ',1)=r.account_first_name;
    if v_count<>1 then raise exception 'Ведущий определяется неоднозначно: %',r.account_first_name; end if;
    insert into public.demo_day_voters(cohort_id,user_id) values('flow-2',v_user) on conflict do nothing;
  end loop;
  if (select count(*) from public.demo_day_voters where cohort_id='flow-2')<>7 then
    raise exception 'Ожидались семь голосующих';
  end if;
end; $$;
