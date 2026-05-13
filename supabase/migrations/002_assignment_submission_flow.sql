alter table assignment_submissions
  add column if not exists live_url text,
  add column if not exists artifact text,
  add column if not exists feedback text,
  add column if not exists points_earned int;

create table if not exists user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  kind text default 'info',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_user_notifications_user_created_at
  on user_notifications(user_id, created_at desc);

create or replace function submit_student_assignment(
  hw_number int,
  github_link text default null,
  video_link text default null,
  live_link text default null,
  artifact_text text default null
) returns void as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into assignment_submissions (
    user_id,
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
    hw_number,
    nullif(btrim(github_link), ''),
    nullif(btrim(video_link), ''),
    nullif(btrim(live_link), ''),
    nullif(btrim(artifact_text), ''),
    'submitted',
    now()
  )
  on conflict (user_id, assignment_id)
  do update set
    github_url = excluded.github_url,
    video_url = excluded.video_url,
    live_url = excluded.live_url,
    artifact = excluded.artifact,
    status = 'submitted',
    submitted_at = excluded.submitted_at;

  insert into user_notifications (user_id, title, body, kind, metadata)
  values (
    current_user_id,
    'Домашнее задание отправлено',
    format(
      'Вы сдали ДЗ %s. Ссылки уже доступны в панели администратора.',
      hw_number
    ),
    'assignment_submitted',
    jsonb_build_object('hw_number', hw_number)
  );
end;
$$ language plpgsql security definer set search_path = public, auth;

create or replace function get_my_assignment_submissions()
returns table (
  assignment_id int,
  status text,
  github_url text,
  video_url text,
  live_url text,
  artifact text,
  submitted_at timestamptz
) as $$
begin
  return query
  select
    s.assignment_id,
    s.status,
    s.github_url,
    s.video_url,
    s.live_url,
    s.artifact,
    s.submitted_at
  from assignment_submissions s
  where s.user_id = auth.uid()
  order by s.assignment_id;
end;
$$ language plpgsql security definer set search_path = public, auth;

create or replace function get_my_notifications()
returns table (
  id uuid,
  title text,
  body text,
  created_at timestamptz
) as $$
begin
  return query
  select
    n.id,
    n.title,
    n.body,
    n.created_at
  from user_notifications n
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit 5;
end;
$$ language plpgsql security definer set search_path = public, auth;

create or replace function get_assignment_submissions_feed()
returns table (
  id uuid,
  hw_number int,
  student_name text,
  student_email text,
  github_url text,
  video_url text,
  live_url text,
  artifact text,
  status text,
  submitted_at timestamptz
) as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') not in ('admin', 'expert') then
    raise exception 'Forbidden';
  end if;

  return query
  select
    s.id,
    s.assignment_id,
    coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)) as student_name,
    u.email as student_email,
    s.github_url,
    s.video_url,
    s.live_url,
    s.artifact,
    s.status,
    s.submitted_at
  from assignment_submissions s
  join auth.users u on u.id = s.user_id
  where s.status in ('submitted', 'reviewed')
  order by s.submitted_at desc nulls last, s.assignment_id asc;
end;
$$ language plpgsql security definer set search_path = public, auth;
