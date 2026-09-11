import { MessageCircleQuestion, Package } from "lucide-react";
import { WhatsAppGlyph } from "./icons";
import { orderStatusUrl } from "@/lib/whatsapp";
import { BusinessQuoteCard } from "./BusinessQuoteCard";

/**
 * El rastreo automático (input + timeline) se dejó afuera a pedido del
 * cliente: es mucho trabajo para esta primera versión. Por ahora, la
 * consulta de estado de pedido se deriva directo a WhatsApp.
 *
 * Si más adelante quieren el rastreo self-service, la lógica de demo ya
 * está armada en lib/tracking.ts (getDemoTracking), lista para conectar
 * cuando se retome.
 */
export function TrackingSection() {
  return (
    <section id="rastreo" className="bg-surface-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col justify-center rounded-3xl bg-white p-6 shadow-card sm:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue-100 text-brand-blue-600">
              <Package className="h-5 w-5" strokeWidth={2.1} />
            </span>
            <h2 className="mt-4 text-xl font-bold text-navy-900 sm:text-2xl">
              ¿Quieres saber el estado de tu pedido?
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-navy-600">
              Escríbenos por WhatsApp con tu número de pedido (o el de tracking del
              transportista) y te contamos en qué va, al toque.
            </p>

            <a
              href={orderStatusUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-700 sm:w-auto"
            >
              <WhatsAppGlyph className="h-4.5 w-4.5" />
              Consultar mi pedido por WhatsApp
            </a>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-navy-500">
              <MessageCircleQuestion className="h-3.5 w-3.5" />
              Respondemos en horario de atención.
            </p>
          </div>

          <BusinessQuoteCard />
        </div>
      </div>
    </section>
  );
}
