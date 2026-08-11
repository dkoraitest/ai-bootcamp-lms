-- Цели списком, а не одной строкой на человека.
--
-- Первая версия держала одну главную цель в поле main_goal. На практике
-- участник приходит с несколькими: одна про рабочую задачу, вторая про
-- навык, третья появляется по ходу. Плюс цели по неделям, которые
-- преподаватель вносит по итогам встреч — это тот же список.
--
-- cohort_goals остаётся профилем участника в потоке (чем занимается),
-- сами цели переезжают в отдельные строки.

drop table if exists cohort_goals cascade;

create table cohort_goals (
  cohort_id  text not null references cohorts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  -- Чем человек занимается: роль, домен. Нужен, чтобы цель читалась со стороны.
  context    text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid,
  primary key (cohort_id, user_id)
);

create table cohort_goal_items (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  text not null references cohorts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  text       text not null,
  -- Неделя, если цель привязана к неделе программы. Общая цель — null.
  week       int check (week is null or week > 0),
  status     text not null default 'planned'
             check (status in ('planned', 'in_progress', 'done', 'dropped')),
  -- Откуда взялась: сам участник или разбор встречи.
  source     text not null default 'self' check (source in ('self', 'transcript')),
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create index if not exists cohort_goal_items_owner_idx
  on cohort_goal_items (cohort_id, user_id, position, created_at);

alter table cohort_goals enable row level security;
alter table cohort_goal_items enable row level security;

-- Цели своего потока видят его участники: цель проговаривается публично,
-- это часть программы. Чужой поток не видит ничего.
create or replace function get_cohort_goals(p_cohort_id text)
returns table (
  user_id    uuid,
  name       text,
  context    text,
  items      jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path to 'public', 'auth'
as $$
  select i.user_id,
         coalesce(u.name, au.email) as name,
         coalesce(g.context, '')    as context,
         jsonb_agg(
           jsonb_build_object(
             'id', i.id, 'text', i.text, 'week', i.week,
             'status', i.status, 'source', i.source
           )
           order by i.position, i.created_at
         ) as items,
         max(i.updated_at) as updated_at
  from cohort_goal_items i
  join auth.users au on au.id = i.user_id
  left join public.users u on u.id = i.user_id
  left join cohort_goals g on g.cohort_id = i.cohort_id and g.user_id = i.user_id
  where i.cohort_id = p_cohort_id
    and public.can_access_cohort(p_cohort_id)
  group by i.user_id, coalesce(u.name, au.email), coalesce(g.context, '')
  order by coalesce(u.name, au.email);
$$;

create or replace function set_my_goal_context(p_cohort_id text, p_context text)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  perform public.assert_can_access_cohort(p_cohort_id);

  insert into cohort_goals (cohort_id, user_id, context, updated_by)
  values (p_cohort_id, v_user_id, coalesce(btrim(p_context), ''), v_user_id)
  on conflict (cohort_id, user_id) do update set
    context = excluded.context, updated_at = now(), updated_by = v_user_id;
end;
$$;

create or replace function add_my_goal(p_cohort_id text, p_text text, p_week int default null)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if coalesce(btrim(p_text), '') = '' then raise exception 'Цель не может быть пустой'; end if;
  perform public.assert_can_access_cohort(p_cohort_id);

  insert into cohort_goal_items (cohort_id, user_id, text, week, source, position, updated_by)
  values (
    p_cohort_id, v_user_id, btrim(p_text), p_week, 'self',
    coalesce((select max(position) + 1 from cohort_goal_items
              where cohort_id = p_cohort_id and user_id = v_user_id), 0),
    v_user_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Правит и удаляет только владелец цели, проверяющие — цели своего потока.
create or replace function update_my_goal(
  p_goal_id uuid,
  p_text    text default null,
  p_status  text default null,
  p_week    int  default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare v_owner uuid; v_cohort text;
begin
  select user_id, cohort_id into v_owner, v_cohort from cohort_goal_items where id = p_goal_id;
  if v_owner is null then raise exception 'Цель не найдена'; end if;
  perform public.assert_can_access_cohort(v_cohort);

  if v_owner is distinct from auth.uid() and not public.is_admin_or_expert() then
    raise exception 'Forbidden';
  end if;

  update cohort_goal_items set
    text   = coalesce(nullif(btrim(p_text), ''), text),
    status = coalesce(p_status, status),
    week   = case when p_week is null then week else p_week end,
    updated_at = now(),
    updated_by = auth.uid()
  where id = p_goal_id;
end;
$$;

create or replace function delete_my_goal(p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare v_owner uuid; v_cohort text;
begin
  select user_id, cohort_id into v_owner, v_cohort from cohort_goal_items where id = p_goal_id;
  if v_owner is null then return; end if;
  perform public.assert_can_access_cohort(v_cohort);

  if v_owner is distinct from auth.uid() and not public.is_admin_or_expert() then
    raise exception 'Forbidden';
  end if;

  delete from cohort_goal_items where id = p_goal_id;
end;
$$;

-- Загрузка целей по итогам встречи: заменяет список участника целиком.
create or replace function admin_set_student_goals(
  p_cohort_id text,
  p_user_id   uuid,
  p_items     jsonb,
  p_context   text default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare v_item jsonb; v_pos int := 0;
begin
  perform public.assert_admin_or_expert();
  perform public.assert_can_access_cohort(p_cohort_id);

  if p_context is not null then
    insert into cohort_goals (cohort_id, user_id, context, updated_by)
    values (p_cohort_id, p_user_id, btrim(p_context), auth.uid())
    on conflict (cohort_id, user_id) do update set
      context = excluded.context, updated_at = now(), updated_by = auth.uid();
  end if;

  delete from cohort_goal_items
  where cohort_id = p_cohort_id and user_id = p_user_id and source = 'transcript';

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    insert into cohort_goal_items (cohort_id, user_id, text, week, status, source, position, updated_by)
    values (
      p_cohort_id,
      p_user_id,
      btrim(v_item ->> 'text'),
      nullif(v_item ->> 'week', '')::int,
      coalesce(nullif(v_item ->> 'status', ''), 'planned'),
      'transcript',
      v_pos,
      auth.uid()
    );
    v_pos := v_pos + 1;
  end loop;
end;
$$;

grant execute on function get_cohort_goals(text) to authenticated;
grant execute on function set_my_goal_context(text, text) to authenticated;
grant execute on function add_my_goal(text, text, int) to authenticated;
grant execute on function update_my_goal(uuid, text, text, int) to authenticated;
grant execute on function delete_my_goal(uuid) to authenticated;
grant execute on function admin_set_student_goals(text, uuid, jsonb, text) to authenticated;
