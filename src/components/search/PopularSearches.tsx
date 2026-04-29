const POPULAR = [
  "Claude Code",
  "промпт формула",
  "vibe coding",
  "CLAUDE.md",
  "MCP",
  "автоматизация",
  "домашнее задание",
  "Skills",
];

type Props = {
  onSelect: (term: string) => void;
};

export default function PopularSearches({ onSelect }: Props) {
  return (
    <div>
      <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-2 mt-4">
        Попробуй поискать
      </p>
      <div className="flex flex-wrap gap-2">
        {POPULAR.map((term) => (
          <button
            key={term}
            onClick={() => onSelect(term)}
            className="bg-zinc-100 text-zinc-700 text-sm rounded-full px-3 py-1.5 hover:bg-zinc-200 cursor-pointer transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
