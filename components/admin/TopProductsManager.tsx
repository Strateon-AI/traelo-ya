"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { TopProduct } from "@/lib/types";
import { deleteTopProduct, upsertTopProduct } from "@/app/admin/actions";
import { ImageUploadField } from "./ImageUploadField";
import { Banner } from "./Banner";

type DraftProduct = TopProduct & { isNew?: boolean };

export function TopProductsManager({ initial }: { initial: TopProduct[] }) {
  const [products, setProducts] = useState<DraftProduct[]>(initial);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function update(id: string, patch: Partial<DraftProduct>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function addProduct() {
    const draft: DraftProduct = {
      id: `nuevo-${crypto.randomUUID()}`,
      name: "Nuevo producto",
      price: null,
      imageUrl: null,
      sortOrder: products.length + 1,
      visible: true,
      isNew: true,
    };
    setProducts((prev) => [...prev, draft]);
  }

  async function save(product: DraftProduct) {
    setSavingId(product.id);
    setBanner(null);
    const result = await upsertTopProduct({
      id: product.isNew ? null : product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      sortOrder: product.sortOrder,
      visible: product.visible,
    });
    setSavingId(null);
    if (result.error) {
      setBanner({ type: "error", text: result.error });
      return;
    }
    setBanner({ type: "success", text: `"${product.name}" guardado.` });
    // Recargar para reemplazar el id temporal por el real si era nuevo.
    if (product.isNew) window.location.reload();
  }

  async function remove(product: DraftProduct) {
    if (product.isNew) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      return;
    }
    setSavingId(product.id);
    const result = await deleteTopProduct(product.id);
    setSavingId(null);
    if (result.error) {
      setBanner({ type: "error", text: result.error });
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-navy-900">Productos más vendidos</h2>
          <p className="mt-1 text-sm text-navy-600">
            Se muestran en la home. Fotos genéricas de arranque — cambialas cuando quieras.
          </p>
        </div>
        <button
          type="button"
          onClick={addProduct}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-brand-blue-100 px-3.5 py-2 text-xs font-semibold text-brand-blue-600 hover:bg-brand-blue-100/70"
        >
          <Plus className="h-4 w-4" />
          Agregar producto
        </button>
      </div>

      <Banner banner={banner} />

      <div className="mt-5 space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="grid grid-cols-1 gap-4 rounded-2xl border border-surface-200 p-4 sm:grid-cols-[auto_1fr_auto]"
          >
            <ImageUploadField
              imageUrl={product.imageUrl}
              onChange={(url) => update(product.id, { imageUrl: url })}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-navy-600">Nombre</span>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => update(product.id, { name: e.target.value })}
                  className="focus-ring w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-navy-600">
                  Precio (US$, opcional)
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={product.price ?? ""}
                  onChange={(e) =>
                    update(product.id, {
                      price: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="focus-ring w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 pt-6 text-xs font-medium text-navy-700">
                <input
                  type="checkbox"
                  checked={product.visible}
                  onChange={(e) => update(product.id, { visible: e.target.checked })}
                  className="h-4 w-4"
                />
                Visible en la home
              </label>
            </div>

            <div className="flex items-start justify-end gap-1 sm:items-center">
              <button
                type="button"
                onClick={() => save(product)}
                disabled={savingId === product.id}
                aria-label="Guardar"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-brand-blue-600 hover:bg-brand-blue-100/60 disabled:opacity-60"
              >
                <Save className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(product)}
                disabled={savingId === product.id}
                aria-label="Eliminar"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-navy-400 hover:bg-brand-red-600/10 hover:text-brand-red-600"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
