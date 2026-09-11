import { Phone } from "lucide-react";
import { WhatsAppGlyph } from "./icons";
import { WHATSAPP_DISPLAY_NUMBER, genericContactUrl } from "@/lib/whatsapp";

const BRANDS = ["Amazon", "eBay", "Walmart", "Best Buy", "Apple"];

export function BrandsSection() {
  return (
    <section id="contacto" className="relative overflow-hidden bg-navy-950 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-blue-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-14">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Tus marcas favoritas,
              <br />
              sin fronteras
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
              Tecnología, moda, deporte, hogar y mucho más. Nosotros lo hacemos posible.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              {BRANDS.map((brand) => (
                <span
                  key={brand}
                  className="text-lg font-bold tracking-tight text-white/80 sm:text-xl"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card-lg sm:p-7">
            <h3 className="text-xl font-bold text-navy-900">¿Listo para traerlo ya?</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              Escríbenos por WhatsApp y cotiza sin compromiso.
            </p>
            <a
              href={genericContactUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-5 flex items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-700"
            >
              <WhatsAppGlyph className="h-4.5 w-4.5" />
              Hablar por WhatsApp
            </a>
            <a
              href={`tel:+591${WHATSAPP_DISPLAY_NUMBER}`}
              className="focus-ring mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-navy-700 hover:text-navy-900"
            >
              <Phone className="h-4 w-4" />
              {WHATSAPP_DISPLAY_NUMBER}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
