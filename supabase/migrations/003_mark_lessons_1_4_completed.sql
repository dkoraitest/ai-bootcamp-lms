-- Mark lessons 1–4 as completed for all existing students.
-- Uses upsert so running twice is safe.
insert into student_progress (user_id, lesson_id, status, completed_at)
select
  u.id                         as user_id,
  l.id                         as lesson_id,
  'completed'                  as status,
  now()                        as completed_at
from users u
cross join lessons l
where l.lesson_number <= 4
on conflict (user_id, lesson_id)
do update set
  status       = 'completed',
  completed_at = coalesce(student_progress.completed_at, now());
