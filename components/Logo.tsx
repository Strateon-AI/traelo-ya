export function Logo({ className, tagline = true }: { className?: string; tagline?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <img src="/logo-icon.png" alt="" className="h-9 w-auto shrink-0" />
      <span className="flex flex-col justify-center gap-1">
        <img src="/logo-wordmark.png" alt="Tráelo Ya" className="h-[18px] w-auto" />
        {tagline && (
          <img src="/logo-tagline.png" alt="Más rápido. Mejor precio." className="h-[10px] w-auto" />
        )}
      </span>
    </span>
  );
}
