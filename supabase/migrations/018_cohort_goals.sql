-- Цели участников в разрезе потока.
--
-- До этого цели первого потока лежали захардкоженным файлом в коде и
-- показывались всем потокам сразу. Теперь это данные: у каждого участника
-- своя цель в своём потоке, вносит её либо он сам, либо преподаватель
-- по итогам встречи.
--
-- Доступ только через RPC, как и остальные студенческие данные:
-- прямых политик для клиента нет, RLS закрывает таблицу целиком.

create table if not exists cohort_goals (
  cohort_id   text not null references cohorts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- Главная цель на буткемп, от первого лица.
  main_goal   text not null default '',
  -- Чем человек занимается: роль, домен. Нужен, чтобы цель читалась со стороны.
  context     text not null default '',
  -- Цели по неделям: [{ "week": 1, "text": "...", "status": "done" }]
  weekly      jsonb not null default '[]'::jsonb,
  -- Откуда взялась запись: сам участник или разбор встречи.
  source      text not null default 'self' check (source in ('self', 'transcript')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  primary key (cohort_id, user_id)
);

alter table cohort_goals enable row level security;

-- Цели своего потока видят его участники: цель проговаривается публично,
-- это часть программы. Чужой поток не видит ничего.
create or replace function get_cohort_goals(p_cohort_id text)
returns table (
  user_id    uuid,
  name       text,
  context    text,
  main_goal  text,
  weekly     jsonb,
  source     text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path to 'public', 'auth'
as $$
  select g.user_id,
         coalesce(u.name, au.email) as name,
         g.context,
         g.main_goal,
         g.weekly,
         g.source,
         g.updated_at
  from cohort_goals g
  join auth.users au on au.id = g.user_id
  left join public.users u on u.id = g.user_id
  where g.cohort_id = p_cohort_id
    and public.can_access_cohort(p_cohort_id)
    and (g.main_goal <> '' or jsonb_array_length(g.weekly) > 0)
  order by coalesce(u.name, au.email);
$$;

-- Свою цель участник пишет сам.
create or replace function set_my_goal(
  p_cohort_id text,
  p_main_goal text,
  p_context   text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.assert_can_access_cohort(p_cohort_id);

  insert into cohort_goals (cohort_id, user_id, main_goal, context, source, updated_by)
  values (
    p_cohort_id,
    v_user_id,
    coalesce(btrim(p_main_goal), ''),
    coalesce(btrim(p_context), ''),
    'self',
    v_user_id
  )
  on conflict (cohort_id, user_id) do update set
    main_goal  = excluded.main_goal,
    context    = case when p_context is null then cohort_goals.context else excluded.context end,
    source     = 'self',
    updated_at = now(),
    updated_by = v_user_id;
end;
$$;

-- Преподаватель вносит цели по итогам встречи, в том числе понедельные.
create or replace function admin_set_student_goal(
  p_cohort_id text,
  p_user_id   uuid,
  p_main_goal text,
  p_context   text default null,
  p_weekly    jsonb default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  insert into cohort_goals (cohort_id, user_id, main_goal, context, weekly, source, updated_by)
  values (
    p_cohort_id,
    p_user_id,
    coalesce(btrim(p_main_goal), ''),
    coalesce(btrim(p_context), ''),
    coalesce(p_weekly, '[]'::jsonb),
    'transcript',
    auth.uid()
  )
  on conflict (cohort_id, user_id) do update set
    main_goal  = excluded.main_goal,
    context    = case when p_context is null then cohort_goals.context else excluded.context end,
    weekly     = case when p_weekly  is null then cohort_goals.weekly  else excluded.weekly  end,
    source     = 'transcript',
    updated_at = now(),
    updated_by = auth.uid();
end;
$$;

grant execute on function get_cohort_goals(text) to authenticated;
grant execute on function set_my_goal(text, text, text) to authenticated;
grant execute on function admin_set_student_goal(text, uuid, text, text, jsonb) to authenticated;
