import { ChevronRight } from "lucide-react";

const LINKS = [
  { emoji: "💬", label: "Общий чат Telegram" },
  { emoji: "📁", label: "Google Drive с материалами" },
  { emoji: "👤", label: "@alinkasworld — вопросы" },
  { emoji: "👤", label: "@kirarxx — вопросы" },
];

export default function QuickLinks() {
  return (
    <div className="col-span-1 bg-white rounded-[8px] border border-[#e4e4e7] shadow-sm p-6 flex flex-col gap-1">
      <h2 className="font-semibold text-[#18181b] mb-2">Быстрые ссылки</h2>
      <div className="flex flex-col">
        {LINKS.map((link, i) => (
          <a
            key={i}
            href="#"
            className={`flex items-center justify-between py-2.5 hover:bg-zinc-50 cursor-pointer transition-colors px-1 rounded ${
              i < LINKS.length - 1 ? "border-b border-[#e4e4e7]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{link.emoji}</span>
              <span className="text-sm text-[#18181b]">{link.label}</span>
            </div>
            <ChevronRight size={16} className="text-[#71717a] shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
