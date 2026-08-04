create or replace function public.record_agent_launch(p_cohort_id text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_starts_at date;
  v_week_number integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform public.assert_can_access_cohort(p_cohort_id);

  select starts_at
  into v_starts_at
  from public.cohorts
  where id = p_cohort_id
    and is_active = true;

  if not found then
    raise exception 'Cohort not found';
  end if;

  v_week_number := case
    when v_starts_at is null then 1
    else greatest(1, ceil(extract(epoch from (now() - v_starts_at::timestamptz)) / 604800)::integer)
  end;

  insert into public.agent_launches (user_id, cohort_id, launched_at, week_number)
  values (v_user_id, p_cohort_id, now(), v_week_number);

  perform public.increment_points(v_user_id, 5, p_cohort_id);
end;
$$;

revoke all on function public.record_agent_launch(text) from public, anon;
grant execute on function public.record_agent_launch(text) to authenticated;

revoke all on function public.increment_points(uuid, integer) from public, anon, authenticated;
revoke all on function public.increment_points(uuid, integer, text) from public, anon, authenticated;
