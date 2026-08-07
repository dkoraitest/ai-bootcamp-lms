#!/usr/bin/env node
// Сверяет программу курса с её источником и готовит SQL для расписания потока.
//
// Программа живёт не здесь, а в проекте содержания (по умолчанию
// ../AI Agent Bootcamp/VC_Bootcamp). Там она переписывается между потоками,
// и LMS должна догонять её, а не расходиться молча.
//
//   node scripts/sync-program.mjs --cohort flow-2
//   node scripts/sync-program.mjs --cohort flow-2 --out active/program.sql
//   PROGRAM_SOURCE=/путь/к/VC_Bootcamp node scripts/sync-program.mjs
//
// Скрипт ничего не пишет в базу: печатает расхождения и idempotent-SQL,
// который применяется через Supabase MCP или SQL Editor. Так изменение
// программы всегда проходит через глаза человека.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const cohortId = argValue("--cohort", "flow-2");
const source = resolve(
  process.env.PROGRAM_SOURCE ?? argValue("--source", join(REPO, "..", "AI Agent Bootcamp", "VC_Bootcamp"))
);
const outPath = argValue("--out", null);

// Минимальный CSV-разбор: поля в кавычках содержат запятые и переводы строк.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  return body.map((cells) =>
    Object.fromEntries(header.map((name, index) => [name.trim(), (cells[index] ?? "").trim()]))
  );
}

function readSource(name) {
  const path = join(source, name);
  if (!existsSync(path)) {
    console.error(`Не нашёл ${path}.`);
    console.error("Укажи путь к проекту содержания: PROGRAM_SOURCE=... или --source <путь>");
    process.exit(1);
  }
  return readFileSync(path, "utf8");
}

const lessons = parseCsv(readSource("lessons_v2.csv"))
  .filter((row) => row.session_num)
  .map((row) => ({
    number: Number(row.session_num),
    week: Number(row.week),
    title: row.title,
    date: row.date,
    hw: row.assignment_id || null,
  }))
  .sort((a, b) => a.number - b.number);

const assignments = parseCsv(readSource("assignments_v2.csv"))
  .filter((row) => row.hw_id)
  .map((row) => ({
    number: Number(row.hw_id.replace(/\D/g, "")),
    title: row.title,
    deadline: row.deadline,
    peerReview: row.peer_review,
  }))
  .sort((a, b) => a.number - b.number);

// Темы недель лежат не в CSV, а в карте курса внутри 01_PROGRAM.html.
const weekThemes = [
  ...readSource("01_PROGRAM.html").matchAll(
    /<div class="week-num">W(\d+)[^<]*<\/div><div class="week-title">([^<]+)</g
  ),
].map(([, week, title]) => ({ week: Number(week), title: title.trim() }));

const sqlLiteral = (value) => `'${String(value).replace(/'/g, "''")}'`;

const lessonRows = lessons
  .map((l) => ` (${l.number}, date ${sqlLiteral(l.date)}, ${sqlLiteral(l.title)})`)
  .join(",\n");

const sql = `-- Расписание потока ${cohortId} по программе из ${source}
-- Сгенерировано scripts/sync-program.mjs. Применять через Supabase MCP или SQL Editor.
-- Время занятий (starts_at) и дедлайны ДЗ скрипт не трогает: они задаются на /admin/schedule.

begin;

update cohort_lesson_schedule s
set lesson_date = v.lesson_date,
    title_override = v.title,
    topic_override = v.title
from (values
${lessonRows}
) as v(lesson_number, lesson_date, title)
where s.cohort_id = ${sqlLiteral(cohortId)} and s.lesson_number = v.lesson_number;

-- Занятия сверх программы: если генератор дат наштамповал лишние, они удалятся.
delete from cohort_lesson_schedule where cohort_id = ${sqlLiteral(cohortId)} and lesson_number > ${lessons.length};
delete from cohort_lesson_settings  where cohort_id = ${sqlLiteral(cohortId)} and lesson_number > ${lessons.length};

update cohorts set ends_at = date ${sqlLiteral(lessons.at(-1).date)} where id = ${sqlLiteral(cohortId)};

commit;
`;

// Зашитый в интерфейс текст скрипт не переписывает — только показывает,
// где он разошёлся с источником. Правится руками, чтобы формулировки
// для участников проходили через человека.
function checkHardcoded() {
  const problems = [];
  const files = {
    "src/app/(dashboard)/program/page.tsx": lessons.map((l) => l.title),
    "src/app/(dashboard)/page.tsx": lessons.map((l) => l.title),
  };

  for (const [file, titles] of Object.entries(files)) {
    const path = join(REPO, file);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    const missing = titles.filter((title) => !text.includes(title));
    if (missing.length) problems.push({ file, missing });
  }

  const assignmentsFile = join(REPO, "src/app/(dashboard)/assignments/page.tsx");
  if (existsSync(assignmentsFile)) {
    const text = readFileSync(assignmentsFile, "utf8");
    const missing = assignments.filter((a) => !text.includes(a.title)).map((a) => `ДЗ ${a.number}: ${a.title}`);
    if (missing.length) problems.push({ file: "src/app/(dashboard)/assignments/page.tsx", missing });
  }

  return problems;
}

console.log(`Источник: ${source}`);
console.log(`Поток: ${cohortId}`);
console.log(`\nЗанятий в программе: ${lessons.length}, ДЗ: ${assignments.length}, недель: ${weekThemes.length}`);
console.log(`Даты: ${lessons[0].date} — ${lessons.at(-1).date}\n`);

console.log("Занятия");
for (const l of lessons) {
  console.log(`  ${String(l.number).padStart(2)} · ${l.date} · W${l.week}${l.hw ? ` · ${l.hw}` : ""} · ${l.title}`);
}

console.log("\nТемы недель");
for (const w of weekThemes) console.log(`  W${w.week} · ${w.title}`);

console.log("\nДЗ (дедлайны в источнике заданы словами, в базу их ставит человек)");
for (const a of assignments) {
  console.log(`  ДЗ ${a.number} · ${a.title}`);
  console.log(`        дедлайн: ${a.deadline} · пир-ревью: ${a.peerReview}`);
}

const problems = checkHardcoded();
if (problems.length) {
  console.log("\nЗашитый в интерфейс текст разошёлся с программой:");
  for (const p of problems) {
    console.log(`  ${p.file}`);
    for (const item of p.missing) console.log(`      нет: ${item}`);
  }
  console.log("\n  Эти строки правятся руками — скрипт их не трогает.");
} else {
  console.log("\nЗашитый в интерфейс текст совпадает с программой.");
}

if (outPath) {
  const target = resolve(REPO, outPath);
  writeFileSync(target, sql, "utf8");
  console.log(`\nSQL записан в ${target}`);
} else {
  console.log(`\n${"-".repeat(60)}\n${sql}`);
}
