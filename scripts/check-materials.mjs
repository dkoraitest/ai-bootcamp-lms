#!/usr/bin/env node
// Проверяет, открываются ли материалы потока у постороннего человека.
//
// Ссылки на Google Drive живут своей жизнью: файл, расшаренный конкретным
// людям прошлого потока, отдаёт 401 всем остальным. Участник видит
// «Запросить доступ» ровно в тот момент, когда материал ему нужен.
// Скрипт находит это раньше участника.
//
//   npm run check:materials -- --cohort flow-2 --email qa@example.com --password ...
//   LMS_CHECK_EMAIL=... LMS_CHECK_PASSWORD=... npm run check:materials
//
// Список материалов читается из-под учётной записи участника: таблица
// настроек закрыта RLS, и анонимный ключ её не видит. А сами ссылки
// проверяются без всякой авторизации — так же, как их откроет человек
// в браузере, поэтому «просит вход» здесь означает реальную недоступность.

import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const cohortId = argValue("--cohort", "flow-2");
const site = argValue("--site", "https://ai-bootcamp-lms.vercel.app");
const email = argValue("--email", process.env.LMS_CHECK_EMAIL);
const password = argValue("--password", process.env.LMS_CHECK_PASSWORD);

function env(name) {
  if (process.env[name]) return process.env[name];
  const file = join(REPO, ".env.local");
  if (!existsSync(file)) return null;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((row) => row.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : null;
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!url || !key) {
  console.error("Не нашёл NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

async function signIn() {
  if (!email || !password) {
    console.error("Нужна учётная запись участника потока: --email и --password");
    console.error("или переменные LMS_CHECK_EMAIL и LMS_CHECK_PASSWORD.");
    process.exit(1);
  }
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!data.access_token) {
    console.error(`Не удалось войти как ${email}: ${data.error_description ?? data.msg ?? "неизвестная ошибка"}`);
    process.exit(1);
  }
  return data.access_token;
}

async function loadMaterials(token) {
  const settings = await fetch(
    `${url}/rest/v1/cohort_material_settings?cohort_id=eq.${cohortId}&is_visible=eq.true&select=material_id,url`,
    { headers: { apikey: key, Authorization: `Bearer ${token}` } }
  ).then((r) => r.json());

  if (!Array.isArray(settings) || settings.length === 0) {
    console.error(`Материалов для потока ${cohortId} не видно: участник в него не входит?`);
    process.exit(1);
  }

  const ids = settings.map((row) => row.material_id).join(",");
  const materials = await fetch(
    `${url}/rest/v1/materials?id=in.(${ids})&select=id,title,type,url`,
    { headers: { apikey: key, Authorization: `Bearer ${token}` } }
  ).then((r) => r.json());

  const overrideById = new Map(settings.map((row) => [row.material_id, row.url]));
  return materials
    .map((material) => ({
      id: material.id,
      title: material.title.trim(),
      type: material.type,
      link: overrideById.get(material.id) || material.url || "",
    }))
    .filter((material) => material.link)
    .sort((a, b) => a.id - b.id);
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// Проверяем по очереди с паузой: пачка параллельных запросов ловит 429
// от GitHub, и живая ссылка попадает в отчёт как мёртвая.
async function checkAll(items) {
  const results = [];
  for (const item of items) {
    let result = await check(item);
    if (result.verdict === "HTTP 429") {
      await sleep(2000);
      result = await check(item);
    }
    results.push(result);
    await sleep(250);
  }
  return results;
}

async function check(material) {
  const target = material.link.startsWith("/") ? site + material.link : material.link;
  try {
    const response = await fetch(target, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" },
    });
    if (!response.ok) return { ...material, verdict: `HTTP ${response.status}`, ok: false };

    // Drive отдаёт 200 и страницу входа вместо файла — это тоже недоступность.
    const body = (await response.text()).slice(0, 4000).toLowerCase();
    if (body.includes("accounts.google.com/signin") || body.includes("sign-in")) {
      return { ...material, verdict: "просит вход", ok: false };
    }
    return { ...material, verdict: "открывается", ok: true };
  } catch (error) {
    return { ...material, verdict: error.name ?? "ошибка сети", ok: false };
  }
}

const token = await signIn();
const materials = await loadMaterials(token);
const results = await checkAll(materials);
const broken = results.filter((row) => !row.ok);

console.log(`Поток: ${cohortId} · сайт: ${site}`);
console.log(`Проверено: ${results.length} · открывается: ${results.length - broken.length} · недоступно: ${broken.length}\n`);

if (broken.length === 0) {
  console.log("Все материалы открываются у постороннего.");
} else {
  console.log("Недоступны без авторизации:");
  for (const row of broken) {
    const host = row.link.startsWith("/") ? "сама платформа" : new URL(row.link).host;
    console.log(`  ${String(row.id).padStart(3)} · ${row.verdict.padEnd(12)} · ${host.padEnd(22)} · ${row.title.slice(0, 44)}`);
  }
  console.log("\nДля файлов на Google Drive: доступ по ссылке должен быть «Все, у кого есть ссылка».");
  process.exitCode = 1;
}
