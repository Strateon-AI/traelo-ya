"use client";

import { useCallback, useEffect, useState } from "react";
import type { Promo } from "@/lib/types";
import { WhatsAppGlyph } from "./icons";
import { genericContactUrl } from "@/lib/whatsapp";

// Se recuerda en sessionStorage (no localStorage): que no vuelva a
// aparecer en la misma sesión del navegador, pero sí la próxima vez que
// alguien abra el sitio en otro momento.
const DISMISSED_KEY = "traelo-ya:promo-modal-dismissed";

export function PromoModal({ promo }: { promo: Promo }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch {
      // Si sessionStorage no está disponible (modo privado, etc.) mostramos
      // el modal igual — solo no se recordará el cierre.
    }
    // No es un setState "sincronizando estado de React" (el caso que la regla
    // quiere evitar): es la única forma de leer sessionStorage, que no existe
    // en el servidor, así que tiene que pasar en un efecto tras montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nada que hacer si no se puede guardar.
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={promo.title || "Promoción"}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="focus-ring absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-navy-700 shadow-sm hover:bg-white"
        >
          ✕
        </button>

        {promo.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.imageUrl} alt="" className="h-auto w-full object-cover" />
        )}

        <div className="p-6 text-center sm:p-7">
          {promo.title && (
            <h2 className="text-xl font-extrabold text-navy-900 sm:text-2xl">{promo.title}</h2>
          )}
          {promo.description && (
            <p className="mt-2 text-sm leading-relaxed text-navy-600 sm:text-base">
              {promo.description}
            </p>
          )}
          <a
            href={genericContactUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-5 inline-flex items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-700"
          >
            <WhatsAppGlyph className="h-4.5 w-4.5" />
            {promo.ctaText}
          </a>
        </div>
      </div>
    </div>
  );
}
