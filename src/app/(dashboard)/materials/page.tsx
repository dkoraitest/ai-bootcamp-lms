"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import MaterialCard from "@/components/materials/MaterialCard";
import MaterialTabs from "@/components/materials/MaterialTabs";
import WeekFilterPills from "@/components/materials/WeekFilterPills";
import MaterialsEmptyState from "@/components/materials/MaterialsEmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMaterials } from "@/lib/hooks/useContentUrls";
import { type Material } from "@/components/materials/MaterialCard";

type TabKey = "all" | "video" | "template" | "technique";
type WeekValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function matchesSearch(m: Material, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    m.title.toLowerCase().includes(lower) ||
    (m.description ?? "").toLowerCase().includes(lower) ||
    m.lessonTopic.toLowerCase().includes(lower) ||
    (m.markdownContent ?? "").toLowerCase().includes(lower)
  );
}

export default function MaterialsPage() {
  const { data: materials, loading } = useMaterials();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [activeWeek, setActiveWeek] = useState<WeekValue>(0);

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      const matchesTab = activeTab === "all" || m.type === activeTab;
      const matchesWeek = activeWeek === 0 || m.week === activeWeek;
      return matchesTab && matchesWeek && matchesSearch(m, searchQuery);
    });
  }, [materials, searchQuery, activeTab, activeWeek]);

  const tabCounts = useMemo(() => {
    const base = materials.filter(
      (m) =>
        (activeWeek === 0 || m.week === activeWeek) &&
        matchesSearch(m, searchQuery)
    );
    return {
      all:       base.length,
      video:     base.filter((m) => m.type === "video").length,
      template:  base.filter((m) => m.type === "template").length,
      technique: base.filter((m) => m.type === "technique").length,
    };
  }, [materials, searchQuery, activeWeek]);

  const resetFilters = () => {
    setActiveTab("all");
    setActiveWeek(0);
    setSearchQuery("");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-zinc-900">Каталог материалов</h1>
        <p className="text-sm text-[#71717a] mt-1">
          {loading ? "Загрузка..." : `${materials.length} материалов · 6 недель`}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Поиск по материалам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 pl-10 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
        />
      </div>

      {/* Type tabs */}
      <MaterialTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* Week filter pills */}
      <WeekFilterPills activeWeek={activeWeek} onWeekChange={setActiveWeek} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-zinc-500 mb-4">
            {filtered.length} материалов
            {searchQuery ? ` по запросу «${searchQuery}»` : ""}
          </p>

          {/* Grid or empty state */}
          {filtered.length === 0 ? (
            <MaterialsEmptyState onReset={resetFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
