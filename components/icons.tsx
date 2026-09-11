/**
 * Glifos que lucide-react ya no incluye (WhatsApp, redes sociales) más un
 * set de wordmarks de marca simples para la franja "Tus marcas favoritas".
 * Son formas propias, no un calco de los assets oficiales de cada marca —
 * si más adelante quieren los logos oficiales, se reemplazan acá nomás.
 */

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.02 3C9.4 3 4 8.36 4 14.96c0 2.24.62 4.34 1.7 6.14L4 29l8.1-1.66a13 13 0 0 0 3.92.6h.01c6.62 0 12.02-5.36 12.02-11.96C28.05 8.36 22.65 3 16.02 3Zm0 21.86h-.01a10.9 10.9 0 0 1-5.55-1.52l-.4-.24-4.8.98 1.02-4.66-.26-.42a9.87 9.87 0 0 1-1.53-5.27C4.5 9.05 9.75 3.8 16.02 3.8c2.95 0 5.72 1.15 7.8 3.23a10.86 10.86 0 0 1 3.23 7.72c0 6.14-5.25 11.11-11.03 11.11Zm6.04-8.32c-.33-.17-1.96-.97-2.26-1.08-.3-.11-.53-.17-.75.17-.22.33-.86 1.08-1.06 1.3-.2.22-.39.25-.72.08-.33-.17-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.33-.02-.5.15-.67.15-.15.33-.39.5-.58.16-.2.22-.33.33-.55.11-.22.06-.42-.03-.58-.08-.17-.75-1.82-1.03-2.5-.27-.65-.55-.56-.75-.57h-.64c-.22 0-.58.08-.88.42-.3.33-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.17.22 2.33 3.62 5.65 5.07.79.35 1.4.55 1.88.7.79.25 1.5.22 2.07.13.63-.1 1.96-.8 2.24-1.58.28-.77.28-1.44.2-1.58-.08-.13-.3-.22-.63-.38Z" />
    </svg>
  );
}

export function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.15" cy="6.85" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.55c0-.86.24-1.44 1.47-1.44h1.57V4.46c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.2H7.99v2.96h2.47V21h3.04Z" />
    </svg>
  );
}

export function TikTokGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3c.4 2.1 1.7 3.5 3.9 3.7v2.6c-1.4.06-2.7-.4-3.9-1.2v6.6c0 3.2-2.3 5.5-5.3 5.5-2.9 0-5.3-2.3-5.3-5.4 0-3.1 2.6-5.5 5.7-5.3v2.7c-.2 0-.4-.02-.6-.02-1.5 0-2.7 1.2-2.7 2.7 0 1.5 1.2 2.7 2.7 2.7 1.6 0 2.9-1.3 2.9-3V3h2.6Z" />
    </svg>
  );
}

export function AlertGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/** Wordmarks simples de marca para la franja de partners — no son los
 * archivos de logo oficiales de cada marca. */
export function BrandWordmark({ name, className }: { name: string; className?: string }) {
  return <span className={className}>{name}</span>;
}
