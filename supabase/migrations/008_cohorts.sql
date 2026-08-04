-- Multi-cohort LMS foundation.
--
-- Stage 1 is intentionally additive:
-- - create cohort and cohort settings tables;
-- - add cohort_id columns with a flow-1 default/backfill;
-- - add cohort-aware indexes;
-- - add minimal helper functions and RLS for the new cohort tables.
--
-- Existing RPC and old unique constraints are not removed here. The current
-- client RPC still relies on old on conflict targets such as (user_id,
-- assignment_id). Drop those old constraints only in the Stage 2 RPC/security
-- migration, together with cohort-aware RPC replacements.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'materials'
      and column_name = 'id'
      and data_type = 'integer'
  ) then
    raise exception '008_cohorts requires production schema: public.materials.id must be integer';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'materials'
      and column_name = 'url'
  ) then
    raise exception '008_cohorts requires production schema: public.materials.url must exist';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'student_progress'
      and column_name = 'lesson_id'
      and data_type = 'uuid'
  ) then
    raise exception '008_cohorts requires production schema: public.student_progress.lesson_id must be uuid';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assignment_submissions'
      and column_name = 'assignment_id'
      and data_type = 'integer'
  ) then
    raise exception '008_cohorts requires production schema: public.assignment_submissions.assignment_id must be integer';
  end if;
end $$;

create table if not exists public.cohorts (
  id text primary key,
  name text not null,
  starts_at date,
  ends_at date,
  is_active boolean not null default true,
  is_visible_to_students boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  check (id ~ '^[a-z0-9][a-z0-9-]*$')
);

insert into public.cohorts (
  id,
  name,
  starts_at,
  is_visible_to_students,
  display_order
) values
  ('flow-1', 'Flow 1', date '2026-05-12', true, 1),
  ('flow-2', 'Flow 2', null, false, 2)
on conflict (id) do update set
  name = excluded.name,
  starts_at = coalesce(public.cohorts.starts_at, excluded.starts_at),
  is_active = true,
  display_order = excluded.display_order;

create table if not exists public.cohort_members (
  cohort_id text not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student',
  created_at timestamptz not null default now(),
  primary key (cohort_id, user_id),
  check (role in ('student', 'expert', 'admin'))
);

create index if not exists idx_cohort_members_user_id
  on public.cohort_members(user_id);

create index if not exists idx_cohort_members_role
  on public.cohort_members(role);

create table if not exists public.cohort_lesson_settings (
  cohort_id text not null references public.cohorts(id) on delete cascade,
  lesson_number int not null,
  video_url text,
  is_released boolean not null default false,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (cohort_id, lesson_number),
  check (lesson_number > 0)
);

create table if not exists public.cohort_material_settings (
  cohort_id text not null references public.cohorts(id) on delete cascade,
  material_id int not null references public.materials(id) on delete cascade,
  is_visible boolean not null default false,
  url text,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (cohort_id, material_id)
);

create index if not exists idx_cohort_material_settings_material_id
  on public.cohort_material_settings(material_id);

create table if not exists public.cohort_lesson_schedule (
  cohort_id text not null references public.cohorts(id) on delete cascade,
  lesson_number int not null,
  lesson_date date,
  starts_at timestamptz,
  title_override text,
  topic_override text,
  is_released boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (cohort_id, lesson_number),
  check (lesson_number > 0)
);

create table if not exists public.cohort_assignment_schedule (
  cohort_id text not null references public.cohorts(id) on delete cascade,
  hw_number int not null,
  deadline timestamptz,
  is_released boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (cohort_id, hw_number),
  check (hw_number > 0)
);

-- Membership backfill. auth.users is the identity source; public.users is only
-- profile/display data and may lag behind auth.users.
insert into public.cohort_members (cohort_id, user_id, role)
select
  'flow-1',
  au.id,
  case
    when coalesce(au.raw_app_meta_data ->> 'role', '') in ('admin', 'expert')
      then au.raw_app_meta_data ->> 'role'
    else 'student'
  end
from auth.users au
on conflict (cohort_id, user_id) do update set
  role = excluded.role;

insert into public.cohort_members (cohort_id, user_id, role)
select
  'flow-2',
  au.id,
  au.raw_app_meta_data ->> 'role'
from auth.users au
where coalesce(au.raw_app_meta_data ->> 'role', '') in ('admin', 'expert')
on conflict (cohort_id, user_id) do update set
  role = excluded.role;

