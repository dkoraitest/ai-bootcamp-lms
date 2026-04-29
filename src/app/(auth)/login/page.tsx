"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Подтверди email — мы отправили письмо при регистрации");
      } else {
        setError("Неверный email или пароль");
      }
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-8 w-full max-w-md mx-auto mt-20">
        <div className="text-center mb-6">
          <p className="font-bold text-xl text-zinc-900">AI Agents Bootcamp</p>
          <p className="text-sm text-zinc-500 mt-1">Войди чтобы продолжить</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#2563eb] text-white font-medium text-sm hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Входим...
              </>
            ) : (
              "Войти"
            )}
          </button>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
        </form>

        <p className="text-sm text-zinc-500 text-center mt-5">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[#2563eb] hover:underline">
            Зарегистрироваться →
          </Link>
        </p>
      </div>
    </div>
  );
}
