"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RegistrationStatus } from "@/lib/types/admin";

// «@username», «t.me/username», «https://t.me/username» → «@username»
function normalizeTelegram(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return "";
  const fromLink = trimmed.match(/t\.me\/(.+)$/i);
  const handle = (fromLink ? fromLink[1] : trimmed).replace(/^@/, "");
  return handle ? `@${handle}` : "";
}

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatStart(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [status, setStatus] = useState<RegistrationStatus>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Между потоками набор закрыт: показываем это до формы, а не после
  // того, как человек её заполнил.
  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_registration_status");
      if (cancelled) return;

      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setStatus({
          cohortId: row.cohort_id as string,
          cohortName: row.cohort_name as string,
          startsAt: (row.starts_at as string) ?? null,
        });
      }
      setStatusLoading(false);
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

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

    const handle = normalizeTelegram(telegram);
    if (!handle) {
      setError("Укажите ник в Telegram — через него куратор добавит вас в чат потока");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Профиль, участие в потоке и строку геймификации создаёт триггер
    // on_auth_user_created_cohort_bootstrap: клиент в таблицы не пишет.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim(), telegram: handle } },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Этот email уже зарегистрирован");
      } else if (signUpError.message.includes("registration_closed")) {
        setError("Набор в поток закрыт. Напишите куратору, если это ошибка.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/");
  }

  const isOpen = Boolean(status);

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-8 w-full max-w-md mx-auto mt-20">
        <div className="text-center mb-6">
          <p className="font-bold text-xl text-zinc-900">AI Agents Bootcamp</p>
          {statusLoading ? (
            <p className="text-sm text-zinc-400 mt-1">Проверяем набор...</p>
          ) : status ? (
            <p className="text-sm text-zinc-500 mt-1">
              Регистрация в «{status.cohortName}»
              {status.startsAt ? `, старт ${formatStart(status.startsAt)}` : ""}
            </p>
          ) : (
            <p className="text-sm text-zinc-500 mt-1">Набор закрыт</p>
          )}
        </div>

        {!statusLoading && !isOpen ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-zinc-600">
              Сейчас набор в поток закрыт. Если вы уже участник — войдите в свой аккаунт.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-lg bg-[#4f46e5] text-white font-medium text-sm hover:bg-[#4338ca] transition-colors"
            >
              Войти
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Имя и фамилия</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Александр Иванов"
                className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Telegram</label>
              <input
                type="text"
                required
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
                className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Через него куратор добавит вас в чат потока
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="w-full text-sm px-3 py-2 pr-10 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
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
              <label className="block text-xs font-medium text-zinc-700 mb-1">Повтор пароля</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повтори пароль"
                className="w-full text-sm px-3 py-2 border border-[#e4e4e7] rounded-[4px] focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              />
              {confirmError && <p className="text-red-600 text-xs mt-1">{confirmError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#4f46e5] text-white font-medium text-sm hover:bg-[#4338ca] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </form>
        )}

        <p className="text-sm text-zinc-500 text-center mt-5">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[#4f46e5] hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
