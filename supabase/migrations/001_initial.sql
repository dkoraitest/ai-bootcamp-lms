create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  week int not null,
  lesson_number int not null,
  title text not null,
  topic text not null,
  has_homework boolean default false,
  video_url text,
  lesson_date date not null
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  title text not null,
  type text check (type in ('video','template','technique','resource')) not null,
  content_url text,
  markdown_content text,
  week int not null
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  title text not null,
  description text not null,
  checklist jsonb default '{}',
  rubric jsonb default '{}',
  deadline timestamptz,
  hw_number int not null
);

create table student_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  status text check (status in ('not_started','watching','completed')) default 'not_started',
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

create table assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  github_url text,
  video_url text,
  status text check (status in ('not_started','in_progress','submitted','reviewed')) default 'not_started',
  submitted_at timestamptz,
  unique(user_id, assignment_id)
);

create table agent_launches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  launched_at timestamptz default now(),
  week_number int not null
);

create table gamification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  points int default 0,
  level int default 1,
  badges jsonb default '[]',
  quests jsonb default '[]'
);

create table peer_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid references users(id) on delete cascade,
  submission_id uuid references assignment_submissions(id) on delete cascade,
  checklist_scores jsonb default '{}',
  comment text,
  created_at timestamptz default now()
);
