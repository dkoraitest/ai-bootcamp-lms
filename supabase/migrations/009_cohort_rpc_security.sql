-- Multi-cohort LMS Stage 2: RPC, RLS, and security hardening.
--
-- This migration is a transition layer. It adds cohort-aware RPC signatures and
-- guards old signatures as flow-1 wrappers so the current frontend keeps
-- working until CohortProvider/useCohort is integrated.
--
-- Old unique constraints such as (user_id, lesson_id) are intentionally kept
-- here because the current frontend still uses old direct upsert conflict
-- targets for student_progress and platform_visits. Drop them only after the
-- frontend writes cohort-aware conflict targets everywhere.

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'cohorts'
  ) then
    raise exception '009_cohort_rpc_security requires 008_cohorts to be applied first';
  end if;
end $$;

create or replace function public.is_admin_or_expert()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'expert')
    or exists (
      select 1
      from auth.users au
      where au.id = auth.uid()
        and coalesce(au.raw_app_meta_data ->> 'role', '') in ('admin', 'expert')
    );
$$;

create or replace function public.can_access_cohort(p_cohort_id text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.cohorts c
    where c.id = p_cohort_id
      and c.is_active
      and (
        public.is_admin_or_expert()
        or (
          c.is_visible_to_students
          and exists (
            select 1
            from public.cohort_members cm
            where cm.cohort_id = c.id
              and cm.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.assert_can_access_cohort(p_cohort_id text)
returns void
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if p_cohort_id is null or not public.can_access_cohort(p_cohort_id) then
    raise exception 'Forbidden';
  end if;
end;
$$;

create or replace function public.assert_admin_or_expert()
returns void
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin_or_expert() then
    raise exception 'Forbidden';
  end if;
end;
$$;

create or replace function public.get_available_cohorts()
returns table (
  id text,
  name text,
  starts_at date,
  ends_at date,
  is_visible_to_students boolean
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    c.id,
    c.name,
    c.starts_at,
    c.ends_at,
    c.is_visible_to_students
  from public.cohorts c
  where c.is_active
    and (
      public.is_admin_or_expert()
      or (
        c.is_visible_to_students
        and exists (
          select 1
          from public.cohort_members cm
          where cm.cohort_id = c.id
            and cm.user_id = auth.uid()
        )
      )
    )
  order by c.display_order, c.id;
$$;

-- Clean up Stage 1 policy shape: keep one SELECT policy per cohort table and
-- split admin writes into action-specific policies.
drop policy if exists cohorts_admin_all on public.cohorts;
drop policy if exists cohort_members_admin_all on public.cohort_members;
drop policy if exists cohort_lesson_settings_admin_all on public.cohort_lesson_settings;
drop policy if exists cohort_material_settings_admin_all on public.cohort_material_settings;
drop policy if exists cohort_lesson_schedule_admin_all on public.cohort_lesson_schedule;
drop policy if exists cohort_assignment_schedule_admin_all on public.cohort_assignment_schedule;

drop policy if exists cohorts_admin_insert on public.cohorts;
create policy cohorts_admin_insert
  on public.cohorts
  for insert
  to authenticated
  with check (public.is_admin_or_expert());

drop policy if exists cohorts_admin_update on public.cohorts;
create policy cohorts_admin_update
  on public.cohorts
  for update
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohorts_admin_delete on public.cohorts;
create policy cohorts_admin_delete
  on public.cohorts
  for delete
  to authenticated
  using (public.is_admin_or_expert());

drop policy if exists cohort_members_admin_insert on public.cohort_members;
create policy cohort_members_admin_insert
  on public.cohort_members
  for insert
  to authenticated
  with check (public.is_admin_or_expert());

drop policy if exists cohort_members_admin_update on public.cohort_members;
create policy cohort_members_admin_update
  on public.cohort_members
  for update
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_members_admin_delete on public.cohort_members;
create policy cohort_members_admin_delete
  on public.cohort_members
  for delete
  to authenticated
  using (public.is_admin_or_expert());

drop policy if exists cohort_lesson_settings_admin_insert on public.cohort_lesson_settings;
create policy cohort_lesson_settings_admin_insert
  on public.cohort_lesson_settings
  for insert
  to authenticated
  with check (public.is_admin_or_expert());

drop policy if exists cohort_lesson_settings_admin_update on public.cohort_lesson_settings;
create policy cohort_lesson_settings_admin_update
  on public.cohort_lesson_settings
  for update
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_lesson_settings_admin_delete on public.cohort_lesson_settings;
create policy cohort_lesson_settings_admin_delete
  on public.cohort_lesson_settings
  for delete
  to authenticated
  using (public.is_admin_or_expert());

drop policy if exists cohort_material_settings_admin_insert on public.cohort_material_settings;
create policy cohort_material_settings_admin_insert
  on public.cohort_material_settings
  for insert
  to authenticated
  with check (public.is_admin_or_expert());

drop policy if exists cohort_material_settings_admin_update on public.cohort_material_settings;
create policy cohort_material_settings_admin_update
  on public.cohort_material_settings
  for update
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_material_settings_admin_delete on public.cohort_material_settings;
create policy cohort_material_settings_admin_delete
  on public.cohort_material_settings
  for delete
  to authenticated
  using (public.is_admin_or_expert());

drop policy if exists cohort_lesson_schedule_admin_insert on public.cohort_lesson_schedule;
create policy cohort_lesson_schedule_admin_insert
  on public.cohort_lesson_schedule
  for insert
  to authenticated
  with check (public.is_admin_or_expert());

drop policy if exists cohort_lesson_schedule_admin_update on public.cohort_lesson_schedule;
create policy cohort_lesson_schedule_admin_update
  on public.cohort_lesson_schedule
  for update
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_lesson_schedule_admin_delete on public.cohort_lesson_schedule;
create policy cohort_lesson_schedule_admin_delete
  on public.cohort_lesson_schedule
  for delete
  to authenticated
  using (public.is_admin_or_expert());

drop policy if exists cohort_assignment_schedule_admin_insert on public.cohort_assignment_schedule;
create policy cohort_assignment_schedule_admin_insert
  on public.cohort_assignment_schedule
  for insert
  to authenticated
  with check (public.is_admin_or_expert());

drop policy if exists cohort_assignment_schedule_admin_update on public.cohort_assignment_schedule;
create policy cohort_assignment_schedule_admin_update
  on public.cohort_assignment_schedule
  for update
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_assignment_schedule_admin_delete on public.cohort_assignment_schedule;
create policy cohort_assignment_schedule_admin_delete
  on public.cohort_assignment_schedule
  for delete
  to authenticated
  using (public.is_admin_or_expert());

-- Cohort-aware RLS for existing personal tables.
drop policy if exists "Users see own progress" on public.student_progress;
drop policy if exists student_progress_own_cohort on public.student_progress;
create policy student_progress_own_cohort
  on public.student_progress
  for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists "Users see own submissions" on public.assignment_submissions;
drop policy if exists assignment_submissions_own_cohort on public.assignment_submissions;
create policy assignment_submissions_own_cohort
  on public.assignment_submissions
  for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists "Users see own gamification" on public.gamification;
drop policy if exists gamification_own_cohort on public.gamification;
create policy gamification_own_cohort
  on public.gamification
  for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists "Users see own launches" on public.agent_launches;
drop policy if exists agent_launches_own_cohort on public.agent_launches;
create policy agent_launches_own_cohort
  on public.agent_launches
  for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists platform_visits_own_cohort on public.platform_visits;
create policy platform_visits_own_cohort
  on public.platform_visits
  for all
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  )
  with check (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists "Users see own reviews" on public.peer_reviews;
drop policy if exists peer_reviews_own_cohort on public.peer_reviews;
create policy peer_reviews_own_cohort
  on public.peer_reviews
  for all
  to authenticated
  using (
    reviewer_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  )
  with check (
    reviewer_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists project_votes_own_cohort on public.project_votes;
create policy project_votes_own_cohort
  on public.project_votes
  for all
  to authenticated
  using (
    voter_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  )
  with check (
    voter_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists user_notifications_own_cohort on public.user_notifications;
create policy user_notifications_own_cohort
  on public.user_notifications
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and public.can_access_cohort(cohort_id)
  );

drop policy if exists users_select_self_or_admin on public.users;
create policy users_select_self_or_admin
  on public.users
  for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin_or_expert());

drop policy if exists users_update_self_or_admin on public.users;
create policy users_update_self_or_admin
  on public.users
  for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin_or_expert())
  with check (id = (select auth.uid()) or public.is_admin_or_expert());

-- Direct materials reads now require visibility in at least one accessible
-- cohort. This preserves flow-1 access and prevents flow-2-only students from
-- reading hidden flow-1 material URLs once flow-2 opens.
drop policy if exists "authenticated read materials" on public.materials;
drop policy if exists materials_select_visible_accessible_cohort on public.materials;
create policy materials_select_visible_accessible_cohort
  on public.materials
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.cohort_material_settings cms
      where cms.material_id = materials.id
        and cms.is_visible
        and public.can_access_cohort(cms.cohort_id)
    )
  );

-- Points and badges.
create or replace function public.increment_points(
  p_user_id uuid,
  p_points integer,
  p_cohort_id text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_can_access_cohort(p_cohort_id);

  if p_user_id is null or p_points is null then
    raise exception 'Invalid points payload';
  end if;

  if not public.is_admin_or_expert()
    and (select auth.uid()) is distinct from p_user_id then
    raise exception 'Forbidden';
  end if;

  insert into public.gamification (user_id, cohort_id, points, level, badges, quests)
  values (p_user_id, p_cohort_id, p_points, 1, '[]'::jsonb, '[]'::jsonb)
  on conflict (cohort_id, user_id)
  do update set
    points = coalesce(public.gamification.points, 0) + p_points;
end;
$$;

create or replace function public.increment_points(
  p_user_id uuid,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.increment_points(p_user_id, p_points, 'flow-1');
end;
$$;

create or replace function public.award_badge(
  p_user_id uuid,
  p_badge_id integer,
  p_cohort_id text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_points int;
begin
  perform public.assert_can_access_cohort(p_cohort_id);

  if not public.is_admin_or_expert()
    and (select auth.uid()) is distinct from p_user_id then
    raise exception 'Forbidden';
  end if;

  v_points := case p_badge_id
    when 1 then 20 when 2 then 40 when 3 then 30
    when 4 then 50 when 5 then 50 when 6 then 30
    when 7 then 60 when 8 then 60 when 9 then 80
    when 10 then 60 when 11 then 40 when 12 then 100
    else 0
  end;

  insert into public.gamification (user_id, cohort_id, points, level, badges, quests)
  values (p_user_id, p_cohort_id, 0, 1, '[]'::jsonb, '[]'::jsonb)
  on conflict (cohort_id, user_id)
  do nothing;

  update public.gamification g
  set badges = coalesce(g.badges, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object('id', p_badge_id, 'earnedAt', to_char(now(), 'DD.MM.YYYY'))
  )
  where g.user_id = p_user_id
    and g.cohort_id = p_cohort_id
    and not exists (
      select 1
      from jsonb_array_elements(coalesce(g.badges, '[]'::jsonb)) b
      where (b ->> 'id')::int = p_badge_id
    );

  if found and v_points > 0 then
    perform public.increment_points(p_user_id, v_points, p_cohort_id);
  end if;
end;
$$;

create or replace function public.award_badge(
  p_user_id uuid,
  p_badge_id integer
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.award_badge(p_user_id, p_badge_id, 'flow-1');
end;
$$;

create or replace function public.trigger_badge_on_progress()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if NEW.status = 'completed'
    and (TG_OP = 'INSERT' or coalesce(OLD.status, '') <> 'completed') then
    perform public.increment_points(NEW.user_id, 10, NEW.cohort_id);
  end if;

  if NEW.status = 'completed'
    and exists (
      select 1
      from public.lessons l
      where l.id = NEW.lesson_id
        and l.week = 1
        and l.lesson_number = 1
    ) then
    perform public.award_badge(NEW.user_id, 1, NEW.cohort_id);
  end if;

  return NEW;
end;
$$;

create or replace function public.trigger_badge_on_submission()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  case NEW.assignment_id
    when 1 then
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 2, NEW.cohort_id);
      end if;
      if NEW.status = 'reviewed' then
        perform public.award_badge(NEW.user_id, 3, NEW.cohort_id);
      end if;
    when 2 then
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 4, NEW.cohort_id);
      end if;
    when 3 then
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 5, NEW.cohort_id);
      end if;
      if NEW.status = 'reviewed' then
        perform public.award_badge(NEW.user_id, 6, NEW.cohort_id);
      end if;
    when 4 then
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 7, NEW.cohort_id);
      end if;
    when 5 then
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 10, NEW.cohort_id);
      end if;
    when 6 then
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 12, NEW.cohort_id);
      end if;
    else null;
  end case;

  return NEW;
