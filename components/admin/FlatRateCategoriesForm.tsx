"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { FlatRateCategory } from "@/lib/types";
import { updateFlatRateCategory } from "@/app/admin/actions";
import { Banner } from "./Banner";

export function FlatRateCategoriesForm({ initial }: { initial: FlatRateCategory[] }) {
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(initial.map((c) => [c.id, c.priceUsd]))
  );
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setBanner(null);
    const results = await Promise.all(
      initial.map((category) => updateFlatRateCategory(category.id, prices[category.id] ?? category.priceUsd))
    );
    setSaving(false);
    const firstError = results.find((r) => r.error);
    setBanner(
      firstError
        ? { type: "error", text: firstError.error as string }
        : { type: "success", text: "Tarifas fijas guardadas." }
    );
  }

  if (initial.length === 0) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
        <h2 className="text-base font-bold text-navy-900">Tarifas fijas por categoría</h2>
        <p className="mt-1 text-sm text-navy-600">
          Todavía no hay categorías cargadas en la base — avisale a Strateon.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="text-base font-bold text-navy-900">Tarifas fijas por categoría</h2>
      <p className="mt-1 text-sm text-navy-600">
        Reemplazan el cálculo por peso para estas categorías — el cliente ve este monto
        directo en el cotizador, sin pasar por kilos. Se revisan mes a mes.
      </p>
      <Banner banner={banner} />

      <div className="mt-4 space-y-2.5">
        {initial.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-surface-200 px-3.5 py-2.5"
          >
            <span className="text-sm font-medium text-navy-800">{category.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-navy-500">US$</span>
              <input
                type="number"
                min={0}
                step="1"
                value={prices[category.id] ?? category.priceUsd}
                onChange={(e) =>
                  setPrices((prev) => ({ ...prev, [category.id]: Number(e.target.value) || 0 }))
                }
                className="focus-ring w-24 rounded-xl border border-surface-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Guardando…" : "Guardar tarifas fijas"}
      </button>
    </section>
  );
}
