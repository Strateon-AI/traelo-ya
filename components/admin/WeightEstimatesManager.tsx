"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type { StoredWeightEstimate } from "@/lib/types";
import { updateMeasuredWeight } from "@/app/admin/actions";
import { Banner } from "./Banner";

const FUENTE_LABEL: Record<string, string> = {
  pagina: "Medidas de la tienda",
  producto_mas_embalaje: "Producto + embalaje",
  estimado: "Estimado",
  sin_datos: "Sin datos",
};

/**
 * Acá se cierra el círculo: el peso real que marcó la balanza cuando llegó el
 * paquete. Sin este dato el sistema nunca mejora — se queda estimando igual de
 * bien (o de mal) que el primer día. Con este dato, en un par de meses se sabe
 * exactamente cuánto se desvía el estimado y qué margen conviene aplicar.
 */
export function WeightEstimatesManager({ initial }: { initial: StoredWeightEstimate[] }) {
  const [rows, setRows] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const stats = useMemo(() => {
    const medidos = rows.filter((r) => r.pesoMedidoKg && r.pesoCobrableKg);
    if (medidos.length === 0) return null;

    const cortos = medidos.filter((r) => (r.pesoMedidoKg as number) > (r.pesoCobrableKg?.max ?? 0));
    const desvios = medidos.map((r) => {
      const estimado = r.pesoCobrableKg?.max ?? 0;
      return estimado > 0 ? ((r.pesoMedidoKg as number) - estimado) / estimado : 0;
    });
    const promedio = desvios.reduce((a, b) => a + b, 0) / desvios.length;

    return {
      total: medidos.length,
      cortos: cortos.length,
      desvioPromedio: Math.round(promedio * 1000) / 10,
    };
  }, [rows]);

  async function handleSave(id: string) {
    const raw = drafts[id];
    const value = Number(raw);
    if (!raw || !Number.isFinite(value) || value <= 0) {
      setBanner({ type: "error", text: "Poné un peso válido en kg." });
      return;
    }

    setSavingId(id);
    setBanner(null);
    const result = await updateMeasuredWeight(id, value);
    setSavingId(null);

    if (result.error) {
      setBanner({ type: "error", text: result.error });
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, pesoMedidoKg: value } : r)));
    setDrafts((prev) => ({ ...prev, [id]: "" }));
    setBanner({ type: "success", text: "Peso real guardado." });
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="text-base font-bold text-navy-900">Pesos estimados por link</h2>
      <p className="mt-1 text-sm text-navy-600">
        Cargá acá el peso real cuando el paquete llega al almacén. Es lo que permite medir
        si la estimación automática está sirviendo.
      </p>

      {stats && (
        <div className="mt-4 rounded-2xl border border-surface-200 bg-surface-50 p-3.5 text-sm text-navy-700">
          Sobre {stats.total} paquete{stats.total === 1 ? "" : "s"} ya pesado
          {stats.total === 1 ? "" : "s"}: la estimación se quedó corta en {stats.cortos}, y el
          desvío promedio contra el máximo estimado fue de{" "}
          <span className="font-semibold text-navy-900">
            {stats.desvioPromedio > 0 ? "+" : ""}
            {stats.desvioPromedio}%
          </span>
          .
        </div>
      )}

      <Banner banner={banner} />

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-navy-600">
          Todavía no hay estimaciones guardadas. Se van a ir cargando solas a medida que los
          clientes usen el cotizador con un link.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-2xl border border-surface-200 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-900">
                    {row.producto ?? "Producto sin identificar"}
                  </p>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focus-ring block truncate text-xs text-brand-blue-600 hover:underline"
                  >
                    {row.url}
                  </a>
                </div>
                <span className="shrink-0 rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-navy-700">
                  {FUENTE_LABEL[row.fuente] ?? row.fuente}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="text-navy-600">
                  Estimado:{" "}
                  <span className="font-semibold text-navy-900">
                    {row.pesoCobrableKg
                      ? `${row.pesoCobrableKg.min}–${row.pesoCobrableKg.max} kg`
                      : "—"}
                  </span>
                </span>

                {row.pesoMedidoKg ? (
                  <span className="inline-flex items-center gap-1.5 text-navy-600">
                    Real:{" "}
                    <span className="font-semibold text-navy-900">{row.pesoMedidoKg} kg</span>
                    <Check className="h-4 w-4 text-whatsapp-600" />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={drafts[row.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      placeholder="Peso real kg"
                      className="focus-ring w-32 rounded-xl border border-surface-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(row.id)}
                      disabled={savingId === row.id}
                      className="focus-ring rounded-xl bg-navy-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
                    >
                      {savingId === row.id ? "Guardando…" : "Guardar"}
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
