-- ============================================================
-- MATERIALS TABLE
-- Run once in Supabase SQL Editor
-- After this, add/edit materials in Table Editor → materials
-- ============================================================

drop table if exists materials;

create table materials (
  id               int  primary key,
  title            text not null,
  type             text not null check (type in ('video', 'template', 'technique')),
  week             int  not null,
  lesson_id        int  not null,
  lesson_topic     text not null,
  url              text not null default '',
  description      text,
  markdown_content text
);

-- RLS: authenticated users can read
alter table materials enable row level security;

create policy "authenticated read materials"
  on materials for select
  to authenticated
  using (true);

-- ============================================================
-- SEED: all 27 materials
-- ============================================================

insert into materials (id, title, type, week, lesson_id, lesson_topic, url, description) values
  -- ВИДЕО
  (1,  'AI Mindset: новая работа в эпоху агентов',           'video', 1, 1,  'AI Mindset',   '', 'Запись урока 1 · 12.05.2026'),
  (2,  'Переход в Cowork: AI который делает',                 'video', 1, 2,  'Cowork',        '', 'Запись урока 2 · 14.05.2026'),
  (3,  'Кодинг-агенты как класс. CC / Codex / IDE',           'video', 2, 3,  'Кодинг-агенты', '', 'Запись урока 3 · 19.05.2026'),
  (4,  'Vibe coding: 3 принципа + первый mini-app',           'video', 2, 4,  'Vibe coding',   '', 'Запись урока 4 · 21.05.2026'),
  (5,  'Контекст как материал. R&D подход',                   'video', 3, 5,  'Контекст',      '', 'Запись урока 5 · 26.05.2026'),
  (6,  'Skills и Commands: четыре примитива CC',              'video', 3, 6,  'Skills',        '', 'Запись урока 6 · 28.05.2026'),
  (7,  'MCP и RAG: расширяем агента',                         'video', 4, 7,  'MCP + RAG',     '', 'Запись урока 7 · 02.06.2026'),
  (8,  'Автоматизации 24/7 и визуальное программирование',    'video', 4, 8,  'Автоматизации', '', 'Запись урока 8 · 04.06.2026'),
  (9,  'Маркетинг + продажи (доменные кейсы)',                'video', 5, 9,  'Маркетинг',     '', 'Запись урока 9 · 09.06.2026'),
  (10, 'Продукт + аналитика (доменные кейсы)',                'video', 5, 10, 'Продукт',       '', 'Запись урока 10 · 11.06.2026'),
  (11, 'Безопасный агент + multi-agent',                      'video', 6, 11, 'Безопасность',  '', 'Запись урока 11 · 16.06.2026'),
  (12, 'Demo Day — Защита проектов',                          'video', 6, 12, 'Demo Day',      '', 'Запись урока 12 · 18.06.2026'),
  -- ШАБЛОНЫ
  (13, 'Шаблон промпта Stage + Task + Rules',                 'template', 1, 1,  'AI Mindset', '', 'Базовая формула промпта для любой задачи'),
  (14, 'Чеклист запуска Cowork-автоматизации',                'template', 1, 2,  'Cowork',     '', 'Пошаговый чеклист для первой автоматизации'),
  (15, 'Шаблон CLAUDE.md (5 разделов)',                       'template', 3, 5,  'Контекст',   '', 'Готовая структура личной операционной системы'),
  (16, 'Шаблон Skill для Claude Code',                        'template', 3, 6,  'Skills',     '', 'Стартовая структура для написания своего Skill'),
  (17, 'Шаблон MCP конфига',                                  'template', 4, 7,  'MCP + RAG',  '', 'Базовая конфигурация для подключения MCP-сервера'),
  (18, 'Шаблон питча для Demo Day (5 мин)',                   'template', 6, 12, 'Demo Day',   '', 'Структура выступления: проблема → агент → результат'),
  -- ТЕХНИКИ (markdown_content заполняется ниже)
  (19, 'Stage + Task + Rules формула',            'technique', 1, 1,  'AI Mindset',   '', null),
  (20, 'AI Mindset: 3 режима работы с агентом',   'technique', 1, 1,  'AI Mindset',   '', null),
  (21, 'Cowork automation loop',                   'technique', 1, 2,  'Cowork',        '', null),
  (22, '3 принципа vibe coding',                   'technique', 2, 4,  'Vibe coding',   '', null),
  (23, 'CLAUDE.md: 5 обязательных разделов',      'technique', 3, 5,  'Контекст',      '', null),
  (24, 'Skills anatomy: 4 части',                  'technique', 3, 6,  'Skills',        '', null),
  (25, 'MCP connection flow',                       'technique', 4, 7,  'MCP + RAG',    '', null),
  (26, '3 уровня доверия для автоматизаций',       'technique', 4, 8,  'Автоматизации', '', null),
  (27, 'Trust boundaries checklist',               'technique', 6, 11, 'Безопасность',  '', null)
on conflict (id) do nothing;

-- Markdown content for techniques (dollar-quoted to avoid escaping issues)
update materials set markdown_content = $md$## Stage + Task + Rules

**Stage** — контекст: кто ты, какая ситуация
**Task** — конкретное действие
**Rules** — ограничения и формат вывода

```
[Stage] Ты senior маркетолог...
[Task] Напиши 3 варианта заголовка...
[Rules] Каждый до 10 слов, без вопросов
```$md$ where id = 19;

update materials set markdown_content = $md$## 3 режима работы с агентом

1. **Ассистент** — разовые задачи
2. **Напарник** — итеративная работа
3. **Агент** — автономное выполнение$md$ where id = 20;

update materials set markdown_content = $md$## Cowork Automation Loop

Trigger → Agent → Output → Verify → Deploy$md$ where id = 21;

update materials set markdown_content = $md$## 3 принципа vibe coding

1. **Describe, don't code** — описывай результат, не шаги
2. **Iterate fast** — маленькие итерации с проверкой
3. **Own the output** — всегда понимай что задеплоил$md$ where id = 22;

update materials set markdown_content = $md$## CLAUDE.md структура

1. Роль и контекст
2. Стиль работы
3. Запрещённые действия
4. Форматы вывода
5. Проектный контекст$md$ where id = 23;

update materials set markdown_content = $md$## Anatomy of a Skill

1. **Trigger** — когда запускается
2. **Context** — что передаётся агенту
3. **Task** — что делает агент
4. **Output** — формат результата$md$ where id = 24;

update materials set markdown_content = $md$## MCP Connection Flow

Install → Configure → Authenticate → Test → Use in Agent$md$ where id = 25;

update materials set markdown_content = $md$## 3 уровня доверия

1. **Supervised** — агент предлагает, человек подтверждает
2. **Semi-auto** — агент действует, человек проверяет результат
3. **Autonomous** — агент действует и отчитывается$md$ where id = 26;

update materials set markdown_content = $md$## Trust Boundaries Checklist

- [ ] Scope файловой системы ограничен
- [ ] Деструктивные действия требуют подтверждения
- [ ] Секреты не передаются в промпт
- [ ] Stop conditions заданы$md$ where id = 27;