end;
$$;

create or replace function public.trigger_badge_on_launch()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_week_launches int;
  v_streak_weeks int;
begin
  select count(*) into v_week_launches
  from public.agent_launches al
  where al.user_id = NEW.user_id
    and al.cohort_id = NEW.cohort_id
    and al.week_number = NEW.week_number;

  if v_week_launches >= 5 then
    perform public.award_badge(NEW.user_id, 8, NEW.cohort_id);
  end if;

  select count(distinct al.week_number) into v_streak_weeks
  from public.agent_launches al
  where al.user_id = NEW.user_id
    and al.cohort_id = NEW.cohort_id
    and al.week_number in (NEW.week_number, NEW.week_number - 1, NEW.week_number - 2);

  if v_streak_weeks >= 3 then
    perform public.award_badge(NEW.user_id, 9, NEW.cohort_id);
  end if;

  return NEW;
end;
$$;

create or replace function public.trigger_badge_on_peer_review()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_review_count int;
begin
  select count(*) into v_review_count
  from public.peer_reviews pr
  where pr.reviewer_id = NEW.reviewer_id
    and pr.cohort_id = NEW.cohort_id;

  if v_review_count >= 2 then
    perform public.award_badge(NEW.reviewer_id, 11, NEW.cohort_id);
  end if;

  return NEW;
