"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { emoji: "🏠", label: "Главная", href: "/" },
  { emoji: "📅", label: "Программа", href: "/program" },
  { emoji: "📚", label: "Каталог материалов", href: "/materials" },
  { emoji: "✅", label: "Домашние задания", href: "/assignments" },
  { emoji: "🧠", label: "Навыки", href: "/skills" },
  { emoji: "📊", label: "Мой прогресс", href: "/progress" },
  { emoji: "👥", label: "Пир-ревью", href: "/peer-review" },
  { emoji: "🔍", label: "Поиск", href: "/search" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-[#e4e4e7] h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-[#e4e4e7]">
        <span className="font-semibold text-[#18181b] text-base">AI Agents Bootcamp</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm transition-colors ${
                isActive
                  ? "bg-[#f7f7f8] text-[#18181b] font-medium"
                  : "text-[#71717a] hover:bg-[#f7f7f8] hover:text-[#18181b]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2563eb] rounded-full" />
              )}
              <span className="text-base leading-none">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
