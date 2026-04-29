import RecentSearches from "./RecentSearches";
import PopularSearches from "./PopularSearches";

type Props = {
  recentSearches: string[];
  onSelect: (term: string) => void;
  onRemoveRecent: (term: string) => void;
};

export default function SearchEmptyState({ recentSearches, onSelect, onRemoveRecent }: Props) {
  return (
    <div className="mt-6">
      <RecentSearches
        searches={recentSearches}
        onSelect={onSelect}
        onRemove={onRemoveRecent}
      />
      <PopularSearches onSelect={onSelect} />
    </div>
  );
}
