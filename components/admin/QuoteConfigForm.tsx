"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { QuoteConfig } from "@/lib/types";
import { updateQuoteConfig } from "@/app/admin/actions";
import { Banner } from "./Banner";

export function QuoteConfigForm({ initial }: { initial: QuoteConfig }) {
  const [weightRatePerKg, setWeightRatePerKg] = useState(initial.weightRatePerKg);
  const [commissionPercent, setCommissionPercent] = useState(initial.commissionPercent);
  const [commissionEnabled, setCommissionEnabled] = useState(initial.commissionEnabled);
  const [volumetricDivisor, setVolumetricDivisor] = useState(initial.volumetricDivisor);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setSaving(true);
    setBanner(null);
    const result = await updateQuoteConfig({
      weightRatePerKg,
      commissionPercent,
      commissionEnabled,
      volumetricDivisor,
    });
    setSaving(false);
    setBanner(
      result.error
        ? { type: "error", text: result.error }
        : { type: "success", text: "Tarifas guardadas." }
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="text-base font-bold text-navy-900">Tarifas del cotizador</h2>
      <p className="mt-1 text-sm text-navy-600">Se usan en el cotizador de la home.</p>
      <Banner banner={banner} />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">
            Tarifa por peso (US$ por kg)
          </span>
          <input
            type="number"
            min={0}
            step="0.1"
            value={weightRatePerKg}
            onChange={(e) => setWeightRatePerKg(Number(e.target.value) || 0)}
            className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">
            Comisión &quot;Compramos por vos&quot; (%)
          </span>
          <input
            type="number"
            min={0}
            step="0.1"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(Number(e.target.value) || 0)}
            className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-semibold text-navy-800">
          Divisor volumétrico del courier
        </span>
        <input
          type="number"
          min={1}
          step="1"
          value={volumetricDivisor}
          onChange={(e) => setVolumetricDivisor(Number(e.target.value) || 0)}
          className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm sm:w-1/2"
        />
        <span className="mt-1 block text-xs text-navy-500">
          Se usa para estimar el peso desde el link del producto: (largo × ancho × alto en
          cm) ÷ este número. Lo define el courier — normalmente 5000 o 6000. Si está mal,
          todas las cotizaciones salen mal parejo.
        </span>
      </label>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-2xl border border-surface-200 p-3.5 text-sm">
        <input
          type="checkbox"
          checked={commissionEnabled}
          onChange={(e) => setCommissionEnabled(e.target.checked)}
          className="focus-ring mt-0.5 h-4 w-4 rounded border-surface-200 text-brand-blue-600"
        />
        <span>
          <span className="block font-semibold text-navy-900">
            Calcular la comisión en el cotizador
          </span>
          <span className="mt-0.5 block text-xs text-navy-500">
            Activado: el cliente ve el monto exacto de la comisión sumado al total (pide el
            precio del producto). Desactivado: solo se avisa que se cobra un % extra, y se
            coordina el monto por WhatsApp.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Guardando…" : "Guardar tarifas"}
      </button>
    </section>
  );
}
