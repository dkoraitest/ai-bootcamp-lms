-- Equal-weight demo voting, isolated from legacy project_votes and gamification.
create table public.demo_day_settings (
  cohort_id text primary key references public.cohorts(id),
  is_open boolean not null default false
);
create table public.demo_day_candidates (
  cohort_id text not null references public.demo_day_settings(cohort_id),
  candidate_key text not null,
  display_name text not null,
  owner_user_id uuid references auth.users(id),
  sort_order integer not null,
  primary key (cohort_id,candidate_key),
  unique (cohort_id,owner_user_id)
);
create table public.demo_day_ballots (
  cohort_id text not null,
  candidate_key text not null,
  voter_id uuid not null references auth.users(id),
  usefulness smallint not null check (usefulness between 0 and 3),
  working smallint not null check (working between 0 and 3),
  understanding smallint not null check (understanding between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (cohort_id,candidate_key,voter_id),
  foreign key (cohort_id,candidate_key) references public.demo_day_candidates(cohort_id,candidate_key)
);
alter table public.demo_day_settings enable row level security;
alter table public.demo_day_candidates enable row level security;
alter table public.demo_day_ballots enable row level security;

create function public.demo_day_can_manage(p_cohort_id text) returns boolean
language sql stable security definer set search_path=public,auth as $$
  select auth.uid() is not null and public.can_access_cohort(p_cohort_id)
    and exists(select 1 from public.cohort_members where cohort_id=p_cohort_id and user_id=auth.uid())
    and exists(select 1 from public.demo_day_settings where cohort_id=p_cohort_id)
    and (public.is_admin_or_expert() or exists(select 1 from public.cohort_members
      where cohort_id=p_cohort_id and user_id=auth.uid() and role in ('admin','expert')));
$$;
create function public.demo_day_can_vote(p_cohort_id text) returns boolean
language sql stable security definer set search_path=public,auth as $$
  select auth.uid() is not null and public.can_access_cohort(p_cohort_id)
    and exists(select 1 from public.cohort_members where cohort_id=p_cohort_id and user_id=auth.uid())
    and (public.demo_day_can_manage(p_cohort_id) or exists(select 1 from public.demo_day_candidates
      where cohort_id=p_cohort_id and owner_user_id=auth.uid()));
$$;

-- Direct mutation is revoked even for authenticated users; RPCs enforce the contract.
revoke all on public.demo_day_settings,public.demo_day_candidates,public.demo_day_ballots from public,anon,authenticated;
grant select on public.demo_day_settings,public.demo_day_candidates,public.demo_day_ballots to authenticated;
create policy demo_settings_read on public.demo_day_settings for select to authenticated using(public.demo_day_can_vote(cohort_id));
create policy demo_candidates_read on public.demo_day_candidates for select to authenticated using(public.demo_day_can_vote(cohort_id));
create policy demo_ballots_read on public.demo_day_ballots for select to authenticated using(voter_id=auth.uid() and public.demo_day_can_vote(cohort_id));

create function public.get_demo_day_state(p_cohort_id text) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_vote(p_cohort_id) then raise exception 'Доступ к голосованию не настроен для этого аккаунта'; end if;
  return jsonb_build_object(
    'viewer_key',auth.uid(),
    'is_open',(select is_open from public.demo_day_settings where cohort_id=p_cohort_id),
    'can_manage',public.demo_day_can_manage(p_cohort_id),
    'ready',not exists(select 1 from public.demo_day_candidates c where c.cohort_id=p_cohort_id
      and (c.owner_user_id is null or not exists(select 1 from public.cohort_members cm where cm.cohort_id=p_cohort_id and cm.user_id=c.owner_user_id)))
      and (select count(*) from public.demo_day_candidates where cohort_id=p_cohort_id)=5,
    'candidates',(select jsonb_agg(jsonb_build_object(
      'candidate_key',c.candidate_key,'display_name',c.display_name,'is_self',coalesce(c.owner_user_id=auth.uid(),false),
      'scores',case when b.voter_id is null then null else jsonb_build_object('usefulness',b.usefulness,'working',b.working,'understanding',b.understanding) end,
      'updated_at',b.updated_at) order by c.sort_order)
      from public.demo_day_candidates c left join public.demo_day_ballots b
        on b.cohort_id=c.cohort_id and b.candidate_key=c.candidate_key and b.voter_id=auth.uid()
      where c.cohort_id=p_cohort_id)
  );
end; $$;

create function public.save_demo_day_ballot(p_cohort_id text,p_candidate_key text,p_scores jsonb) returns void
language plpgsql security definer set search_path=public,auth as $$
declare v_open boolean; v_owner uuid; v_key text;
begin
  if not public.demo_day_can_vote(p_cohort_id) then raise exception 'Forbidden'; end if;
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

create function public.set_demo_day_open(p_cohort_id text,p_is_open boolean) returns void
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
  update public.demo_day_settings set is_open=p_is_open where cohort_id=p_cohort_id;
end; $$;

create function public.get_demo_day_results(p_cohort_id text) returns jsonb
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
    where c.cohort_id=p_cohort_id group by c.candidate_key,c.display_name
  ) r);
end; $$;

revoke all on function public.demo_day_can_manage(text),public.demo_day_can_vote(text),public.get_demo_day_state(text),
  public.save_demo_day_ballot(text,text,jsonb),public.set_demo_day_open(text,boolean),public.get_demo_day_results(text) from public,anon,authenticated;
grant execute on function public.demo_day_can_manage(text),public.demo_day_can_vote(text),public.get_demo_day_state(text),
  public.save_demo_day_ballot(text,text,jsonb),public.set_demo_day_open(text,boolean),public.get_demo_day_results(text) to authenticated;

insert into public.demo_day_settings(cohort_id,is_open) values('flow-2',false);
insert into public.demo_day_candidates(cohort_id,candidate_key,display_name,sort_order) values
  ('flow-2','madina','Мадина',1),('flow-2','alena','Алёна',2),('flow-2','ruslan','Руслан',3),
  ('flow-2','ksusha','Ксюша',4),('flow-2','elena','Елена',5);
-- Account bindings are intentionally separate: display names are not identity proof.
