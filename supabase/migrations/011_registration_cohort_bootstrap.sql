do $$
begin
  if to_regclass('public.cohorts') is null then
    raise exception 'Migration 008_cohorts.sql must be applied before 011_registration_cohort_bootstrap.sql';
  end if;
end
$$;

create or replace function public.handle_new_auth_user_cohort()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'name'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.users.name, excluded.name);

  insert into public.cohort_members (cohort_id, user_id, role)
  values ('flow-1', new.id, 'student')
  on conflict (cohort_id, user_id) do nothing;

  insert into public.gamification (user_id, cohort_id, points, level, badges, quests)
  values (
    new.id,
    'flow-1',
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

drop trigger if exists on_auth_user_created_cohort_bootstrap on auth.users;

create trigger on_auth_user_created_cohort_bootstrap
after insert on auth.users
for each row
execute function public.handle_new_auth_user_cohort();

revoke execute on function public.handle_new_auth_user_cohort() from public, anon, authenticated;
