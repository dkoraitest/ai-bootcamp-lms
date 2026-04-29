"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { emoji: "🏠", label: "Главная", href: "/" },
  { emoji: "📅", label: "Программа", href: "/program" },
  { emoji: "📚", label: "Материалы", href: "/materials" },
  { emoji: "✅", label: "Задания", href: "/assignments" },
  { emoji: "🧠", label: "Навыки", href: "/skills" },
  { emoji: "📊", label: "Прогресс", href: "/progress" },
  { emoji: "👥", label: "Пир-ревью", href: "/peer-review" },
  { emoji: "🔍", label: "Поиск", href: "/search" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e4e4e7] z-50">
      <div className="flex overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 min-w-[64px] text-center transition-colors ${
                isActive ? "text-[#2563eb]" : "text-[#71717a]"
              }`}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span className="text-[10px] leading-tight whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
