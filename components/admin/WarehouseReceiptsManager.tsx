"use client";

import { useState } from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import type { WarehouseReceiptItem } from "@/lib/data/warehouseReceipts";
import { deleteWarehouseReceiptItem } from "@/app/admin/actions";
import { Banner } from "./Banner";

/**
 * Recibos de almacén (Warehouse Receipts de KGE). Se suben en PDF, la IA
 * extrae descripción, peso y medidas de cada bulto, y esos datos pasan a ser
 * las referencias de peso real que usa el cotizador para estimar.
 *
 * Los PDF se procesan de a uno: cada uno es una llamada a la IA, y en serie
 * es más fácil saber cuál falló.
 */
export function WarehouseReceiptsManager({ initial }: { initial: WarehouseReceiptItem[] }) {
  const [items, setItems] = useState(initial);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setBanner(null);
    setProgress({ done: 0, total: files.length });

    let okCount = 0;
    let skippedCount = 0;
    let itemCount = 0;
    let repeatedItems = 0;
    const failures: string[] = [];

    for (const [index, file] of files.entries()) {
      try {
        const documentBase64 = await fileToBase64(file);
        const res = await fetch("/api/admin/procesar-recibo", {
          method: "POST",
          headers: { "content-type": "application/json" },
          // El nombre del archivo no se manda: puede traer el nombre de la persona.
          body: JSON.stringify({ documentBase64, mediaType: file.type }),
        });
        // Un 413 de Vercel no trae JSON: sin el catch, res.json() tira y se
        // pierde el motivo.
        const data = (await res.json().catch(() => null)) as
          | { items?: WarehouseReceiptItem[]; skipped?: number; error?: string; alreadyLoaded?: boolean }
          | null;

        if (res.ok && data?.items) {
          okCount += 1;
          itemCount += data.items.length;
          repeatedItems += data.skipped ?? 0;
          const nuevos = data.items;
          setItems((prev) => [...nuevos, ...prev]);
        } else if (data?.alreadyLoaded) {
          skippedCount += 1;
        } else {
          const motivo =
            data?.error ?? (res.status === 413 ? "el archivo es muy grande" : `error ${res.status}`);
          failures.push(`${file.name}: ${motivo}`);
        }
      } catch {
        failures.push(`${file.name}: no se pudo enviar`);
      }
      setProgress({ done: index + 1, total: files.length });
    }

    setProgress(null);
    const partes = [
      `${okCount} procesado${okCount === 1 ? "" : "s"} (${itemCount} bulto${itemCount === 1 ? "" : "s"} nuevo${itemCount === 1 ? "" : "s"})`,
      `${skippedCount} ya estaba${skippedCount === 1 ? "" : "n"} cargado${skippedCount === 1 ? "" : "s"}`,
      `${failures.length} con error`,
    ];
    let resumen = `${partes.join(", ")}.`;
    if (repeatedItems > 0) {
      resumen += ` Se omitieron ${repeatedItems} bulto${repeatedItems === 1 ? "" : "s"} que ya estaba${
        repeatedItems === 1 ? "" : "n"
      } cargado${repeatedItems === 1 ? "" : "s"}.`;
    }
    setBanner(
      failures.length === 0
        ? { type: "success", text: resumen }
        : { type: "error", text: `${resumen} ${failures.join(" · ")}` }
    );
  }

  async function handleDelete(item: WarehouseReceiptItem) {
    if (!window.confirm(`¿Borrar "${item.productDescription}" (${item.weightKg} kg)?`)) return;

    setDeletingId(item.id);
    const result = await deleteWarehouseReceiptItem(item.id);
    setDeletingId(null);

    if (result.error) {
      setBanner({ type: "error", text: result.error });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  const uploading = progress !== null;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="text-base font-bold text-navy-900">Recibos de almacén</h2>
      <p className="mt-1 text-sm text-navy-600">
        Subí los Warehouse Receipts en PDF (podés elegir varios de una). El peso real de cada
        bulto pasa a ser referencia para la estimación automática del cotizador.
      </p>

      <label
        className={`focus-ring mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-200 px-4 py-4 text-sm font-semibold text-navy-700 hover:bg-surface-50 ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
        {uploading
          ? `Procesando ${progress.done + 1} de ${progress.total}…`
          : "Elegir recibos en PDF"}
        <input
          type="file"
          accept="application/pdf"
          multiple
          disabled={uploading}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      <Banner banner={banner} />

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 text-left text-xs text-navy-500">
              <th className="py-2 pr-3 font-medium">Producto</th>
              <th className="py-2 pr-3 font-medium">Peso</th>
              <th className="py-2 pr-3 font-medium">Medidas</th>
              <th className="py-2 pr-3 font-medium">Recibo</th>
              <th className="py-2 pr-3 font-medium">Archivo</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-surface-100">
                <td className="py-2 pr-3 text-navy-900">{item.productDescription}</td>
                <td className="py-2 pr-3 whitespace-nowrap text-navy-700">{item.weightKg} kg</td>
                <td className="py-2 pr-3 whitespace-nowrap text-navy-700">
                  {item.dimensionsCm
                    ? `${item.dimensionsCm.largo}×${item.dimensionsCm.ancho}×${item.dimensionsCm.alto} cm`
                    : "—"}
                </td>
                <td className="py-2 pr-3 whitespace-nowrap text-navy-700">{item.receiptNumber ?? "—"}</td>
                <td className="max-w-[12rem] truncate py-2 pr-3 text-xs text-navy-400">
                  {item.sourceFileName ?? "—"}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    aria-label={`Borrar ${item.productDescription}`}
                    className="focus-ring rounded-lg p-1.5 text-navy-400 hover:bg-brand-red-600/10 hover:text-brand-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-navy-500">
                  Todavía no se cargó ningún recibo. Mientras tanto, el cotizador usa las
                  referencias fijas de las guías de FlyCargo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
