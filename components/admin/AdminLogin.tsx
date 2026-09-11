"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { signIn } from "@/app/admin/actions";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-card-lg">
        <Logo />
        <div className="mt-6 flex items-center gap-2 text-navy-900">
          <Lock className="h-5 w-5" />
          <h1 className="text-lg font-bold">Panel de administración</h1>
        </div>
        <p className="mt-1.5 text-sm text-navy-600">
          Ingresá con tu cuenta para editar el cotizador, la promoción, los productos y los
          videos de Instagram.
        </p>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm"
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm"
          />
        </label>

        {error && <p className="mt-2 text-xs font-medium text-brand-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring mt-5 w-full rounded-full bg-navy-900 px-5 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
