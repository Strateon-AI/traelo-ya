import { Globe2, Headphones, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "./Logo";
import { InstagramGlyph, TikTokGlyph } from "./icons";

const HIGHLIGHTS = [
  { icon: Truck, label: "Envíos rápidos" },
  { icon: ShieldCheck, label: "Seguro y confiable" },
  { icon: Headphones, label: "Atención personalizada" },
  { icon: Globe2, label: "Entregas en todo Bolivia" },
];

// Facebook queda fuera a propósito hasta tener la cuenta real: un ícono que
// no lleva a ningún lado es peor que no mostrarlo.
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/traelo.ya.bo", Icon: InstagramGlyph },
  { label: "TikTok", href: "https://www.tiktok.com/@traelo.ya.bo", Icon: TikTokGlyph },
];

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 border-b border-surface-200 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <Logo />
          <ul className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-navy-700">
                <Icon className="h-4.5 w-4.5 text-brand-blue-600" strokeWidth={2} />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-navy-500 sm:justify-start">
            <span>© 2026 Tráelo Ya. Todos los derechos reservados.</span>
            <a href="#" className="focus-ring hover:text-navy-800 hover:underline">
              Términos y condiciones
            </a>
            <a href="#" className="focus-ring hover:text-navy-800 hover:underline">
              Política de privacidad
            </a>
          </div>

          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-navy-600 transition-colors hover:bg-brand-blue-100 hover:text-brand-blue-600"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
