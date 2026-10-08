"use client";

import { useState } from "react";
import { Camera, Info, Link2, Loader2, Search, Sparkles } from "lucide-react";
import type { ScreenshotEstimate, WeightEstimate } from "@/lib/types";
import { FACTOR_CAJA_GRANDE } from "@/lib/weightEstimate";
import { ALLOWED_STORES_LABEL, isAllowedProductHost, isShortLink } from "@/lib/productUrl";

/**
 * Calcula el peso de envío de un producto y completa el campo de peso del
 * cotizador. Dos entradas: una captura de la página (la opción principal,
 * sirve para cualquier tienda) o el link (solo las tiendas de la lista blanca
 * de lib/productUrl.ts).
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
 *
 * Alternativa al link: subir una captura de pantalla de la página. De ahí se
 * lee nombre y precio (que se cargan en la línea vía `onProductInfo`) y el
 * peso se estima por categoría. La imagen se comprime en el navegador antes
 * de mandarla, para no chocar con el límite de tamaño de Vercel.
 */
type LinkCheck = "ok" | "tienda_no_soportada" | "no_es_link";

/**
 * Chequeo en el navegador antes de gastar la llamada. Es la misma lista
 * blanca que aplica el servidor (lib/productUrl.ts). Los links cortos
 * (a.co, amzn.to) pasan: a dónde llevan solo se sabe resolviéndolos, y eso
 * lo hace el servidor.
 */
function checkLink(raw: string): LinkCheck {
  const value = raw.trim();
  if (!value) return "ok";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "no_es_link";
  } catch {
    return "no_es_link";
  }
  if (isShortLink(value) || isAllowedProductHost(value)) return "ok";
  return "tienda_no_soportada";
}

