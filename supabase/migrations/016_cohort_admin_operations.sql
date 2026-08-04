-- Cohort administration layer.
--
-- Дополняет 008-015: там сделана изоляция потоков, здесь появляется
-- управление ими из интерфейса, без ручного SQL.
--
-- Что добавляется:
-- - целевой поток для новых регистраций (is_enrolling) вместо жёсткого 'flow-1';
-- - telegram в профиле;
-- - админские RPC: потоки, участники, расписание, роли.
--
-- Миграция идемпотентна и ничего не удаляет из предыдущих этапов.

do $$
begin
  if to_regclass('public.cohorts') is null or to_regclass('public.cohort_members') is null then
    raise exception '016 requires 008_cohorts.sql to be applied first';
  end if;
end $$;

-- ============================================================
-- 1. Целевой поток регистрации и профиль
-- ============================================================

alter table public.cohorts
  add column if not exists is_enrolling boolean not null default false;

comment on column public.cohorts.is_enrolling is
  'Поток, в который попадают новые регистрации. Одновременно открыт максимум один.';

-- Ровно один поток может принимать регистрации: иначе новый участник
-- однажды уедет не туда, и заметить это будет тяжело.
create unique index if not exists idx_cohorts_single_enrolling
  on public.cohorts (is_enrolling) where is_enrolling;

alter table public.users
  add column if not exists telegram text;

-- ============================================================
-- 2. Регистрация: поток берётся из флага, а не из строки в коде
-- ============================================================