end;
$$;

-- Assignments and notifications.
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

end;
$$;

create or replace function public.get_my_assignment_submissions(p_cohort_id text)
returns table (
  assignment_id integer,
  status text,
  github_url text,
  video_url text,
  live_url text,
  artifact text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    s.assignment_id,
    s.status,
    s.github_url,
    s.video_url,
    s.live_url,
    s.artifact,
    s.submitted_at
  from public.assignment_submissions s
  where s.user_id = auth.uid()
    and s.cohort_id = p_cohort_id
  order by s.assignment_id;
end;
$$;

create or replace function public.get_my_assignment_submissions()
returns table (
  assignment_id integer,
  status text,
  github_url text,
  video_url text,
  live_url text,
  artifact text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select *
  from public.get_my_assignment_submissions('flow-1');
end;
$$;

create or replace function public.get_my_notifications(p_cohort_id text)
returns table (
  id uuid,
  title text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    n.id,
    n.title,
    n.body,
    n.created_at
  from public.user_notifications n
  where n.user_id = auth.uid()
    and n.cohort_id = p_cohort_id
  order by n.created_at desc
  limit 5;
end;
$$;

create or replace function public.get_my_notifications()
returns table (
  id uuid,
  title text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select *
  from public.get_my_notifications('flow-1');
end;
$$;

create or replace function public.get_assignment_submissions_feed(p_cohort_id text)
returns table (
  id uuid,
  hw_number integer,
  student_name text,
  student_email text,
  github_url text,
  video_url text,
  live_url text,
  artifact text,
  status text,
  submitted_at timestamptz,
  feedback text,
  points_earned integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    s.id,
    s.assignment_id as hw_number,
    coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email::text, '@', 1))::text,
    u.email::text,
    s.github_url::text,
    s.video_url::text,
    s.live_url::text,
    s.artifact::text,
    s.status::text,
    s.submitted_at,
    s.feedback::text,
    s.points_earned
  from public.assignment_submissions s
  join auth.users u on u.id = s.user_id
  where s.cohort_id = p_cohort_id
    and s.status in ('submitted', 'reviewed')
  order by s.submitted_at desc nulls last, s.assignment_id asc;
end;
$$;

create or replace function public.get_assignment_submissions_feed()
returns table (
  id uuid,
  hw_number integer,
  student_name text,
  student_email text,
  github_url text,
  video_url text,
  live_url text,
  artifact text,
  status text,
  submitted_at timestamptz,
  feedback text,
  points_earned integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select *
  from public.get_assignment_submissions_feed('flow-1');
end;
$$;

create or replace function public.review_assignment_submission(
  p_cohort_id text,
  submission_id uuid,
  feedback_text text default null,
  earned_points integer default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  student_id uuid;
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  update public.assignment_submissions s
  set status = 'reviewed',
      feedback = feedback_text,
      points_earned = earned_points
  where s.id = submission_id
    and s.cohort_id = p_cohort_id
  returning s.user_id into student_id;

  if student_id is null then
    raise exception 'Submission not found';
  end if;

  insert into public.user_notifications (user_id, cohort_id, title, body, kind, metadata)
  values (
    student_id,
    p_cohort_id,
    'Домашнее задание проверено',
    coalesce(feedback_text, 'Твоё домашнее задание было проверено.'),
    'success',
    jsonb_build_object('submission_id', submission_id, 'cohort_id', p_cohort_id)
  );
end;
$$;

create or replace function public.review_assignment_submission(
  submission_id uuid,
  feedback_text text default null,
  earned_points integer default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.review_assignment_submission('flow-1', submission_id, feedback_text, earned_points);
end;
$$;

create or replace function public.submit_expert_feedback(
  p_cohort_id text,
  student_email text,
  hw_number integer,
  feedback_text text,
  points_awarded integer
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  student_id uuid;
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  select au.id into student_id
  from auth.users au
  where au.email = student_email;

  if student_id is null then
    raise exception 'Студент с email % не найден', student_email;
  end if;

  if not exists (
    select 1
    from public.cohort_members cm
    where cm.cohort_id = p_cohort_id
      and cm.user_id = student_id
  ) then
    raise exception 'Student is not a member of this cohort';
  end if;

  insert into public.assignment_submissions (
    user_id,
    cohort_id,
    assignment_id,
    status,
    feedback,
    points_earned,
    submitted_at
  )
  values (
    student_id,
    p_cohort_id,
    hw_number,
    'reviewed',
    feedback_text,
    points_awarded,
    now()
  )
  on conflict (cohort_id, user_id, assignment_id)
  do update set
    status = 'reviewed',
    feedback = excluded.feedback,
    points_earned = excluded.points_earned;

  if coalesce(points_awarded, 0) <> 0 then
    perform public.increment_points(student_id, points_awarded, p_cohort_id);
  end if;
end;
$$;

create or replace function public.submit_expert_feedback(
  student_email text,
  hw_number integer,
  feedback_text text,
  points_awarded integer
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.submit_expert_feedback('flow-1', student_email, hw_number, feedback_text, points_awarded);
end;
$$;

-- Leaderboard and project voting.
create or replace function public.get_leaderboard(p_cohort_id text)
returns table (
  name text,
  points integer
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    coalesce(u.name, split_part(u.email, '@', 1))::text as name,
    coalesce(g.points, 0)::int as points
  from public.cohort_members cm
  join public.users u on u.id = cm.user_id
  left join public.gamification g
    on g.user_id = cm.user_id
   and g.cohort_id = cm.cohort_id
  where cm.cohort_id = p_cohort_id
    and cm.role = 'student'
    and public.can_access_cohort(p_cohort_id)
  order by coalesce(g.points, 0) desc, name asc;
$$;

create or replace function public.get_leaderboard()
returns table (
  name text,
  points integer
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select *
  from public.get_leaderboard('flow-1');
$$;

create or replace function public.get_students_for_voting(p_cohort_id text)
returns table (
  user_id uuid,
  name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    u.id,
    coalesce(u.name, split_part(u.email, '@', 1))::text
  from public.cohort_members cm
  join public.users u on u.id = cm.user_id
  where cm.cohort_id = p_cohort_id
    and cm.role = 'student'
    and u.id <> auth.uid()
  order by coalesce(u.name, split_part(u.email, '@', 1));
end;
$$;

create or replace function public.get_students_for_voting()
returns table (
  user_id uuid,
  name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select *
  from public.get_students_for_voting('flow-1');
end;
$$;

create or replace function public.submit_project_votes(
  p_cohort_id text,
  votes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_voter_id uuid := auth.uid();
  v_vote jsonb;
  v_votee_id uuid;
  v_score int;
  v_count int := 0;
begin
  if v_voter_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_can_access_cohort(p_cohort_id);

  if not exists (
    select 1
    from public.cohort_members cm
    where cm.cohort_id = p_cohort_id
      and cm.user_id = v_voter_id
      and cm.role = 'student'
  ) then
    raise exception 'Only cohort students can submit project votes';
  end if;

  for v_vote in select jsonb_array_elements(votes) loop
    v_votee_id := (v_vote ->> 'votee_id')::uuid;
    v_score := (v_vote ->> 'score')::int;

    if v_score < 0 or v_score > 10 then
      raise exception 'Invalid vote score';
    end if;

    if v_votee_id = v_voter_id then
      raise exception 'Cannot vote for yourself';
    end if;

    if not exists (
      select 1
      from public.cohort_members cm
      where cm.cohort_id = p_cohort_id
        and cm.user_id = v_votee_id
        and cm.role = 'student'
    ) then
      raise exception 'Votee is not a student in this cohort';
    end if;

    insert into public.project_votes (cohort_id, voter_id, votee_id, score)
    values (p_cohort_id, v_voter_id, v_votee_id, v_score)
    on conflict (cohort_id, voter_id, votee_id)
    do update set
      score = excluded.score,
      updated_at = now();

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('success', true, 'votes_submitted', v_count);
end;
$$;

create or replace function public.submit_project_votes(votes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return public.submit_project_votes('flow-1', votes);
end;
$$;

create or replace function public.get_my_project_votes(p_cohort_id text)
returns table (
  votee_id uuid,
  score integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select pv.votee_id, pv.score
  from public.project_votes pv
  where pv.voter_id = auth.uid()
    and pv.cohort_id = p_cohort_id;
end;
$$;

create or replace function public.get_my_project_votes()
returns table (
  votee_id uuid,
  score integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select *
  from public.get_my_project_votes('flow-1');
end;
$$;

create or replace function public.get_project_votes_results(p_cohort_id text)
returns table (
  user_id uuid,
  name text,
  email text,
  avg_score numeric,
  total_votes integer,
  min_score integer,
  max_score integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    u.id,
    u.name,
    u.email,
    round(avg(pv.score)::numeric, 1) as avg_score,
    count(pv.id)::int as total_votes,
    min(pv.score)::int as min_score,
    max(pv.score)::int as max_score
  from public.cohort_members cm
  join public.users u on u.id = cm.user_id
  left join public.project_votes pv
    on pv.votee_id = cm.user_id
   and pv.cohort_id = cm.cohort_id
  where cm.cohort_id = p_cohort_id
    and cm.role = 'student'
  group by u.id, u.name, u.email
  having count(pv.id) > 0
  order by avg_score desc nulls last, total_votes desc;
end;
$$;

create or replace function public.get_project_votes_results()
returns table (
  user_id uuid,
  name text,
  email text,
  avg_score numeric,
  total_votes integer,
  min_score integer,
  max_score integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select *
  from public.get_project_votes_results('flow-1');
end;
$$;

create or replace function public.get_final_course_ratings(p_cohort_id text)
returns table (
  user_id uuid,
  name text,
  email text,
  current_points integer,
  project_votes_sum integer,
  final_score numeric
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    u.id,
    u.name,
    u.email,
    coalesce(g.points, 0)::int as current_points,
    coalesce(sum(pv.score), 0)::int as project_votes_sum,
    round((coalesce(g.points, 0)::numeric * 1) + (coalesce(sum(pv.score), 0)::numeric * 0.7), 2) as final_score
  from public.cohort_members cm
  join public.users u on u.id = cm.user_id
  left join public.gamification g
    on g.user_id = cm.user_id
   and g.cohort_id = cm.cohort_id
  left join public.project_votes pv
    on pv.votee_id = cm.user_id
   and pv.cohort_id = cm.cohort_id
  where cm.cohort_id = p_cohort_id
    and cm.role = 'student'
  group by u.id, u.name, u.email, g.points
  order by final_score desc nulls last;
end;
$$;

create or replace function public.get_final_course_ratings()
returns table (
  user_id uuid,
  name text,
  email text,
  current_points integer,
  project_votes_sum integer,
  final_score numeric
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select *
  from public.get_final_course_ratings('flow-1');
end;
$$;

-- Grants. Client-callable functions remain executable by authenticated users
-- and enforce auth/role/cohort checks internally. Internal helpers and trigger
-- functions are not directly callable over REST.
revoke all on function public.assert_can_access_cohort(text) from public, anon, authenticated;
revoke all on function public.assert_admin_or_expert() from public, anon, authenticated;
revoke all on function public.award_badge(uuid, integer) from public, anon, authenticated;
revoke all on function public.award_badge(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.trigger_badge_on_progress() from public, anon, authenticated;
revoke all on function public.trigger_badge_on_submission() from public, anon, authenticated;
revoke all on function public.trigger_badge_on_launch() from public, anon, authenticated;
revoke all on function public.trigger_badge_on_peer_review() from public, anon, authenticated;

revoke all on function public.is_admin_or_expert() from public, anon;
revoke all on function public.can_access_cohort(text) from public, anon;
revoke all on function public.get_available_cohorts() from public, anon;
revoke all on function public.increment_points(uuid, integer) from public, anon;
revoke all on function public.increment_points(uuid, integer, text) from public, anon;
revoke all on function public.submit_student_assignment(integer, text, text, text, text) from public, anon;
revoke all on function public.submit_student_assignment(text, integer, text, text, text, text) from public, anon;
revoke all on function public.get_my_assignment_submissions() from public, anon;
revoke all on function public.get_my_assignment_submissions(text) from public, anon;
revoke all on function public.get_my_notifications() from public, anon;
revoke all on function public.get_my_notifications(text) from public, anon;
revoke all on function public.get_assignment_submissions_feed() from public, anon;
revoke all on function public.get_assignment_submissions_feed(text) from public, anon;
revoke all on function public.review_assignment_submission(uuid, text, integer) from public, anon;
revoke all on function public.review_assignment_submission(text, uuid, text, integer) from public, anon;
revoke all on function public.submit_expert_feedback(text, integer, text, integer) from public, anon;
revoke all on function public.submit_expert_feedback(text, text, integer, text, integer) from public, anon;
revoke all on function public.get_leaderboard() from public, anon;
revoke all on function public.get_leaderboard(text) from public, anon;
revoke all on function public.get_students_for_voting() from public, anon;
revoke all on function public.get_students_for_voting(text) from public, anon;
revoke all on function public.submit_project_votes(jsonb) from public, anon;
revoke all on function public.submit_project_votes(text, jsonb) from public, anon;
revoke all on function public.get_my_project_votes() from public, anon;
revoke all on function public.get_my_project_votes(text) from public, anon;
revoke all on function public.get_project_votes_results() from public, anon;
revoke all on function public.get_project_votes_results(text) from public, anon;
revoke all on function public.get_final_course_ratings() from public, anon;
revoke all on function public.get_final_course_ratings(text) from public, anon;

grant execute on function public.is_admin_or_expert() to authenticated;
grant execute on function public.can_access_cohort(text) to authenticated;
grant execute on function public.get_available_cohorts() to authenticated;
grant execute on function public.increment_points(uuid, integer) to authenticated;
grant execute on function public.increment_points(uuid, integer, text) to authenticated;
grant execute on function public.submit_student_assignment(integer, text, text, text, text) to authenticated;
grant execute on function public.submit_student_assignment(text, integer, text, text, text, text) to authenticated;
grant execute on function public.get_my_assignment_submissions() to authenticated;
grant execute on function public.get_my_assignment_submissions(text) to authenticated;
grant execute on function public.get_my_notifications() to authenticated;
grant execute on function public.get_my_notifications(text) to authenticated;
grant execute on function public.get_assignment_submissions_feed() to authenticated;
grant execute on function public.get_assignment_submissions_feed(text) to authenticated;
grant execute on function public.review_assignment_submission(uuid, text, integer) to authenticated;
grant execute on function public.review_assignment_submission(text, uuid, text, integer) to authenticated;
grant execute on function public.submit_expert_feedback(text, integer, text, integer) to authenticated;
grant execute on function public.submit_expert_feedback(text, text, integer, text, integer) to authenticated;
grant execute on function public.get_leaderboard() to authenticated;
grant execute on function public.get_leaderboard(text) to authenticated;
grant execute on function public.get_students_for_voting() to authenticated;
grant execute on function public.get_students_for_voting(text) to authenticated;
grant execute on function public.submit_project_votes(jsonb) to authenticated;
grant execute on function public.submit_project_votes(text, jsonb) to authenticated;
grant execute on function public.get_my_project_votes() to authenticated;
grant execute on function public.get_my_project_votes(text) to authenticated;
grant execute on function public.get_project_votes_results() to authenticated;
grant execute on function public.get_project_votes_results(text) to authenticated;
grant execute on function public.get_final_course_ratings() to authenticated;
grant execute on function public.get_final_course_ratings(text) to authenticated;
