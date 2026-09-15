-- Список участников в /admin/students падал с ошибкой типов.
-- auth.users.email имеет тип varchar(255), а функция объявляет email text:
-- plpgsql требует точного совпадения типов в RETURN QUERY и отказывает целиком.
-- Поведение и права не меняются, добавлено только явное приведение к text.
create or replace function public.admin_cohort_members(p_cohort_id text)
returns table (
  user_id uuid,
  name text,
  email text,
  telegram text,
  cohort_role text,
  global_role text,
  joined_at timestamptz,
  lessons_done integer,
  hw_submitted integer,
  hw_reviewed integer,
  points integer,
  last_visit date
)
language plpgsql
stable
security definer
set search_path to 'public', 'auth'
as $$
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    cm.user_id,
    coalesce(nullif(btrim(u.name), ''), au.email::text),
    au.email::text,
    u.telegram,
    cm.role,
    nullif(au.raw_app_meta_data ->> 'role', ''),
    cm.created_at,
    (select count(*)::int from public.student_progress sp
      where sp.user_id = cm.user_id and sp.cohort_id = p_cohort_id and sp.status = 'completed'),
    (select count(*)::int from public.assignment_submissions s
      where s.user_id = cm.user_id and s.cohort_id = p_cohort_id
        and s.status in ('submitted', 'reviewed')),
    (select count(*)::int from public.assignment_submissions s
      where s.user_id = cm.user_id and s.cohort_id = p_cohort_id and s.status = 'reviewed'),
    coalesce((select g.points from public.gamification g
      where g.user_id = cm.user_id and g.cohort_id = p_cohort_id), 0)::int,
    (select max(pv.visit_date) from public.platform_visits pv
      where pv.user_id = cm.user_id and pv.cohort_id = p_cohort_id)
  from public.cohort_members cm
  join auth.users au on au.id = cm.user_id
  left join public.users u on u.id = cm.user_id
  where cm.cohort_id = p_cohort_id
  order by 2;
end;
$$;

revoke execute on function public.admin_cohort_members(text) from public, anon;
grant execute on function public.admin_cohort_members(text) to authenticated;
