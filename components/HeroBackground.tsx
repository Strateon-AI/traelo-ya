import { Plane } from "lucide-react";

/**
 * Composición visual del hero: avión, acentos de bandera EEUU/Bolivia y
 * silueta de ciudad. Es un placeholder ilustrado (no una fotografía) hecho
 * con SVG/CSS para que el layout y la sensación general queden como en la
 * referencia mientras llega material fotográfico real. Reemplazar por foto
 * de avión + cajas + skyline cuando el cliente la mande.
 */
export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-brand-blue-100 via-sky-50 to-white">
      {/* nubes */}
      <div className="absolute -left-10 top-10 h-40 w-72 rounded-full bg-white/70 blur-2xl" />
      <div className="absolute right-0 top-24 h-32 w-96 rounded-full bg-white/60 blur-2xl" />
      <div className="absolute left-1/3 top-4 h-24 w-64 rounded-full bg-white/50 blur-xl" />

      {/* acento bandera EEUU (izquierda) */}
      <div
        className="absolute -left-6 top-1/4 h-64 w-24 -rotate-6 rounded-3xl opacity-20 blur-sm"
        style={{
          background:
            "repeating-linear-gradient(0deg,#B22234 0 10%,#ffffff 10% 20%)",
        }}
      />
      {/* acento bandera Bolivia (derecha) */}
      <div className="absolute -right-4 top-1/3 flex h-56 w-16 flex-col overflow-hidden rounded-3xl opacity-25 blur-[1px]">
        <div className="h-1/3 bg-[#D52B1E]" />
        <div className="h-1/3 bg-[#F9E300]" />
        <div className="h-1/3 bg-[#007A33]" />
      </div>

      {/* avión */}
      <Plane
        className="absolute right-[18%] top-[18%] h-20 w-20 rotate-[35deg] text-navy-800/70 sm:h-28 sm:w-28"
        strokeWidth={1.4}
      />

      {/* skyline difuminado */}
      <svg
        className="absolute inset-x-0 bottom-0 h-24 w-full text-navy-900/10 sm:h-32"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden="true"
      >
        <rect x="0" y="40" width="24" height="60" />
        <rect x="30" y="20" width="20" height="80" />
        <rect x="56" y="55" width="18" height="45" />
        <rect x="80" y="10" width="22" height="90" />
        <rect x="110" y="45" width="16" height="55" />
        <rect x="260" y="35" width="20" height="65" />
        <rect x="286" y="15" width="24" height="85" />
        <rect x="316" y="50" width="18" height="50" />
        <rect x="340" y="25" width="22" height="75" />
        <rect x="368" y="42" width="20" height="58" />
      </svg>

      <span className="absolute bottom-2 left-3 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-medium text-navy-700/70 backdrop-blur">
        Imagen referencial — reemplazar por foto real
      </span>
    </div>
  );
}
