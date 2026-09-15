-- User-confirmed account bindings. No account deletion/global role changes.
lock table public.demo_day_settings,public.demo_day_candidates,public.cohort_members in share row exclusive mode;
do $$
declare r record; v_user uuid; v_count integer;
begin
  for r in select * from (values
    ('madina','Мадина'),('alena','Алена'),('ruslan','Руслан'),('ksusha','Ксения'),('elena','Зарема')
  ) as x(candidate_key,account_first_name) loop
    select count(*),(array_agg(u.id))[1] into v_count,v_user from public.users u
      join public.cohort_members cm on cm.user_id=u.id and cm.cohort_id='flow-2'
      where split_part(u.name,' ',1)=r.account_first_name;
    if v_count<>1 then raise exception 'Account binding is ambiguous: %',r.candidate_key; end if;
    if exists(select 1 from public.demo_day_candidates where cohort_id='flow-2' and candidate_key=r.candidate_key
      and owner_user_id is not null and owner_user_id<>v_user) then raise exception 'Existing candidate binding changed'; end if;
    update public.demo_day_candidates set owner_user_id=v_user where cohort_id='flow-2' and candidate_key=r.candidate_key;
    if not found then raise exception 'Candidate missing'; end if;
  end loop;
  select count(*),(array_agg(id))[1] into v_count,v_user from public.users where split_part(name,' ',1)='Paul';
  if v_count<>1 then raise exception 'Tutor Paul account is ambiguous'; end if;
  if exists(select 1 from public.cohort_members where cohort_id='flow-2' and user_id=v_user and role not in('admin','expert')) then
    raise exception 'Existing tutor membership requires review';
  end if;
  insert into public.cohort_members(cohort_id,user_id,role) values('flow-2',v_user,'expert') on conflict(cohort_id,user_id) do nothing;
end; $$;
