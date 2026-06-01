-- Журнал заходов на платформу.
-- Одна строка на пользователя в день (unique по user_id + visit_date),
-- поэтому повторные заходы в тот же день не плодят записей.
-- Используется для авто-метрики «Заходов на неделе» на странице прогресса.

create table if not exists platform_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  visit_date date not null default current_date,
  week_number int not null,
  created_at timestamptz default now(),
  unique (user_id, visit_date)
);

create index if not exists idx_platform_visits_user on platform_visits (user_id);
