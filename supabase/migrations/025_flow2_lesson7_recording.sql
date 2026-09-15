-- Запись урока 7 второго потока (27.08.2026, «Память агента: четыре уровня»).
--
-- Ссылка на видео живёт не в репозитории, а в cohort_lesson_settings.video_url —
-- редактируется только прямым SQL (в /admin/schedule такого поля нет, см.
-- 017_flow2_lesson1_recording.sql). Прежнее значение для урока 7 не открывалось
-- кнопкой «Смотреть запись»; рабочие уроки потока (например, урок 6, 25.08)
-- используют прямую ссылку на просмотр Google Диска — тот же формат ниже.
-- Идемпотентно.

update cohort_lesson_settings
   set video_url = 'https://drive.google.com/file/d/1deSaIesIdrEloyjEQZQoG3Aqva0DdGue/view?usp=share_link',
       is_released = true,
       released_at = coalesce(released_at, now())
 where cohort_id = 'flow-2'
   and lesson_number = 7;
