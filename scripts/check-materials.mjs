#!/usr/bin/env node
// Проверяет, открываются ли материалы потока у постороннего человека.
//
// Ссылки на Google Drive живут своей жизнью: файл, расшаренный конкретным
// людям прошлого потока, отдаёт 401 всем остальным. Участник видит
// «Запросить доступ» ровно в тот момент, когда материал ему нужен.
// Скрипт находит это раньше участника.
//
//   npm run check:materials -- --cohort flow-2
//   npm run check:materials -- --cohort flow-2 --site https://ai-bootcamp-lms.vercel.app
//
// Читает публичным ключом, тем же, что и браузер студента, поэтому видит
// ровно то, что видно неавторизованному: доступ проверяется честно.

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

async function loadMaterials() {
  const settings = await fetch(
    `${url}/rest/v1/cohort_material_settings?cohort_id=eq.${cohortId}&is_visible=eq.true&select=material_id,url`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  ).then((r) => r.json());

  if (!Array.isArray(settings) || settings.length === 0) {
    console.error(`Материалов для потока ${cohortId} не видно. Проверь ключ и доступ.`);
    process.exit(1);
  }

  const ids = settings.map((row) => row.material_id).join(",");
  const materials = await fetch(
    `${url}/rest/v1/materials?id=in.(${ids})&select=id,title,type,url`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
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

const materials = await loadMaterials();
const results = await Promise.all(materials.map(check));
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
