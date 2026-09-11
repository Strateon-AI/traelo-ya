"use client";

import { Check, Store } from "lucide-react";
import { WhatsAppGlyph } from "./icons";
import { businessQuoteUrl } from "@/lib/whatsapp";

const BENEFITS = [
  "Mejores precios por volumen",
  "Asesoría personalizada",
  "Variedad de productos",
  "Entregas en todo Bolivia",
];

export function BusinessQuoteCard({ variant = "section" }: { variant?: "section" | "embedded" }) {
  if (variant === "embedded") {
    return (
      <div className="rounded-2xl border border-brand-blue-100 bg-brand-blue-100/40 p-5">
        <h3 className="text-base font-bold text-navy-900">¿Compras para tu negocio?</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-700">
          Te ofrecemos tarifas preferenciales para compras comerciales y pedidos de mayor
          volumen.
        </p>
        <a
          href={businessQuoteUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-4 flex items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-700"
        >
          <WhatsAppGlyph className="h-4.5 w-4.5" />
          Solicitar tarifa preferencial por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-3xl bg-brand-blue-100/40 p-6 sm:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-blue-600 shadow-sm">
        <Store className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <h3 className="mt-4 text-xl font-bold leading-snug text-navy-900">
        ¿Comercio o pedidos grandes?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-navy-700">
        Si importas para tu negocio, te ofrecemos tarifas preferenciales y atención
        personalizada.
      </p>
      <ul className="mt-4 space-y-2.5">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2.5 text-sm font-medium text-navy-800">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-whatsapp-600/15 text-whatsapp-700">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            {benefit}
          </li>
        ))}
      </ul>
      <a
        href={businessQuoteUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring mt-6 flex items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-700"
      >
        <WhatsAppGlyph className="h-4.5 w-4.5" />
        Solicita tu tarifa por WhatsApp
      </a>
    </div>
  );
}
