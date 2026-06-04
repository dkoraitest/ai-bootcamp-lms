-- Функция рейтинга участников для дашборда «Лидеры буткемпа».
-- security definer — выполняется с правами владельца и обходит RLS,
-- поэтому клиент с anon-ключом может получить баллы ВСЕХ участников
-- (а не только свою строку, как ограничивает RLS на gamification).
-- Имена берутся из auth.users (метаданные), не зависят от public.users.

create or replace function get_leaderboard()
returns table (name text, points int)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(au.raw_user_meta_data->>'name', au.email) as name,
    coalesce(g.points, 0)                              as points
  from auth.users au
  left join gamification g on g.user_id = au.id
  where au.email in (
    '0801@lincer.ru',                    -- Михаил
    'a.golukhov@gmail.com',              -- Андрей
    'katerina.wibd@gmail.com',           -- Katerina
    'markukhin@gmail.com',               -- Марк
    'nkrasovskaya@swordfishsecurity.ru', -- Наталья
    'panchenkoed2010@gmail.com',         -- Helen
    'pv12@inbox.ru',                     -- Павел
    's.karataeva@reksma.ru'              -- Света
  )
  order by points desc;
$$;

grant execute on function get_leaderboard() to anon, authenticated;
