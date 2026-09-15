-- Справочные данные по ДЗ рядом с результатом голосования.
-- Прибавлять их к среднему нельзя: результат остаётся средним трёх
-- критериев до 9, как в утверждённом формате. Столбец нужен ведущему,
-- чтобы видеть картину целиком и решать голосом, а не формулой.
-- ДЗ 7 - это сам демо-день, в счёт домашних работ оно не идёт.
create or replace function public.get_demo_day_results(p_cohort_id text) returns jsonb
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if not public.demo_day_can_manage(p_cohort_id) then raise exception 'Forbidden'; end if;
  return (select jsonb_agg(to_jsonb(r) order by r.mean_total desc nulls last,r.display_name) from (
    select c.candidate_key,c.display_name,count(b.voter_id)::integer as vote_count,
      avg(b.usefulness+b.working+b.understanding) as mean_total,
      avg(b.usefulness) as mean_usefulness,avg(b.working) as mean_working,avg(b.understanding) as mean_understanding,
      (select count(*)::integer from public.assignment_submissions s
        where s.user_id=c.owner_user_id and s.cohort_id=c.cohort_id
          and s.assignment_id between 1 and 6
          and s.status in ('submitted','reviewed')) as hw_submitted,
      (select count(*)::integer from public.assignment_submissions s
        where s.user_id=c.owner_user_id and s.cohort_id=c.cohort_id
          and s.assignment_id between 1 and 6
          and s.status='reviewed') as hw_reviewed
    from public.demo_day_candidates c left join public.demo_day_ballots b
      on b.cohort_id=c.cohort_id and b.candidate_key=c.candidate_key
      and b.voter_id is distinct from c.owner_user_id
      and not exists(select 1 from public.demo_day_voters v
        where v.cohort_id=b.cohort_id and v.user_id=b.voter_id and v.is_test)
    where c.cohort_id=p_cohort_id group by c.candidate_key,c.display_name,c.owner_user_id,c.cohort_id
  ) r);
end; $$;
