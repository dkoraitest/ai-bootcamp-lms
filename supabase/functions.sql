create or replace function increment_points(user_id uuid, amount int)
returns void as $$
  update gamification
  set points = points + amount
  where gamification.user_id = increment_points.user_id;
$$ language sql security definer;
