"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConfirmError("");

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Этот email уже зарегистрирован");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("gamification").insert({
        user_id: data.user.id,
        points: 0,
        level: 1,
        badges: [],
        quests: [
          { id: 1, name: "Первая неделя",  progress: 0, total: 3, completed: false },
          { id: 2, name: "Кодер-агент",    progress: 0, total: 3, completed: false },
          { id: 3, name: "Строитель ОС",   progress: 0, total: 3, completed: false },
          { id: 4, name: "Агент 5/5",      progress: 0, total: 5, completed: false },
        ],
      });
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-8 w-full max-w-md mx-auto mt-20">
        <div className="text-center mb-6">
          <p className="font-bold text-xl text-zinc-900">AI Agents Bootcamp</p>
          <p className="text-sm text-zinc-500 mt-1">Создай аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Имя
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Александр"
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full text-sm px-3 py-2 pr-10 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Повтор пароля
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повтори пароль"
              className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
            {confirmError && (
              <p className="text-red-600 text-xs mt-1">{confirmError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#2563eb] text-white font-medium text-sm hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Создаём аккаунт...
              </>
            ) : (
              "Создать аккаунт"
            )}
          </button>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
        </form>

        <p className="text-sm text-zinc-500 text-center mt-5">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[#2563eb] hover:underline">
            Войти →
          </Link>
        </p>
      </div>
    </div>
  );
}
