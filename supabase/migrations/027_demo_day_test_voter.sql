-- Тестовый профиль допущен к голосованию, чтобы Дмитрий мог пройти
-- путь участника целиком до начала демо-дня.
-- Его голоса не должны попасть в результат, поэтому пробные голосующие
-- помечаются флагом и исключаются из агрегатов и из числа голосующих.
-- Так забытый пробный голос не может исказить средние.
alter table public.demo_day_voters add column is_test boolean not null default false;

-- Агрегаты: без самооценок и без пробных голосов.
create or replace function public.get_demo_day_results(p_cohort_id text) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_manage(p_cohort_id) then raise exception 'Forbidden'; end if;
  return (select jsonb_agg(to_jsonb(r) order by r.mean_total desc nulls last,r.display_name) from (
    select c.candidate_key,c.display_name,count(b.voter_id)::integer as vote_count,
      avg(b.usefulness+b.working+b.understanding) as mean_total,
      avg(b.usefulness) as mean_usefulness,avg(b.working) as mean_working,avg(b.understanding) as mean_understanding
    from public.demo_day_candidates c left join public.demo_day_ballots b
      on b.cohort_id=c.cohort_id and b.candidate_key=c.candidate_key
      and b.voter_id is distinct from c.owner_user_id
      and not exists(select 1 from public.demo_day_voters v
        where v.cohort_id=b.cohort_id and v.user_id=b.voter_id and v.is_test)
    where c.cohort_id=p_cohort_id group by c.candidate_key,c.display_name
  ) r);
end; $$;

-- Число голосующих показывает реальный состав, без пробных аккаунтов.
create or replace function public.get_demo_day_state(p_cohort_id text) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_vote(p_cohort_id) then raise exception 'Доступ к голосованию не настроен для этого аккаунта'; end if;
  return jsonb_build_object(
    'viewer_key',auth.uid(),
    'is_open',(select is_open from public.demo_day_settings where cohort_id=p_cohort_id),
    'can_manage',public.demo_day_can_manage(p_cohort_id),
    'can_cast',public.demo_day_can_cast(p_cohort_id),
    'is_test_voter',exists(select 1 from public.demo_day_voters where cohort_id=p_cohort_id and user_id=auth.uid() and is_test),
    'voter_count',(select count(*) from public.demo_day_voters v join public.cohort_members cm
      on cm.cohort_id=v.cohort_id and cm.user_id=v.user_id where v.cohort_id=p_cohort_id and not v.is_test),
    'ready',not exists(select 1 from public.demo_day_candidates c where c.cohort_id=p_cohort_id
      and (c.owner_user_id is null or not exists(select 1 from public.cohort_members cm where cm.cohort_id=p_cohort_id and cm.user_id=c.owner_user_id)))
      and (select count(*) from public.demo_day_candidates where cohort_id=p_cohort_id)=5
      and exists(select 1 from public.demo_day_voters where cohort_id=p_cohort_id and not is_test),
    'candidates',(select jsonb_agg(jsonb_build_object(
      'candidate_key',c.candidate_key,'display_name',c.display_name,'is_self',coalesce(c.owner_user_id=auth.uid(),false),
      'scores',case when b.voter_id is null then null else jsonb_build_object('usefulness',b.usefulness,'working',b.working,'understanding',b.understanding) end,
      'updated_at',b.updated_at) order by c.sort_order)
      from public.demo_day_candidates c left join public.demo_day_ballots b
        on b.cohort_id=c.cohort_id and b.candidate_key=c.candidate_key and b.voter_id=auth.uid()
      where c.cohort_id=p_cohort_id)
  );
end; $$;

-- Открытие приёма требует настоящего состава, пробные аккаунты не в счёт.
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
    on cm.cohort_id=v.cohort_id and cm.user_id=v.user_id where v.cohort_id=p_cohort_id and not v.is_test) then
    raise exception 'Список голосующих пуст';
  end if;
  update public.demo_day_settings set is_open=p_is_open where cohort_id=p_cohort_id;
end; $$;

do $$
declare v_user uuid; v_count integer;
begin
  select count(*),(array_agg(u.id))[1] into v_count,v_user from public.users u
    join public.cohort_members cm on cm.user_id=u.id and cm.cohort_id='flow-2'
    where split_part(u.name,' ',1)='Тестовый';
  if v_count<>1 then raise exception 'Тестовый профиль определяется неоднозначно'; end if;
  insert into public.demo_day_voters(cohort_id,user_id,is_test) values('flow-2',v_user,true)
    on conflict(cohort_id,user_id) do update set is_test=true;
  if (select count(*) from public.demo_day_voters where cohort_id='flow-2' and not is_test)<>7 then
    raise exception 'Настоящих голосующих должно остаться семь';
  end if;
end; $$;
