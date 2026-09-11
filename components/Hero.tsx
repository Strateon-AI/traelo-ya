import { ArrowRight, Headphones, ShieldCheck, ShoppingCart, Truck as TruckIcon } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { WhatsAppGlyph } from "./icons";
import { WHATSAPP_DISPLAY_NUMBER, genericContactUrl } from "@/lib/whatsapp";
import type { ProductSuggestion, QuoteConfig } from "@/lib/types";
import { QuoteCalculator } from "./QuoteCalculator";

const BENEFITS = [
  { icon: ShoppingCart, label: "Compramos por vos o con tu tarjeta" },
  { icon: TruckIcon, label: "Entregas en Bolivia en 7 a 10 días hábiles" },
  { icon: ShieldCheck, label: "Seguro y 100% confiable" },
  { icon: Headphones, label: "Atención personalizada" },
];

export function Hero({ config, calculatorProducts }: { config: QuoteConfig; calculatorProducts: ProductSuggestion[] }) {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <HeroBackground />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-8 lg:px-8 lg:py-20">
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-navy-900/10 bg-white px-4 py-1.5 text-xs font-semibold text-navy-800 shadow-sm">
            🇺🇸 COMPRAS EN ESTADOS UNIDOS
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
            Lo que quieres,
            <br />
            <span className="text-brand-red-600">más cerca</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-navy-800/80 sm:text-lg">
            Compras en Estados Unidos y te lo entregamos en Bolivia en 7 a 10 días
            hábiles. Fácil, seguro y al mejor precio.
          </p>

          <ul className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue-100 text-brand-blue-600">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="pt-2 text-sm font-medium text-navy-800">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <a
              href={genericContactUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-7 py-4 text-base font-semibold text-white shadow-card transition-colors hover:bg-whatsapp-700 sm:w-auto"
            >
              <WhatsAppGlyph className="h-5 w-5" />
              Cotiza ahora por WhatsApp {WHATSAPP_DISPLAY_NUMBER}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

        </div>

        <div id="cotizador" className="relative lg:pt-2">
          <QuoteCalculator config={config} products={calculatorProducts} />
        </div>
      </div>
    </section>
  );
}
