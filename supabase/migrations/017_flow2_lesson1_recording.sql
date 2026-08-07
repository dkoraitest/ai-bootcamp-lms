-- Запись урока 1 второго потока (06.08.2026).
--
-- Записи не лежат в общей lessons.video_url: у каждого потока своя ссылка,
-- поэтому урок открывается через cohort_lesson_settings, а карточка в каталоге
-- материалов — через отдельный материал, видимый только во втором потоке.
-- Идемпотентно.

update cohort_lesson_settings
   set video_url = 'https://drive.google.com/file/d/1UoPRkUlQic7ZOGoPUIuOBj6XPifBIhcV/view?usp=sharing',
       is_released = true,
       released_at = coalesce(released_at, now())
 where cohort_id = 'flow-2'
   and lesson_number = 1;

-- materials.id без sequence, поэтому id задаётся явно.
insert into materials (id, title, type, week, lesson_id, lesson_topic, url, description)
values (
  88,
  'Что такое вайб кодинг + лестница автономии',
  'video',
  1,
  1,
  'Вайб кодинг',
  'https://drive.google.com/file/d/1UoPRkUlQic7ZOGoPUIuOBj6XPifBIhcV/view?usp=sharing',
  'Запись урока 1 · 06.08.2026'
)
on conflict (id) do update
  set title = excluded.title,
      url = excluded.url,
      description = excluded.description;

insert into cohort_material_settings (cohort_id, material_id, is_visible, url)
values
  ('flow-2', 88, true, 'https://drive.google.com/file/d/1UoPRkUlQic7ZOGoPUIuOBj6XPifBIhcV/view?usp=sharing'),
  ('flow-1', 88, false, null)
on conflict (cohort_id, material_id) do update
  set is_visible = excluded.is_visible,
      url = excluded.url;
