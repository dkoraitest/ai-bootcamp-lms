create or replace function increment_points(user_id uuid, amount int)
returns void as $$
  update gamification
  set points = points + amount
  where gamification.user_id = increment_points.user_id;
$$ language sql security definer;

create or replace function submit_expert_feedback(
  student_email  text,
  hw_number      int,
  feedback_text  text,
  points_awarded int
) returns void as $$
declare
  student_id uuid;
begin
  select id into student_id from auth.users where email = student_email;
  if student_id is null then
    raise exception 'Студент с email % не найден', student_email;
  end if;

  if exists (
    select 1 from assignment_submissions
    where user_id = student_id and assignment_id = hw_number
  ) then
    update assignment_submissions
    set status = 'reviewed', feedback = feedback_text, points_earned = points_awarded
    where user_id = student_id and assignment_id = hw_number;
  else
    insert into assignment_submissions (user_id, assignment_id, status, feedback, points_earned, submitted_at)
    values (student_id, hw_number, 'reviewed', feedback_text, points_awarded, now());
  end if;

  update gamification
  set points = points + points_awarded
  where gamification.user_id = student_id;
end;
$$ language plpgsql security definer;
