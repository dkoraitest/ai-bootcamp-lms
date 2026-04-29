-- ============================================================
-- BADGE TRIGGERS
-- Run once in Supabase SQL Editor → Database → SQL Editor
-- ============================================================

-- Helper: award a badge if not already earned
create or replace function award_badge(p_user_id uuid, p_badge_id int)
returns void as $$
begin
  update gamification
  set badges = badges || jsonb_build_array(
    jsonb_build_object(
      'id',       p_badge_id,
      'earnedAt', to_char(now(), 'DD.MM.YYYY')
    )
  )
  where user_id = p_user_id
    and not exists (
      select 1 from jsonb_array_elements(badges) as b
      where (b->>'id')::int = p_badge_id
    );
end;
$$ language plpgsql security definer;


-- ============================================================
-- TRIGGER 1: student_progress → "Первый старт"
-- ============================================================
create or replace function trigger_badge_on_progress()
returns trigger as $$
begin
  -- 🚀 Первый старт — урок 1 просмотрен
  if NEW.lesson_id = 1 and NEW.status = 'completed' then
    perform award_badge(NEW.user_id, 1);
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists badge_on_progress on student_progress;
create trigger badge_on_progress
  after insert or update on student_progress
  for each row execute function trigger_badge_on_progress();


-- ============================================================
-- TRIGGER 2: assignment_submissions → бейджи за ДЗ
-- ============================================================
create or replace function trigger_badge_on_submission()
returns trigger as $$
begin
  case NEW.assignment_id

    when 1 then
      -- ✍️ Prompt Master — HW1 сдан
      if NEW.status in ('submitted', 'reviewed') then
        perform award_badge(NEW.user_id, 2);
      end if;
      -- 🤖 Coworker — HW1 проверен
      if NEW.status = 'reviewed' then
        perform award_badge(NEW.user_id, 3);
      end if;

    when 2 then
      -- 💻 Vibe Coder — HW2 сдан
      if NEW.status in ('submitted', 'reviewed') then
        perform award_badge(NEW.user_id, 4);
      end if;

    when 3 then
      -- 📄 Context King — HW3 сдан
      if NEW.status in ('submitted', 'reviewed') then
        perform award_badge(NEW.user_id, 5);
      end if;
      -- 🛠 Skill Builder — HW3 проверен
      if NEW.status = 'reviewed' then
        perform award_badge(NEW.user_id, 6);
      end if;

    when 4 then
      -- 🔌 MCP Pioneer — HW4 сдан
      if NEW.status in ('submitted', 'reviewed') then
        perform award_badge(NEW.user_id, 7);
      end if;

    when 5 then
      -- 🎯 Domain Expert — HW5 сдан
      if NEW.status in ('submitted', 'reviewed') then
        perform award_badge(NEW.user_id, 10);
      end if;

    when 6 then
      -- 🏆 Demo Day — HW6 сдан
      if NEW.status in ('submitted', 'reviewed') then
        perform award_badge(NEW.user_id, 12);
      end if;

    else null;
  end case;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists badge_on_submission on assignment_submissions;
create trigger badge_on_submission
  after insert or update on assignment_submissions
  for each row execute function trigger_badge_on_submission();


-- ============================================================
-- TRIGGER 3: agent_launches → "5 в неделю" + "На старте"
-- ============================================================
create or replace function trigger_badge_on_launch()
returns trigger as $$
declare
  v_week_launches int;
  v_streak_weeks  int;
begin
  -- 🔥 5 в неделю — 5+ запусков за одну неделю
  select count(*) into v_week_launches
  from agent_launches
  where user_id    = NEW.user_id
    and week_number = NEW.week_number;

  if v_week_launches >= 5 then
    perform award_badge(NEW.user_id, 8);
  end if;

  -- ⚡ На старте — 3 недели подряд с хотя бы 1 запуском
  select count(distinct week_number) into v_streak_weeks
  from agent_launches
  where user_id    = NEW.user_id
    and week_number in (NEW.week_number, NEW.week_number - 1, NEW.week_number - 2);

  if v_streak_weeks >= 3 then
    perform award_badge(NEW.user_id, 9);
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists badge_on_launch on agent_launches;
create trigger badge_on_launch
  after insert on agent_launches
  for each row execute function trigger_badge_on_launch();


-- ============================================================
-- TRIGGER 4: peer_reviews → "Peer Reviewer"
-- ============================================================
create or replace function trigger_badge_on_peer_review()
returns trigger as $$
declare
  v_review_count int;
begin
  -- 👥 Peer Reviewer — 2+ пир-ревью проведено
  select count(*) into v_review_count
  from peer_reviews
  where reviewer_id = NEW.reviewer_id;

  if v_review_count >= 2 then
    perform award_badge(NEW.reviewer_id, 11);
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists badge_on_peer_review on peer_reviews;
create trigger badge_on_peer_review
  after insert on peer_reviews
  for each row execute function trigger_badge_on_peer_review();
