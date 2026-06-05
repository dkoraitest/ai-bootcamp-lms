"use client";

import SkillRadar from "@/components/skills/SkillRadar";
import SkillCard from "@/components/skills/SkillCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUser } from "@/lib/hooks/useUser";
import { useSkillData } from "@/lib/hooks/useSkillData";
import { MASTERY_LABELS, Mastery } from "@/lib/data/skills";

const LEGEND: { level: Mastery; dot: string; hint: string }[] = [
  { level: 3, dot: "bg-emerald-500", hint: "ДЗ проверено экспертом" },
  { level: 2, dot: "bg-indigo-600", hint: "ДЗ сдано / уроки пройдены" },
  { level: 1, dot: "bg-sky-500", hint: "Урок просмотрен" },
  { level: 0, dot: "bg-zinc-300", hint: "Ещё не начат" },
];

export default function SkillsPage() {
  const { user } = useUser();
  const { skills, loading } = useSkillData(user?.id, user?.email);

  const mastered = skills.filter((s) => s.mastery === 3).length;
  const avgPercent = skills.length
    ? Math.round((skills.reduce((sum, s) => sum + s.score, 0) / skills.length) * 100)
    : 0;

  const byLevel = (level: Mastery) => skills.filter((s) => s.mastery === level).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Навыки</h1>
        <p className="text-sm text-[#71717a] mt-1">
          Карта компетенций · {mastered} из {skills.length} освоено · {avgPercent}% общий
          уровень
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-40 lg:col-span-3" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Радар */}
          <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-zinc-900 mb-2">Профиль компетенций</h2>
            <div className="flex-1 flex items-center">
              <SkillRadar skills={skills} />
            </div>
          </div>

          {/* Сводка + легенда */}
          <div className="lg:col-span-2 bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 flex flex-col gap-5">
            <div>
              <h2 className="font-semibold text-zinc-900 mb-1">Где ты сейчас</h2>
              <p className="text-sm text-zinc-500">
                Уровень по каждому навыку считается автоматически из просмотра уроков и
                статуса домашних заданий.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {([3, 2, 1, 0] as Mastery[]).map((level) => {
                const dot = LEGEND.find((l) => l.level === level)!.dot;
                return (
                  <div
                    key={level}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                      <span className="text-xs text-zinc-500">{MASTERY_LABELS[level]}</span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-zinc-900">
                      {byLevel(level)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-zinc-100 pt-4">
              <p className="text-xs font-medium text-zinc-400 mb-2">Что значат уровни</p>
              <div className="flex flex-col gap-1.5">
                {LEGEND.map((l) => (
                  <div key={l.level} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${l.dot}`} />
                    <span className="font-medium text-zinc-700">
                      {MASTERY_LABELS[l.level]}
                    </span>
                    <span className="text-zinc-400">— {l.hint}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Карточки навыков */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
