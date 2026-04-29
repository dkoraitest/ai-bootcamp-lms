type Props = {
  onReset: () => void;
};

export default function MaterialsEmptyState({ onReset }: Props) {
  return (
    <div className="flex flex-col items-center mt-16 text-center">
      <span className="text-4xl">🔍</span>
      <p className="text-zinc-900 font-medium mt-3">Ничего не найдено</p>
      <p className="text-sm text-zinc-500 mt-1">
        Попробуйте изменить фильтры или поисковый запрос
      </p>
      <button
        onClick={onReset}
        className="border border-zinc-300 text-zinc-700 rounded-md px-4 py-2 text-sm mt-4 hover:bg-zinc-50 transition-colors"
      >
        Сбросить фильтры
      </button>
    </div>
  );
}
