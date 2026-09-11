import { Truck } from "lucide-react";

export function Logo({ className, tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900">
        <Truck className="h-5 w-5 text-white" strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-navy-900">
          TRÁELO <span className="text-brand-red-600">YA</span>
        </span>
        {tagline && (
          <span className="mt-0.5 text-[10px] font-semibold tracking-wide text-navy-600/70">
            MÁS RÁPIDO. MEJOR PRECIO.
          </span>
        )}
      </span>
    </span>
  );
}
