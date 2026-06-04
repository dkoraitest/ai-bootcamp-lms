"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";

type Row = { name: string; points: number };

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // get_leaderboard() — security-definer функция, обходит RLS и
      // отдаёт баллы всех участников из gamification.points
      const { data } = await supabase.rpc("get_leaderboard");

      const result: Row[] = (data ?? [])
        .map((r: { name: string; points: number | null }) => ({
          name: r.name,
          points: r.points ?? 0,
        }))
        .sort((a: Row, b: Row) => b.points - a.points);

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
