"use client";

import { useState } from "react";
import { Link2, Loader2, Search, Sparkles } from "lucide-react";
import type { WeightEstimate } from "@/lib/types";

/**
 * Pega el link del producto y completa solo el campo de peso del cotizador.
 *
 * El peso que se usa es el MÁXIMO del rango estimado, no el promedio: quedarse
 * corto significa un cliente enojado cuando el paquete se pesa en el almacén,
 * y pasarse significa devolverle la diferencia, que nadie reclama. El error no
 * es simétrico, así que la estimación tampoco va centrada.
 *
 * Si no se puede leer la página automáticamente (tienda bloqueada), no se
 * reintenta con un scraper más caro — eso multiplica el costo por 25. En vez
 * de eso, se le pide al cliente una descripción más completa del producto
 * (marca, modelo, talla, color) y se busca por nombre con Claude. El cliente
 * siempre puede, en cualquier momento, cargar el peso a mano en el campo de
 * abajo — este componente nunca bloquea esa opción.
 */
export function LinkWeightEstimator({
  onWeight,
  productName,
}: {
  onWeight: (kg: number) => void;
  productName: string;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<WeightEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsDetail, setNeedsDetail] = useState(false);
  const [detailText, setDetailText] = useState("");

  async function handleEstimate() {
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);
    setEstimate(null);
    setNeedsDetail(false);

    try {
      const res = await fetch("/api/estimar-peso", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), productName: productName.trim() }),
      });
      const data = (await res.json()) as {
        estimate?: WeightEstimate;
        error?: string;
        canRetryWithDetail?: boolean;
      };

      if (!res.ok || !data.estimate?.pesoCobrableKg) {
        if (data.canRetryWithDetail) {
          setDetailText(productName);
          setNeedsDetail(true);
        } else {
          setError(data.error ?? "No pudimos calcular el peso de ese producto.");
        }
        return;
      }

      setEstimate(data.estimate);
      onWeight(data.estimate.pesoCobrableKg.max);
    } catch {
      setError("No pudimos calcular el peso en este momento.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchWithDetail() {
    if (!detailText.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/estimar-peso", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          productName: detailText.trim(),
          forceSearch: true,
        }),
      });
      const data = (await res.json()) as { estimate?: WeightEstimate; error?: string };

      if (!res.ok || !data.estimate?.pesoCobrableKg) {
        setError(data.error ?? "No pudimos calcular el peso de ese producto.");
        return;
      }

      setNeedsDetail(false);
      setEstimate(data.estimate);
      onWeight(data.estimate.pesoCobrableKg.max);
    } catch {
      setError("No pudimos calcular el peso en este momento.");
    } finally {
      setLoading(false);
    }
  }

  const aproximado = estimate !== null && estimate.fuente !== "pagina";

  return (
    <div className="rounded-2xl border border-brand-blue-500/25 bg-brand-blue-100/30 p-3.5">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-navy-800">
        <Sparkles className="h-4 w-4 text-brand-blue-600" />
        ¿Tenés el link del producto?
      </span>
      <p className="mb-2.5 text-xs leading-relaxed text-navy-600">
        Pegalo y calculamos el peso de envío solo — incluye el tamaño de la caja, que es
        lo que realmente define el costo.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleEstimate();
              }
            }}
            placeholder="https://www.amazon.com/..."
            className="focus-ring w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400"
          />
        </div>
        <button
          type="button"
          onClick={handleEstimate}
          disabled={loading || url.trim().length === 0}
          className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-500 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Calculando…" : "Calcular"}
        </button>
      </div>

      {loading && (
        <p className="mt-2 text-xs text-navy-500">
          Esto puede tardar unos segundos — estamos leyendo la página del producto.
        </p>
      )}

      {needsDetail && !loading && (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="text-sm font-medium text-navy-800">
            No pudimos acceder a esa página automáticamente.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-navy-600">
            Contanos más sobre el producto (marca, modelo, talla, color) y lo buscamos
            igual — mientras más específico, mejor sale la estimación.
          </p>
          <input
            type="text"
            value={detailText}
            onChange={(e) => setDetailText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchWithDetail();
              }
            }}
            placeholder="Ej. Nike Air Max 270, talla 42, negras"
            className="focus-ring mt-2 w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
          />
          <button
            type="button"
            onClick={handleSearchWithDetail}
            disabled={loading || detailText.trim().length === 0}
            className="focus-ring mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Buscando…" : "Buscar este producto"}
          </button>
          <p className="mt-2 text-xs text-navy-500">
            También podés cargar el peso a mano abajo si preferís.
          </p>
        </div>
      )}

      {estimate?.pesoCobrableKg && (
        <div className="mt-3 rounded-xl bg-white p-3">
          {estimate.producto && (
            <p className="text-sm font-semibold text-navy-900">{estimate.producto}</p>
          )}
          <p className="mt-0.5 text-sm text-navy-700">
            Peso de envío estimado:{" "}
            <span className="font-bold text-navy-900">
              {estimate.pesoCobrableKg.min} a {estimate.pesoCobrableKg.max} kg
            </span>
          </p>
          <p className="mt-1 text-xs text-navy-500">
            {aproximado
              ? "Es un aproximado: la tienda no publica las medidas del paquete. Podés ajustarlo abajo."
              : "Calculado con las medidas del paquete que publica la tienda."}
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-xs font-medium text-brand-red-600">{error}</p>}
    </div>
  );
}
