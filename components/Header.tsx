"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { WhatsAppGlyph } from "./icons";
import { genericContactUrl } from "@/lib/whatsapp";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#rastreo", label: "Rastrear pedido" },
  { href: "#cotizador", label: "Cotizador" },
  { href: "#precios", label: "Tienda" },
  { href: "#preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "#contacto", label: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#inicio" className="focus-ring rounded-md" aria-label="Tráelo Ya, ir al inicio">
          <Logo />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="focus-ring rounded-md text-sm font-medium text-navy-800 transition-colors hover:text-brand-blue-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a
            href={genericContactUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-full bg-whatsapp-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-700"
          >
            <WhatsAppGlyph className="h-4 w-4" />
            Escríbenos
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="focus-ring inline-flex items-center justify-center rounded-md p-2 text-navy-900 lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-200 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="focus-ring rounded-md px-2 py-2.5 text-base font-medium text-navy-800 hover:bg-surface-50"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href={genericContactUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring mt-3 flex items-center justify-center gap-2 rounded-full bg-whatsapp-600 px-5 py-3 text-sm font-semibold text-white hover:bg-whatsapp-700"
          >
            <WhatsAppGlyph className="h-4 w-4" />
            Escríbenos
          </a>
        </div>
      )}
    </header>
  );
}
