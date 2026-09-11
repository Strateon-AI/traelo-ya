/** Ilustración de cajas apiladas con el logo real de Tráelo Ya impreso en la
 * caja principal, evocando el material fotográfico real que se sumará más
 * adelante (ver HeroBackground.tsx, que ya lleva el aviso de "imagen
 * referencial" para toda esta composición del hero). Sigue siendo un
 * gráfico ilustrado (CSS + el logo real), no una fotografía. */
export function BoxStack({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className ?? ""}`} aria-hidden="true">
      <div className="relative h-32 w-40 sm:h-40 sm:w-48">
        {/* caja trasera, más chica */}
        <div className="absolute bottom-16 right-0 h-14 w-20 rotate-[4deg] rounded-md bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 shadow-md sm:bottom-20 sm:h-16 sm:w-24">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-amber-600/25" />
          <div className="absolute inset-0 rounded-md border border-amber-500/30" />
        </div>

        {/* caja principal, con solapa, cinta y el logo real */}
        <div className="absolute bottom-0 left-2 h-24 w-32 rotate-[-3deg] rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 shadow-lg sm:h-28 sm:w-36">
          {/* solapa superior */}
          <div className="absolute -top-1.5 left-1/2 h-2.5 w-[80%] -translate-x-1/2 rounded-sm bg-amber-300/95" />
          {/* cinta vertical */}
          <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 bg-amber-50/70" />
          {/* logo real, centrado sobre la cinta */}
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <img src="/logo-wordmark.png" alt="" className="h-3.5 w-auto opacity-90 sm:h-4" />
          </div>
          <div className="absolute inset-0 rounded-md border border-amber-500/30" />
        </div>
      </div>
    </div>
  );
}
