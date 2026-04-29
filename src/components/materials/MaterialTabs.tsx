type TabKey = "all" | "video" | "template" | "technique" | "resource";

type Counts = Record<TabKey, number>;

type Props = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  counts: Counts;
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",       label: "Все" },
  { key: "video",     label: "📹 Видео" },
  { key: "template",  label: "📄 Шаблоны" },
  { key: "technique", label: "💡 Техники" },
  { key: "resource",  label: "📦 Ресурсы" },
];

export default function MaterialTabs({ activeTab, onTabChange, counts }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 mb-3 scrollbar-hide">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center whitespace-nowrap px-4 py-2 text-sm rounded-lg transition-colors ${
            activeTab === tab.key
              ? "bg-white border border-zinc-300 text-zinc-900 font-medium shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          {tab.label}
          <span className="bg-zinc-100 text-zinc-500 text-xs rounded-full px-1.5 ml-1.5">
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}
