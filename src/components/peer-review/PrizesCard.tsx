const PRIZES = [
  {
    medal: "🥇",
    place: "1 место",
    prize: "Подписка Claude Max",
    note: "Главный приз",
    highlight: true,
  },
  {
    medal: "🥈",
    place: "2 место",
    prize: "Сюрприз",
    note: "Подарок пока секрет",
    highlight: false,
  },
  {
    medal: "🥉",
    place: "3 место",
    prize: "Сюрприз",
    note: "Подарок пока секрет",
    highlight: false,
  },
];

export default function PrizesCard() {
  return (
    <div className="bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 mb-4">
      <h2 className="font-semibold text-zinc-900 mb-4">🎁 Призы лидерам</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PRIZES.map((p) => (
          <div
            key={p.place}
            className={`rounded-[10px] border p-4 flex flex-col gap-1 ${
              p.highlight
                ? "border-[#4f46e5] bg-[#4f46e5]/[0.04]"
                : "border-[#e4e4e7]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{p.medal}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-[#a1a1aa]">
                {p.place}
              </span>
            </div>
            <p
              className={`font-semibold leading-snug ${
                p.highlight ? "text-[#4f46e5]" : "text-zinc-900"
              }`}
            >
              {p.prize}
            </p>
            <p className="text-xs text-[#71717a]">{p.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