create or replace function public.handle_new_auth_user_cohort()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_cohort text;
begin
  select c.id into v_cohort
  from public.cohorts c
  where c.is_enrolling and c.is_active
  limit 1;

  -- Обход для владельца: select set_config('app.bypass_registration_guard','on',true);
  if v_cohort is null then
    if coalesce(current_setting('app.bypass_registration_guard', true), 'off') = 'on' then
      select c.id into v_cohort
      from public.cohorts c
      where c.is_active
      order by c.display_order desc
      limit 1;
    else
      raise exception 'registration_closed';
    end if;
  end if;

  insert into public.users (id, email, name, telegram)
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'telegram'), '')
  )
  on conflict (id) do update
    set email    = excluded.email,
        name     = coalesce(excluded.name, public.users.name),
        telegram = coalesce(excluded.telegram, public.users.telegram);

  insert into public.cohort_members (cohort_id, user_id, role)
  values (v_cohort, new.id, 'student')
  on conflict (cohort_id, user_id) do nothing;

  insert into public.gamification (user_id, cohort_id, points, level, badges, quests)
  values (
    new.id,
    v_cohort,
    0,
    1,
    '[]'::jsonb,
    jsonb_build_array(
      jsonb_build_object('id', 1, 'name', 'Первая неделя', 'progress', 0, 'total', 3, 'completed', false),
      jsonb_build_object('id', 2, 'name', 'Кодер-агент', 'progress', 0, 'total', 3, 'completed', false),
      jsonb_build_object('id', 3, 'name', 'Строитель ОС', 'progress', 0, 'total', 3, 'completed', false),
      jsonb_build_object('id', 4, 'name', 'Агент 5/5', 'progress', 0, 'total', 5, 'completed', false)
    )
  )
  on conflict (cohort_id, user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user_cohort() from public, anon, authenticated;

-- Статус набора для страницы регистрации: единственная функция,
-- доступная неавторизованному посетителю.
create or replace function public.get_registration_status()
returns table (cohort_id text, cohort_name text, starts_at date, is_open boolean)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.starts_at, true
  from public.cohorts c
  where c.is_enrolling and c.is_active
  limit 1
$$;

revoke execute on function public.get_registration_status() from public;
grant execute on function public.get_registration_status() to anon, authenticated;

-- ============================================================
-- 3. Потоки: обзор и управление
-- ============================================================

create or replace function public.admin_cohort_overview()
returns table (
  id text,
  name text,
  starts_at date,
  ends_at date,
  is_active boolean,
  is_visible_to_students boolean,
  is_enrolling boolean,
  display_order int,
  students int,
  pending_reviews int,
  lessons_scheduled int,
  next_lesson_date date
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();

  return query
  select
    c.id,
    c.name,
    c.starts_at,
    c.ends_at,
    c.is_active,
    c.is_visible_to_students,
    c.is_enrolling,
    c.display_order,
    (select count(*)::int from public.cohort_members cm
      where cm.cohort_id = c.id and cm.role = 'student'),
    (select count(*)::int from public.assignment_submissions s
      where s.cohort_id = c.id and s.status = 'submitted'),
    (select count(*)::int from public.cohort_lesson_schedule cls
      where cls.cohort_id = c.id and cls.lesson_date is not null),
    (select min(cls.lesson_date) from public.cohort_lesson_schedule cls
      where cls.cohort_id = c.id and cls.lesson_date >= current_date)
  from public.cohorts c
  order by c.display_order, c.id;
end;
$$;

create or replace function public.admin_create_cohort(
  p_id text,
  p_name text,
  p_starts_at date default null,
  p_ends_at date default null
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_order int;
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  if p_id !~ '^[a-z0-9][a-z0-9-]*$' then
    raise exception 'bad_cohort_id';
  end if;

  select coalesce(max(display_order), 0) + 1 into v_order from public.cohorts;

  insert into public.cohorts (id, name, starts_at, ends_at, display_order, is_visible_to_students)
  values (p_id, p_name, p_starts_at, p_ends_at, v_order, false);

  -- Админы и эксперты получают доступ к новому потоку сразу.
  insert into public.cohort_members (cohort_id, user_id, role)
  select p_id, au.id, au.raw_app_meta_data ->> 'role'
  from auth.users au
  where coalesce(au.raw_app_meta_data ->> 'role', '') in ('admin', 'expert')
  on conflict (cohort_id, user_id) do nothing;

  return p_id;
end;
$$;

create or replace function public.admin_update_cohort(
  p_cohort_id text,
  p_name text default null,
  p_starts_at date default null,
  p_ends_at date default null,
  p_is_visible_to_students boolean default null,
  p_is_enrolling boolean default null,
  p_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  -- Набор открывается только у одного потока: снимаем флаг с остальных.
  if p_is_enrolling then
    update public.cohorts set is_enrolling = false where is_enrolling and id <> p_cohort_id;
  end if;

  update public.cohorts
  set
    name                   = coalesce(p_name, name),
    starts_at              = coalesce(p_starts_at, starts_at),
    ends_at                = coalesce(p_ends_at, ends_at),
    is_visible_to_students = coalesce(p_is_visible_to_students, is_visible_to_students),
    is_enrolling           = coalesce(p_is_enrolling, is_enrolling),
    is_active              = coalesce(p_is_active, is_active)
  where id = p_cohort_id;
end;
$$;

-- ============================================================
-- 4. Участники
-- ============================================================

create or replace function public.admin_cohort_members(p_cohort_id text)
returns table (
  user_id uuid,
  name text,
  email text,
  telegram text,
  cohort_role text,
  global_role text,
  joined_at timestamptz,
  lessons_done int,
  hw_submitted int,
  hw_reviewed int,
  points int,
  last_visit date
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  return query
  select
    cm.user_id,
    coalesce(nullif(btrim(u.name), ''), au.email),
    au.email,
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

create or replace function public.admin_move_member(
  p_user_id uuid,
  p_from_cohort text,
  p_to_cohort text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_role text;
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  select role into v_role from public.cohort_members
  where cohort_id = p_from_cohort and user_id = p_user_id;

  if v_role is null then
    raise exception 'member_not_found';
  end if;

  insert into public.cohort_members (cohort_id, user_id, role)
  values (p_to_cohort, p_user_id, v_role)
  on conflict (cohort_id, user_id) do nothing;

  insert into public.gamification (user_id, cohort_id, points, level, badges, quests)
  values (p_user_id, p_to_cohort, 0, 1, '[]'::jsonb, '[]'::jsonb)
  on conflict (cohort_id, user_id) do nothing;

  -- Прогресс и баллы остаются в исходном потоке: они к нему и относятся.
  delete from public.cohort_members
  where cohort_id = p_from_cohort and user_id = p_user_id;
end;
$$;

create or replace function public.admin_remove_member(p_cohort_id text, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  -- Удаляется только доступ к потоку. Прогресс и сдачи сохраняются,
  -- чтобы исключение по ошибке можно было откатить.
  delete from public.cohort_members
  where cohort_id = p_cohort_id and user_id = p_user_id;
end;
$$;

create or replace function public.admin_set_global_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  if p_role not in ('student', 'expert', 'admin') then
    raise exception 'bad_role';
  end if;

  if p_role = 'student' then
    update auth.users
      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
      where id = p_user_id;
  else
    update auth.users
      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                              || jsonb_build_object('role', p_role)
      where id = p_user_id;
  end if;

  update public.cohort_members
  set role = case when p_role = 'student' then 'student' else p_role end
  where user_id = p_user_id;
end;
$$;

-- ============================================================
-- 5. Расписание потока
-- ============================================================

create or replace function public.admin_set_lesson_schedule(p_cohort_id text, p_rows jsonb)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_count int;
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  insert into public.cohort_lesson_schedule (
    cohort_id, lesson_number, lesson_date, starts_at, title_override, topic_override, is_released
  )
  select
    p_cohort_id,
    (row_data ->> 'lesson_number')::int,
    nullif(row_data ->> 'lesson_date', '')::date,
    nullif(row_data ->> 'starts_at', '')::timestamptz,
    nullif(btrim(row_data ->> 'title_override'), ''),
    nullif(btrim(row_data ->> 'topic_override'), ''),
    coalesce((row_data ->> 'is_released')::boolean, true)
  from jsonb_array_elements(p_rows) as row_data
  on conflict (cohort_id, lesson_number) do update set
    lesson_date    = excluded.lesson_date,
    starts_at      = excluded.starts_at,
    title_override = coalesce(excluded.title_override, public.cohort_lesson_schedule.title_override),
    topic_override = coalesce(excluded.topic_override, public.cohort_lesson_schedule.topic_override),
    is_released    = excluded.is_released;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.admin_set_assignment_schedule(p_cohort_id text, p_rows jsonb)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_count int;
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  insert into public.cohort_assignment_schedule (cohort_id, hw_number, deadline, is_released)
  select
    p_cohort_id,
    (row_data ->> 'hw_number')::int,
    nullif(row_data ->> 'deadline', '')::timestamptz,
    coalesce((row_data ->> 'is_released')::boolean, true)
  from jsonb_array_elements(p_rows) as row_data
  on conflict (cohort_id, hw_number) do update set
    deadline    = excluded.deadline,
    is_released = excluded.is_released;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Генератор расписания под ритм «две встречи в неделю».
-- Первая дата задаёт день недели, вторая пара считается автоматически:
-- четверг → вторник (+5 дней), вторник → четверг (+2 дня).
create or replace function public.admin_generate_lesson_schedule(
  p_cohort_id text,
  p_first_date date,
  p_lesson_count int,
  p_time_a time default '18:00',
  p_time_b time default '14:30'
)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_gap int;
  v_i int;
  v_date date;
  v_time time;
  v_count int := 0;
begin
  perform public.assert_admin_or_expert();

  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'forbidden';
  end if;

  if p_lesson_count < 1 or p_lesson_count > 60 then
    raise exception 'bad_lesson_count';
  end if;

  -- extract(dow): 0 — воскресенье, 2 — вторник, 4 — четверг
  v_gap := case extract(dow from p_first_date)::int
             when 4 then 5   -- чт → вт
             when 2 then 2   -- вт → чт
             else null
           end;

  if v_gap is null then
    raise exception 'unsupported_start_weekday';
  end if;

  for v_i in 0 .. p_lesson_count - 1 loop
    if v_i % 2 = 0 then
      v_date := p_first_date + (v_i / 2) * 7;
      v_time := p_time_a;
    else
      v_date := p_first_date + (v_i / 2) * 7 + v_gap;
      v_time := p_time_b;
    end if;

    insert into public.cohort_lesson_schedule (
      cohort_id, lesson_number, lesson_date, starts_at, is_released
    )
    values (
      p_cohort_id,
      v_i + 1,
      v_date,
      (v_date + v_time) at time zone 'Europe/Moscow',
      true
    )
    on conflict (cohort_id, lesson_number) do update set
      lesson_date = excluded.lesson_date,
      starts_at   = excluded.starts_at,
      is_released = true;

    v_count := v_count + 1;
  end loop;

  update public.cohorts
  set starts_at = p_first_date,
      ends_at   = (select max(lesson_date) from public.cohort_lesson_schedule
                    where cohort_id = p_cohort_id)
  where id = p_cohort_id;

  return v_count;
end;
$$;

-- ============================================================
-- 6. Права
--
-- Проверка роли живёт внутри функций; гранты закрывают анонимный доступ.
-- ============================================================

revoke execute on function public.admin_cohort_overview() from public, anon;
revoke execute on function public.admin_create_cohort(text, text, date, date) from public, anon;
revoke execute on function public.admin_update_cohort(text, text, date, date, boolean, boolean, boolean) from public, anon;
revoke execute on function public.admin_cohort_members(text) from public, anon;
revoke execute on function public.admin_move_member(uuid, text, text) from public, anon;
revoke execute on function public.admin_remove_member(text, uuid) from public, anon;
revoke execute on function public.admin_set_global_role(uuid, text) from public, anon;
revoke execute on function public.admin_set_lesson_schedule(text, jsonb) from public, anon;
revoke execute on function public.admin_set_assignment_schedule(text, jsonb) from public, anon;
revoke execute on function public.admin_generate_lesson_schedule(text, date, int, time, time) from public, anon;

grant execute on function public.admin_cohort_overview() to authenticated;
grant execute on function public.admin_create_cohort(text, text, date, date) to authenticated;
grant execute on function public.admin_update_cohort(text, text, date, date, boolean, boolean, boolean) to authenticated;
grant execute on function public.admin_cohort_members(text) to authenticated;
grant execute on function public.admin_move_member(uuid, text, text) to authenticated;
grant execute on function public.admin_remove_member(text, uuid) to authenticated;
grant execute on function public.admin_set_global_role(uuid, text) to authenticated;
grant execute on function public.admin_set_lesson_schedule(text, jsonb) to authenticated;
grant execute on function public.admin_set_assignment_schedule(text, jsonb) to authenticated;
grant execute on function public.admin_generate_lesson_schedule(text, date, int, time, time) to authenticated;

-- ============================================================
-- ПОСЛЕ ПРИМЕНЕНИЯ:
--
-- 1) Открыть набор во второй поток:
--      select admin_update_cohort('flow-2', p_is_enrolling => true,
--                                 p_is_visible_to_students => true);
-- 2) Заполнить расписание 16 уроков от 06.08.2026 (чт, ритм чт/вт):
--      select admin_generate_lesson_schedule('flow-2', date '2026-08-06', 16);
-- 3) Проверить, что новая регистрация попадает во второй поток:
--      select * from get_registration_status();
-- ============================================================
