export type FilterKey = "all" | "active" | "submitted" | "reviewed" | "locked";

type Props = {
  active: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (f: FilterKey) => void;
};

const TABS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "Все" },
  { key: "active",    label: "Активные" },
  { key: "submitted", label: "Сданные" },
  { key: "reviewed",  label: "Проверенные" },
  { key: "locked",    label: "Заблокированные" },
];

export default function AssignmentFilters({ active, counts, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${
            active === tab.key
              ? "bg-[#2563eb] text-white"
              : "bg-white border border-[#e4e4e7] text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {tab.label}
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full ${
              active === tab.key
                ? "bg-white/20 text-white"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}