export function LinkWeightEstimator({
  onWeight,
  onProductInfo,
  productName,
}: {
  onWeight: (kg: number) => void;
  onProductInfo?: (info: { productName?: string; unitPrice?: number }) => void;
  productName: string;
}) {
  // La captura es la opción principal: sirve para cualquier tienda, el link
  // solo para las de la lista blanca.
  const [mode, setMode] = useState<"link" | "captura">("captura");
  const [linkCheck, setLinkCheck] = useState<LinkCheck>("ok");
  const [screenshot, setScreenshot] = useState<ScreenshotEstimate | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<WeightEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsDetail, setNeedsDetail] = useState(false);
  const [detailText, setDetailText] = useState("");
  const [showVolumetricInfo, setShowVolumetricInfo] = useState(false);

  function switchToScreenshot() {
    setMode("captura");
    setLinkCheck("ok");
    setError(null);
  }

  async function handleEstimate() {
    if (!url.trim() || loading) return;

    const check = checkLink(url);
    setLinkCheck(check);
    if (check !== "ok") return;

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
        } else if (res.status === 400) {
          // En /api/estimar-peso, un 400 es siempre "esa tienda no la
          // leemos" (link directo o link corto que lleva a otra tienda).
          setLinkCheck("tienda_no_soportada");
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

  async function handleScreenshot(file: File | undefined) {
    if (!file || loading) return;

    setLoading(true);
    setError(null);
    setEstimate(null);
    setScreenshot(null);
    setNeedsDetail(false);

    try {
      const imageBase64 = await compressImage(file);
      const res = await fetch("/api/estimar-desde-imagen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType: "image/jpeg" }),
      });
      const data = (await res.json().catch(() => null)) as
        | { estimate?: ScreenshotEstimate; error?: string }
        | null;

      if (!res.ok || !data?.estimate?.pesoCobrableKg) {
        setError(data?.error ?? "No pudimos leer esa captura.");
        return;
      }

      setScreenshot(data.estimate);
      onWeight(data.estimate.pesoCobrableKg.max);
      onProductInfo?.({
        productName: data.estimate.producto ?? undefined,
        unitPrice: data.estimate.precioUsd ?? undefined,
      });
    } catch {
      setError("No pudimos procesar esa imagen. Probá con otra captura.");
    } finally {
      setLoading(false);
    }
  }

  const aproximado = estimate !== null && estimate.fuente !== "pagina";
  const promedioAplicado =
    estimate !== null &&
    estimate.pesoRealKg !== null &&
    estimate.pesoVolumetricoKg !== null &&
    estimate.pesoRealKg > 0 &&
    estimate.pesoVolumetricoKg / estimate.pesoRealKg >= FACTOR_CAJA_GRANDE;

  return (
    <div className="rounded-2xl border border-brand-blue-500/25 bg-brand-blue-100/30 p-3.5">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-navy-800">
        <Sparkles className="h-4 w-4 text-brand-blue-600" />
        ¿Querés que calculemos el peso por vos?
      </span>

      <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl bg-white p-1">
        {(
          [
            { id: "captura", label: "Subir captura", hint: "Funciona con cualquier tienda", icon: Camera },
            { id: "link", label: "Pegar link", hint: `Solo ${ALLOWED_STORES_LABEL}`, icon: Link2 },
          ] as const
        ).map(({ id, label, hint, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setError(null);
            }}
            aria-pressed={mode === id}
            className={`focus-ring flex flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition-colors ${
              mode === id ? "bg-brand-blue-600 text-white" : "text-navy-700 hover:bg-surface-50"
            }`}
          >
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
            <span
              className={`mt-0.5 text-[11px] leading-snug ${
                mode === id ? "text-white/80" : "text-navy-500"
              }`}
            >
              {hint}
            </span>
          </button>
        ))}
      </div>

      <p className="mb-1 text-xs leading-relaxed text-navy-600">
        {mode === "link"
          ? `Pegá el link y calculamos el peso solos. Por ahora solo leemos links de ${ALLOWED_STORES_LABEL}. Si es de otra tienda, usá la captura.`
          : "Sacale una captura a la página del producto (desde tu cel o compu) y la subís acá. Leemos el nombre y el precio, y estimamos el peso. Sirve para cualquier tienda."}
      </p>

      <button
        type="button"
        onClick={() => setShowVolumetricInfo((prev) => !prev)}
        className="focus-ring mb-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:underline"
      >
        <Info className="h-3.5 w-3.5" />
        ¿Qué es el peso volumétrico?
      </button>
      {showVolumetricInfo && (
        <p className="mb-2.5 rounded-lg bg-white p-2.5 text-xs leading-relaxed text-navy-600">
          Algunas cajas ocupan mucho espacio aunque pesen poco. Por eso el transporte
          internacional se calcula con el que sea mayor entre el peso real y el peso
          volumétrico (un cálculo basado en las medidas de la caja) — así se cobra el
          espacio real que ocupa en el avión, no solo el peso.
        </p>
      )}

      {mode === "captura" && (
        <label className="focus-ring flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-blue-500/40 bg-white px-4 py-3 text-sm font-semibold text-brand-blue-600 hover:bg-brand-blue-100/40">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {loading ? "Leyendo la captura…" : "Elegir captura"}
          <input
            type="file"
            accept="image/*"
            disabled={loading}
            className="sr-only"
            onChange={(e) => {
              handleScreenshot(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {mode === "captura" && (
        <p className="mt-1.5 text-xs text-navy-500">Tiene que verse el precio en la captura.</p>
      )}

      {mode === "link" && (
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (linkCheck !== "ok") setLinkCheck("ok");
            }}
            onPaste={(e) => setLinkCheck(checkLink(e.clipboardData.getData("text")))}
            onBlur={() => setLinkCheck(checkLink(url))}
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
      )}

      {mode === "link" && linkCheck === "tienda_no_soportada" && (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs leading-relaxed text-amber-900">
            Esa tienda no la podemos leer por link. Subí una captura de la página y lo calculamos
            igual.
          </p>
          <button
            type="button"
            onClick={switchToScreenshot}
            className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue-500"
          >
            <Camera className="h-3.5 w-3.5" />
            Subir captura
          </button>
        </div>
      )}
      {mode === "link" && linkCheck === "no_es_link" && (
        <p className="mt-2 text-xs text-navy-600">
          Eso no parece un link. Copiá la dirección completa de la página del producto (empieza
          con https://).
        </p>
      )}

      {loading && mode === "link" && (
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
            Para continuar con tu cotización, necesitamos estos datos del producto: marca,
            modelo, talla y color (si aplica).
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

          {promedioAplicado && estimate.pesoRealKg !== null && estimate.pesoVolumetricoKg !== null && (
            <div className="mt-2 rounded-lg bg-brand-blue-100/40 p-2.5 text-xs text-navy-700">
              <p className="font-semibold text-navy-800">
                Este producto pesa poco pero ocupa mucho espacio, así que se cobra el
                promedio entre los dos:
              </p>
              <p className="mt-1">Peso real: {estimate.pesoRealKg} kg</p>
              <p>Peso volumétrico: {estimate.pesoVolumetricoKg} kg</p>
              <p className="font-semibold">
                Promedio: {Math.round(((estimate.pesoRealKg + estimate.pesoVolumetricoKg) / 2) * 100) / 100} kg
              </p>
              <p className="mt-1 text-navy-500">
                El peso estimado de arriba parte de ese promedio, con un pequeño margen
                hasta que se pese el paquete en el almacén.
              </p>
            </div>
          )}

          <p className="mt-1 text-xs text-navy-500">
            {aproximado
              ? "Es un aproximado: la tienda no publica las medidas del paquete. Podés ajustarlo abajo."
              : "Calculado con las medidas del paquete que publica la tienda."}
          </p>
        </div>
      )}

      {screenshot?.pesoCobrableKg && (
        <div className="mt-3 rounded-xl bg-white p-3">
          {screenshot.producto && (
            <p className="text-sm font-semibold text-navy-900">{screenshot.producto}</p>
          )}
          {screenshot.precioUsd !== null && (
            <p className="mt-0.5 text-sm text-navy-700">
              Precio en la captura:{" "}
              <span className="font-bold text-navy-900">US$ {screenshot.precioUsd.toFixed(2)}</span>
            </p>
          )}
          <p className="mt-0.5 text-sm text-navy-700">
            Peso de envío estimado:{" "}
            <span className="font-bold text-navy-900">
              {screenshot.pesoCobrableKg.min} a {screenshot.pesoCobrableKg.max} kg
            </span>
          </p>
          <p className="mt-1 text-xs text-navy-500">
            Es un aproximado por tipo de producto — una captura no muestra las medidas de la caja.
            Revisá el nombre y el precio abajo, y ajustalos si hace falta.
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-xs font-medium text-brand-red-600">{error}</p>}
    </div>
  );
}

/**
 * Achica la captura antes de mandarla: lado máximo 1600px, JPEG al 80%.
 * Una captura de celular puede pesar varios MB; así queda en unos cientos de
 * KB, que es lo que entra cómodo en una función de Vercel y sigue siendo
 * perfectamente legible para el modelo. Devuelve el base64 sin el prefijo
 * `data:`.
 */
async function compressImage(file: File): Promise<string> {
  const MAX_SIDE = 1600;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("imagen ilegible"));
      el.src = url;
    });

    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sin canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return dataUrl.split(",")[1] ?? "";
  } finally {
    URL.revokeObjectURL(url);
  }
}
