"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import type { Promo } from "@/lib/types";
import { updatePromo } from "@/app/admin/actions";
import { ImageUploadField } from "./ImageUploadField";
import { Banner } from "./Banner";

const EMPTY_PROMO: Promo = {
  title: "",
  description: "",
  imageUrl: null,
  ctaText: "Escríbenos por WhatsApp",
  startsAt: null,
  endsAt: null,
  active: false,
};

// Los <input type="datetime-local"> trabajan en hora local del navegador,
// sin segundos ni zona horaria — conviene guardarlas así tal cual se
// escriben. Igual que en La Tienda, la vigencia se calcula en cada
// visita (ver lib/data/promo.ts), no al guardar, así que una promo vencida
// deja de mostrarse sola sin tener que hacer nada.
function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function PromoForm({ initial }: { initial: Promo | null }) {
  const base = initial ?? EMPTY_PROMO;
  const [title, setTitle] = useState(base.title);
  const [description, setDescription] = useState(base.description);
  const [imageUrl, setImageUrl] = useState<string | null>(base.imageUrl);
  const [ctaText, setCtaText] = useState(base.ctaText);
  const [startsAt, setStartsAt] = useState(toLocalInputValue(base.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInputValue(base.endsAt));
  const [active, setActive] = useState(base.active);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const status = !active
    ? "Inactiva"
    : startsAt && new Date(startsAt) > new Date()
    ? "Programada"
    : endsAt && new Date(endsAt) < new Date()
    ? "Vencida"
    : "Vigente ahora";

  async function handleSave() {
    setSaving(true);
    setBanner(null);
    const result = await updatePromo({
      title,
      description,
      imageUrl,
      ctaText,
      startsAt: fromLocalInputValue(startsAt),
      endsAt: fromLocalInputValue(endsAt),
      active,
    });
    setSaving(false);
    setBanner(
      result.error
        ? { type: "error", text: result.error }
        : { type: "success", text: "Promoción guardada." }
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-navy-900">Promoción</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            status === "Vigente ahora"
              ? "bg-whatsapp-600/15 text-whatsapp-700"
              : status === "Programada"
              ? "bg-brand-blue-100 text-brand-blue-600"
              : status === "Vencida"
              ? "bg-surface-200 text-navy-500"
              : "bg-surface-100 text-navy-500"
          }`}
        >
          {status}
        </span>
      </div>
      <p className="mt-1 text-sm text-navy-600">
        Aparece como una franja debajo del menú mientras esté vigente. Sin fechas: dura hasta
        que la apagues a mano.
      </p>
      <Banner banner={banner} />

      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-800">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4"
          />
          Promoción activa
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">Título</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Envío gratis en tu primer pedido"
            className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm placeholder:text-navy-400"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">Descripción</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Válido hasta fin de mes, escribinos para aprovecharla"
            className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm placeholder:text-navy-400"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">Texto del botón</span>
          <input
            type="text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-navy-800">Imagen (opcional)</span>
          <ImageUploadField imageUrl={imageUrl} onChange={setImageUrl} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-800">
              Empieza (opcional)
            </span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy-800">
              Termina (opcional)
            </span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="focus-ring w-full rounded-xl border border-surface-200 px-3.5 py-2.5 text-sm"
            />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Guardando…" : "Guardar promoción"}
      </button>
    </section>
  );
}
