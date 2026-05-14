"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { emoji: "🏠", label: "Главная",           href: "/" },
  { emoji: "📅", label: "Программа",         href: "/program" },
  { emoji: "📚", label: "Каталог материалов", href: "/materials" },
  { emoji: "✅", label: "Домашние задания",   href: "/assignments" },
  { emoji: "🧠", label: "Навыки",            href: "/skills" },
  { emoji: "📊", label: "Мой прогресс",      href: "/progress" },
  { emoji: "👥", label: "Пир-ревью",         href: "/peer-review" },
  { emoji: "🔍", label: "Поиск",             href: "/search" },
];

type Props = {
  userName?: string;
};

export default function Sidebar({ userName }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-[#e4e4e7] h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-[#e4e4e7] bg-gradient-to-r from-[#4f46e5] to-[#6366f1]">
        <span className="font-semibold text-white text-base">AI Agents Bootcamp</span>
        {userName && (
          <p className="text-xs text-indigo-200 mt-0.5 truncate">{userName}</p>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#4f46e5] rounded-full" />
              )}
              <span className="text-base leading-none">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-zinc-200">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm text-zinc-500 hover:text-red-600 rounded-[6px] hover:bg-zinc-50 transition-colors"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
