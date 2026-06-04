"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";

// Участники буткемпа (email -> отображаемое имя).
// Добавить нового участника = одна строка.
const PARTICIPANTS: Record<string, string> = {
  "0801@lincer.ru": "Михаил",
  "a.golukhov@gmail.com": "Андрей",
  "katerina.wibd@gmail.com": "Katerina",
  "markukhin@gmail.com": "Марк",
  "nkrasovskaya@swordfishsecurity.ru": "Наталья",
  "panchenkoed2010@gmail.com": "Helen",
  "pv12@inbox.ru": "Павел",
  "s.karataeva@reksma.ru": "Света",
};

type Row = { name: string; points: number };

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const emails = Object.keys(PARTICIPANTS);

      const { data: users } = await supabase
        .from("users")
        .select("id, email")
        .in("email", emails);

      const idToEmail = new Map<string, string>(
        (users ?? []).map((u) => [u.id as string, u.email as string])
      );

      const { data: gamification } = await supabase
        .from("gamification")
        .select("user_id, points")
        .in("user_id", Array.from(idToEmail.keys()));

      const pointsByEmail = new Map<string, number>();
      for (const g of gamification ?? []) {
        const email = idToEmail.get(g.user_id as string);
        if (email) pointsByEmail.set(email, (g.points as number) ?? 0);
      }

      const result: Row[] = emails
        .map((email) => ({
          name: PARTICIPANTS[email],
          points: pointsByEmail.get(email) ?? 0,
        }))
        .sort((a, b) => b.points - a.points);

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
