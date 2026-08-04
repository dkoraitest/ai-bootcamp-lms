-- Stage 2 follow-up: preserve assignment notifications for cohort-aware submits.

do $$
begin
  if to_regclass('public.cohorts') is null then
    raise exception 'Stage 2 prerequisite missing: public.cohorts';
  end if;
end;
$$;

create or replace function public.submit_student_assignment(
  p_cohort_id text,
  hw_number integer,
  github_link text default null,
  video_link text default null,
  live_link text default null,
  artifact_text text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_can_access_cohort(p_cohort_id);

  insert into public.assignment_submissions (
    user_id,
    cohort_id,
    assignment_id,
    github_url,
    video_url,
    live_url,
    artifact,
    status,
    submitted_at
  )
  values (
    current_user_id,
    p_cohort_id,
    hw_number,
    nullif(btrim(github_link), ''),
    nullif(btrim(video_link), ''),
    nullif(btrim(live_link), ''),
    nullif(btrim(artifact_text), ''),
    'submitted',
    now()
  )
  on conflict (cohort_id, user_id, assignment_id)
  do update set
    github_url = excluded.github_url,
    video_url = excluded.video_url,
    live_url = excluded.live_url,
    artifact = excluded.artifact,
    status = 'submitted',
    submitted_at = excluded.submitted_at;

  insert into public.user_notifications (
    user_id,
    cohort_id,
    title,
    body,
    kind,
    metadata
  )
  values (
    current_user_id,
    p_cohort_id,
    'Домашнее задание отправлено',
    'Новое задание отправлено на проверку.',
    'assignment_submitted',
    '{}'::jsonb
  );
end;
$$;

revoke execute on function public.submit_student_assignment(text, integer, text, text, text, text) from anon;
grant execute on function public.submit_student_assignment(text, integer, text, text, text, text) to authenticated;