-- Flow-1 inherits current content visibility. Flow-2 starts hidden/empty.
insert into public.cohort_lesson_settings (
  cohort_id,
  lesson_number,
  video_url,
  is_released,
  released_at
)
select
  'flow-1',
  l.lesson_number,
  nullif(btrim(coalesce(l.video_url, '')), ''),
  true,
  coalesce(l.lesson_date::timestamptz, now())
from public.lessons l
on conflict (cohort_id, lesson_number) do update set
  video_url = excluded.video_url,
  is_released = true,
  released_at = coalesce(public.cohort_lesson_settings.released_at, excluded.released_at);

insert into public.cohort_lesson_settings (
  cohort_id,
  lesson_number,
  video_url,
  is_released
)
select
  'flow-2',
  l.lesson_number,
  null,
  false
from public.lessons l
on conflict (cohort_id, lesson_number) do nothing;

insert into public.cohort_material_settings (
  cohort_id,
  material_id,
  is_visible,
  url,
  released_at
)
select
  'flow-1',
  m.id,
  true,
  nullif(btrim(coalesce(m.url, '')), ''),
  now()
from public.materials m
on conflict (cohort_id, material_id) do update set
  is_visible = true,
  url = excluded.url,
  released_at = coalesce(public.cohort_material_settings.released_at, excluded.released_at);

insert into public.cohort_material_settings (
  cohort_id,
  material_id,
  is_visible,
  url
)
select
  'flow-2',
  m.id,
  false,
  null
from public.materials m
on conflict (cohort_id, material_id) do nothing;

insert into public.cohort_lesson_schedule (
  cohort_id,
  lesson_number,
  lesson_date,
  starts_at,
  title_override,
  topic_override,
  is_released
)
select
  'flow-1',
  l.lesson_number,
  l.lesson_date,
  case
    when l.lesson_date is null then null
    when l.lesson_number in (1, 3, 5, 7, 9, 11)
      then (l.lesson_date + time '14:30') at time zone 'Europe/Moscow'
    else (l.lesson_date + time '18:00') at time zone 'Europe/Moscow'
  end,
  l.title,
  l.topic,
  true
from public.lessons l
on conflict (cohort_id, lesson_number) do update set
  lesson_date = excluded.lesson_date,
  starts_at = excluded.starts_at,
  title_override = excluded.title_override,
  topic_override = excluded.topic_override,
  is_released = true;

insert into public.cohort_lesson_schedule (
  cohort_id,
  lesson_number,
  lesson_date,
  starts_at,
  title_override,
  topic_override,
  is_released
)
select
  'flow-2',
  l.lesson_number,
  null,
  null,
  l.title,
  l.topic,
  false
from public.lessons l
on conflict (cohort_id, lesson_number) do nothing;

insert into public.cohort_assignment_schedule (
  cohort_id,
  hw_number,
  deadline,
  is_released
) values
  ('flow-1', 1, '2026-05-17 23:59:00+03'::timestamptz, true),
  ('flow-1', 2, '2026-05-24 23:59:00+03'::timestamptz, true),
  ('flow-1', 3, '2026-05-31 23:59:00+03'::timestamptz, true),
  ('flow-1', 4, '2026-06-07 23:59:00+03'::timestamptz, true),
  ('flow-1', 5, '2026-06-14 23:59:00+03'::timestamptz, true),
  ('flow-1', 6, '2026-06-21 23:59:00+03'::timestamptz, true)
on conflict (cohort_id, hw_number) do update set
  deadline = excluded.deadline,
  is_released = true;

insert into public.cohort_assignment_schedule (
  cohort_id,
  hw_number,
  deadline,
  is_released
) values
  ('flow-2', 1, null, false),
  ('flow-2', 2, null, false),
  ('flow-2', 3, null, false),
  ('flow-2', 4, null, false),
  ('flow-2', 5, null, false),
  ('flow-2', 6, null, false)
on conflict (cohort_id, hw_number) do nothing;

-- Add cohort_id to personal/user-generated tables. The default preserves all
-- existing client calls as flow-1 until Stage 2 RPC updates pass p_cohort_id.
alter table public.student_progress
  add column if not exists cohort_id text;

alter table public.assignment_submissions
  add column if not exists cohort_id text;

alter table public.gamification
  add column if not exists cohort_id text;

alter table public.agent_launches
  add column if not exists cohort_id text;

alter table public.platform_visits
  add column if not exists cohort_id text;

alter table public.project_votes
  add column if not exists cohort_id text;

