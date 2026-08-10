-- Бейджи за ДЗ после возврата первого задания и сдвига нумерации.
--
-- В потоке 2 задание первого четверга («Сводка через Cowork») вернулось
-- на место ДЗ 1, сетап стал ДЗ 2, остальные сдвинулись на единицу.
-- Триггер привязан к номеру ДЗ, поэтому без правки «Demo Day» выдавался
-- бы за шестое задание, а седьмое не выдавало бы ничего.
--
-- Раскладка бейджей по смыслу задания:
--   ДЗ 1 сводка и промпт по формуле  → 2 Prompt Master, 3 Coworker при проверке
--   ДЗ 2 рабочий сетап               → 5 Context King
--   ДЗ 3 публичная ссылка и команда  → 4 Vibe Coder, 6 Skill Builder при проверке
--   ДЗ 4 MCP и база знаний           → 7 MCP Pioneer
--   ДЗ 5 защищённый агент            → подходящего бейджа нет
--   ДЗ 6 рабочий кейс                → 10 Domain Expert
--   ДЗ 7 финальный проект и защита   → 12 Demo Day
--
-- Поток передаётся третьим аргументом. Двухаргументная award_badge —
-- старая обёртка с захардкоженным flow-1: для студента второго потока
-- она валит всю сдачу с Forbidden.

create or replace function trigger_badge_on_submission()
returns trigger as $$
begin
  case NEW.assignment_id

    when 1 then
      -- ✍️ Prompt Master — ДЗ 1 сдано
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 2, NEW.cohort_id);
      end if;
      -- 🤖 Coworker — ДЗ 1 проверено
      if NEW.status = 'reviewed' then
        perform public.award_badge(NEW.user_id, 3, NEW.cohort_id);
      end if;

    when 2 then
      -- 📄 Context King — сетап собран: папки, CLAUDE.md, settings.json
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 5, NEW.cohort_id);
      end if;

    when 3 then
      -- 💻 Vibe Coder — публичная ссылка
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 4, NEW.cohort_id);
      end if;
      -- 🛠 Skill Builder — своя команда проверена
      if NEW.status = 'reviewed' then
        perform public.award_badge(NEW.user_id, 6, NEW.cohort_id);
      end if;

    when 4 then
      -- 🔌 MCP Pioneer — MCP к своей системе
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 7, NEW.cohort_id);
      end if;

    when 6 then
      -- 🎯 Domain Expert — рабочий кейс на своих данных
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 10, NEW.cohort_id);
      end if;

    when 7 then
      -- 🏆 Demo Day — финальный проект сдан
      if NEW.status in ('submitted', 'reviewed') then
        perform public.award_badge(NEW.user_id, 12, NEW.cohort_id);
      end if;

    else null;
  end case;
  return NEW;
end;
$$ language plpgsql security definer set search_path to 'public', 'auth';
