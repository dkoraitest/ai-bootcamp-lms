"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";

// Участники буткемпа (user_id из Supabase -> отображаемое имя).
// Баллы берутся напрямую из gamification по user_id.
// Добавить нового участника = одна строка.
const PARTICIPANTS: { id: string; name: string }[] = [
  { id: "e0551c51-3a4e-4bff-8db9-e710dcfe9941", name: "Михаил" },
  { id: "f64508ca-d6ba-4d16-939c-886f7d0685e5", name: "Андрей" },
  { id: "22299325-766b-4303-8a94-7f589938340b", name: "Katerina" },
  { id: "cd8c7d42-f99b-4c89-a6ad-f607dc16838e", name: "Марк" },
  { id: "4266c047-8fe7-4aa2-b5be-2630169488f4", name: "Наталья" },
  { id: "7961abdc-a9d4-474c-9876-1e720303f4c5", name: "Helen" },
  { id: "95c34fc6-0fe3-4c6b-b2f0-d133e43ab34d", name: "Павел" },
  { id: "4d3c772b-a4df-482c-a94b-75dec45320ad", name: "Света" },
];

type Row = { name: string; points: number };

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: gamification } = await supabase
        .from("gamification")
        .select("user_id, points")
        .in(
          "user_id",
          PARTICIPANTS.map((p) => p.id)
        );

      const pointsById = new Map<string, number>();
      for (const g of gamification ?? []) {
        pointsById.set(g.user_id as string, (g.points as number) ?? 0);
      }

      const result: Row[] = PARTICIPANTS.map((p) => ({
        name: p.name,
        points: pointsById.get(p.id) ?? 0,
      })).sort((a, b) => b.points - a.points);

      setRows(result);
    }

    load();
  }, []);

  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">🏆 Лидеры буткемпа</h2>

      {rows === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <div>
          {rows.map((row, i) => {
            const rank = i + 1;
            const isTop3 = rank <= 3;
            return (
              <div
                key={row.name}
                className={`flex items-center justify-between py-3 ${
                  i < rows.length - 1 ? "border-b border-[#e4e4e7]" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 text-center text-sm font-semibold shrink-0 ${
                      isTop3 ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  >
                    {MEDALS[rank] ?? rank}
                  </span>
                  <span
                    className={`truncate ${
                      isTop3 ? "font-medium text-zinc-900" : "text-zinc-700"
                    }`}
                  >
                    {row.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#2563eb] shrink-0 ml-3">
                  {row.points} очков
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
