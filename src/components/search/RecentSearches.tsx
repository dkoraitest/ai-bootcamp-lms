import { Clock, X } from "lucide-react";

type Props = {
  searches: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
};

export default function RecentSearches({ searches, onSelect, onRemove }: Props) {
  if (searches.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-2">
        Недавние запросы
      </p>
      <div className="flex flex-wrap gap-2">
        {searches.map((term) => (
          <div
            key={term}
            className="flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-sm rounded-full pl-2.5 pr-1.5 py-1.5 group"
          >
            <Clock size={12} className="text-zinc-400 shrink-0" />
            <button onClick={() => onSelect(term)} className="hover:text-zinc-900">
              {term}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(term); }}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-zinc-300 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