alter table public.peer_reviews
  add column if not exists cohort_id text;

alter table public.user_notifications
  add column if not exists cohort_id text;

update public.student_progress
set cohort_id = 'flow-1'
where cohort_id is null;

update public.assignment_submissions
set cohort_id = 'flow-1'
where cohort_id is null;

update public.gamification
set cohort_id = 'flow-1'
where cohort_id is null;

update public.agent_launches
set cohort_id = 'flow-1'
where cohort_id is null;

update public.platform_visits
set cohort_id = 'flow-1'
where cohort_id is null;

update public.project_votes
set cohort_id = 'flow-1'
where cohort_id is null;

update public.peer_reviews pr
set cohort_id = coalesce(s.cohort_id, 'flow-1')
from public.assignment_submissions s
where pr.submission_id = s.id
  and pr.cohort_id is null;

update public.peer_reviews
set cohort_id = 'flow-1'
where cohort_id is null;

update public.user_notifications
set cohort_id = 'flow-1'
where cohort_id is null;

alter table public.student_progress
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

alter table public.assignment_submissions
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

alter table public.gamification
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

alter table public.agent_launches
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

alter table public.platform_visits
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

alter table public.project_votes
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

alter table public.peer_reviews
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

alter table public.user_notifications
  alter column cohort_id set default 'flow-1',
  alter column cohort_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.student_progress'::regclass
      and conname = 'student_progress_cohort_id_fkey'
  ) then
    alter table public.student_progress
      add constraint student_progress_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.assignment_submissions'::regclass
      and conname = 'assignment_submissions_cohort_id_fkey'
  ) then
    alter table public.assignment_submissions
      add constraint assignment_submissions_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.gamification'::regclass
      and conname = 'gamification_cohort_id_fkey'
  ) then
    alter table public.gamification
      add constraint gamification_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.agent_launches'::regclass
      and conname = 'agent_launches_cohort_id_fkey'
  ) then
    alter table public.agent_launches
      add constraint agent_launches_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.platform_visits'::regclass
      and conname = 'platform_visits_cohort_id_fkey'
  ) then
    alter table public.platform_visits
      add constraint platform_visits_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.project_votes'::regclass
      and conname = 'project_votes_cohort_id_fkey'
  ) then
    alter table public.project_votes
      add constraint project_votes_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.peer_reviews'::regclass
      and conname = 'peer_reviews_cohort_id_fkey'
  ) then
    alter table public.peer_reviews
      add constraint peer_reviews_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_notifications'::regclass
      and conname = 'user_notifications_cohort_id_fkey'
  ) then
    alter table public.user_notifications
      add constraint user_notifications_cohort_id_fkey
      foreign key (cohort_id) references public.cohorts(id);
  end if;
end $$;

-- Cohort-aware indexes. Unique indexes are added now, but old unique
-- constraints are kept until Stage 2 RPCs use cohort-aware on conflict targets.
create unique index if not exists idx_student_progress_cohort_user_lesson_unique
  on public.student_progress(cohort_id, user_id, lesson_id);

create index if not exists idx_student_progress_cohort_user
  on public.student_progress(cohort_id, user_id);

create index if not exists idx_student_progress_lesson_id
  on public.student_progress(lesson_id);

create unique index if not exists idx_assignment_submissions_cohort_user_assignment_unique
  on public.assignment_submissions(cohort_id, user_id, assignment_id);

create index if not exists idx_assignment_submissions_cohort_status_submitted
  on public.assignment_submissions(cohort_id, status, submitted_at desc);

create unique index if not exists idx_gamification_cohort_user_unique
  on public.gamification(cohort_id, user_id);

create index if not exists idx_gamification_cohort_points
  on public.gamification(cohort_id, points desc);

create index if not exists idx_agent_launches_user_id
  on public.agent_launches(user_id);

create index if not exists idx_agent_launches_cohort_user_week
  on public.agent_launches(cohort_id, user_id, week_number);

create unique index if not exists idx_platform_visits_cohort_user_visit_unique
  on public.platform_visits(cohort_id, user_id, visit_date);

create index if not exists idx_platform_visits_cohort_week
  on public.platform_visits(cohort_id, week_number);

create index if not exists idx_peer_reviews_reviewer_id
  on public.peer_reviews(reviewer_id);

create index if not exists idx_peer_reviews_submission_id
  on public.peer_reviews(submission_id);

create index if not exists idx_peer_reviews_cohort_reviewer
  on public.peer_reviews(cohort_id, reviewer_id);

