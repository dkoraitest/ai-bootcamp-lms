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
  query: string;
  onSelect: (term: string) => void;
  onClear: () => void;
};

export default function SearchNoResults({ query, onSelect, onClear }: Props) {
  const suggestions = POPULAR.filter(
    (t) => t.toLowerCase() !== query.toLowerCase()
  ).slice(0, 3);

  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <span className="text-4xl">🔍</span>
      <p className="font-semibold text-zinc-900 mt-3">Ничего не найдено</p>
      <p className="text-sm text-zinc-500 mt-1">По запросу «{query}» ничего не нашлось</p>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-zinc-500 mb-2">Попробуй:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((term) => (
              <button
                key={term}
                onClick={() => onSelect(term)}
                className="bg-zinc-100 text-zinc-700 text-sm rounded-full px-3 py-1.5 hover:bg-zinc-200 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClear}
        className="mt-4 border border-zinc-300 text-zinc-700 rounded-lg px-4 py-2 text-sm hover:bg-zinc-50 transition-colors"
      >
        Очистить поиск
      </button>
    </div>
  );
}
