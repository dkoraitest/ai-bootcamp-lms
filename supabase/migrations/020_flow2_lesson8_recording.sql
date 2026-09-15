-- Запись урока 8 второго потока (01.09.2026).
--
-- Урок получает прямую публичную ссылку на MP4. Отдельная карточка материала
-- видна только flow-2, поэтому запись второго потока не попадает выпускникам
-- flow-1. Миграция идемпотентна.

insert into public.cohort_lesson_settings (
  cohort_id,
  lesson_number,
  video_url,
  is_released,
  released_at
)
values (
  'flow-2',
  8,
  'https://drive.google.com/file/d/1A19V1IEsX6D3FDRVF6TbpZ4afxSmsqCU/view?usp=sharing',
  true,
  now()
)
on conflict (cohort_id, lesson_number) do update
  set video_url = excluded.video_url,
      is_released = true,
      released_at = coalesce(public.cohort_lesson_settings.released_at, excluded.released_at);

-- materials.id не использует sequence; перед apply проверено, что текущий max(id) = 109.
insert into public.materials (
  id,
  title,
  type,
  week,
  lesson_id,
  lesson_topic,
  url,
  description
)
values (
  110,
  'Безопасность: теория + audit demo',
  'video',
  5,
  8,
  'Безопасность',
  'https://drive.google.com/file/d/1A19V1IEsX6D3FDRVF6TbpZ4afxSmsqCU/view?usp=sharing',
  'Запись урока 8 · 01.09.2026'
)
on conflict (id) do update
  set title = excluded.title,
      type = excluded.type,
      week = excluded.week,
      lesson_id = excluded.lesson_id,
      lesson_topic = excluded.lesson_topic,
      url = excluded.url,
      description = excluded.description;

insert into public.cohort_material_settings (
  cohort_id,
  material_id,
  is_visible,
  url,
  released_at
)
values
  (
    'flow-2',
    110,
    true,
    'https://drive.google.com/file/d/1A19V1IEsX6D3FDRVF6TbpZ4afxSmsqCU/view?usp=sharing',
    now()
  ),
  ('flow-1', 110, false, null, null)
on conflict (cohort_id, material_id) do update
  set is_visible = excluded.is_visible,
      url = excluded.url,
      released_at = case
        when excluded.is_visible
          then coalesce(public.cohort_material_settings.released_at, excluded.released_at)
        else null
      end;
