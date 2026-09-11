import { Truck } from "lucide-react";

/** Ilustración simple de cajas apiladas con el logo, evocando el material
 * fotográfico real que se sumará más adelante (ver HeroBackground.tsx). */
export function BoxStack({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className ?? ""}`} aria-hidden="true">
      <div className="relative h-28 w-36 sm:h-36 sm:w-44">
        <div className="absolute bottom-0 left-3 h-20 w-28 rotate-[-3deg] rounded-md bg-gradient-to-br from-amber-200 to-amber-400 shadow-lg sm:h-24 sm:w-32">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-amber-500/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-navy-900">
            <Truck className="h-4 w-4" strokeWidth={2.25} />
            <span className="text-[9px] font-extrabold tracking-wide">TRÁELO YA</span>
          </div>
        </div>
        <div className="absolute bottom-16 right-0 h-14 w-20 rotate-[4deg] rounded-md bg-gradient-to-br from-amber-100 to-amber-300 shadow-md sm:bottom-20 sm:h-16 sm:w-24">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-amber-500/40" />
        </div>
      </div>
    </div>
  );
}