create index if not exists idx_peer_reviews_cohort_submission
  on public.peer_reviews(cohort_id, submission_id);

create unique index if not exists idx_project_votes_cohort_voter_votee_unique
  on public.project_votes(cohort_id, voter_id, votee_id);

create index if not exists idx_project_votes_cohort_voter
  on public.project_votes(cohort_id, voter_id);

create index if not exists idx_project_votes_cohort_votee
  on public.project_votes(cohort_id, votee_id);

create index if not exists idx_user_notifications_cohort_user_created
  on public.user_notifications(cohort_id, user_id, created_at desc);

-- Minimal cohort helpers used by new table policies and future frontend
-- context. Existing feature RPC will be replaced in Stage 2.
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

revoke all on function public.is_admin_or_expert() from public;
revoke all on function public.can_access_cohort(text) from public;
revoke all on function public.get_available_cohorts() from public;
revoke all on function public.is_admin_or_expert() from anon;
revoke all on function public.can_access_cohort(text) from anon;
revoke all on function public.get_available_cohorts() from anon;

grant execute on function public.is_admin_or_expert() to authenticated;
grant execute on function public.can_access_cohort(text) to authenticated;
grant execute on function public.get_available_cohorts() to authenticated;

alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.cohort_lesson_settings enable row level security;
alter table public.cohort_material_settings enable row level security;
alter table public.cohort_lesson_schedule enable row level security;
alter table public.cohort_assignment_schedule enable row level security;

drop policy if exists cohorts_select_accessible on public.cohorts;
create policy cohorts_select_accessible
  on public.cohorts
  for select
  to authenticated
  using (public.can_access_cohort(id));

drop policy if exists cohorts_admin_all on public.cohorts;
create policy cohorts_admin_all
  on public.cohorts
  for all
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_members_select_self_or_admin on public.cohort_members;
create policy cohort_members_select_self_or_admin
  on public.cohort_members
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin_or_expert());

drop policy if exists cohort_members_admin_all on public.cohort_members;
create policy cohort_members_admin_all
  on public.cohort_members
  for all
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_lesson_settings_select_accessible on public.cohort_lesson_settings;
create policy cohort_lesson_settings_select_accessible
  on public.cohort_lesson_settings
  for select
  to authenticated
  using (
    public.can_access_cohort(cohort_id)
    and (is_released or public.is_admin_or_expert())
  );

drop policy if exists cohort_lesson_settings_admin_all on public.cohort_lesson_settings;
create policy cohort_lesson_settings_admin_all
  on public.cohort_lesson_settings
  for all
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_material_settings_select_accessible on public.cohort_material_settings;
create policy cohort_material_settings_select_accessible
  on public.cohort_material_settings
  for select
  to authenticated
  using (
    public.can_access_cohort(cohort_id)
    and (is_visible or public.is_admin_or_expert())
  );

drop policy if exists cohort_material_settings_admin_all on public.cohort_material_settings;
create policy cohort_material_settings_admin_all
  on public.cohort_material_settings
  for all
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_lesson_schedule_select_accessible on public.cohort_lesson_schedule;
create policy cohort_lesson_schedule_select_accessible
  on public.cohort_lesson_schedule
  for select
  to authenticated
  using (
    public.can_access_cohort(cohort_id)
    and (is_released or public.is_admin_or_expert())
  );

drop policy if exists cohort_lesson_schedule_admin_all on public.cohort_lesson_schedule;
create policy cohort_lesson_schedule_admin_all
  on public.cohort_lesson_schedule
  for all
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

drop policy if exists cohort_assignment_schedule_select_accessible on public.cohort_assignment_schedule;
create policy cohort_assignment_schedule_select_accessible
  on public.cohort_assignment_schedule
  for select
  to authenticated
  using (
    public.can_access_cohort(cohort_id)
    and (is_released or public.is_admin_or_expert())
  );

drop policy if exists cohort_assignment_schedule_admin_all on public.cohort_assignment_schedule;
create policy cohort_assignment_schedule_admin_all
  on public.cohort_assignment_schedule
  for all
  to authenticated
  using (public.is_admin_or_expert())
  with check (public.is_admin_or_expert());

grant select, insert, update, delete on
  public.cohorts,
  public.cohort_members,
  public.cohort_lesson_settings,
  public.cohort_material_settings,
  public.cohort_lesson_schedule,
  public.cohort_assignment_schedule
to authenticated;
