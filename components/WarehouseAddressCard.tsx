"use client";

import { useState } from "react";
import { Copy, Check, MapPin } from "lucide-react";

/**
 * Dirección del almacén en Miami para clientes que compran con su propia
 * tarjeta. El campo "Apellido" es una plantilla: cada cliente pone SU
 * PROPIO nombre ahí (no el texto literal "Nombre del cliente") — así el
 * almacén distingue de quién es cada paquete que llega a nombre de
 * "FlyCargoBolivia TYA".
 */
const ADDRESS_LINES = [
  "Nombre: FlyCargoBolivia TYA",
  "Apellido: [tu nombre y apellido]",
  "7812 NW 46th Street",
  "Doral, Miami, Florida 33166",
  "Email: Contacto@kellygroup.us",
  "Cel. referencial: +1 (305) 298-5719",
];

export function WarehouseAddressCard() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ADDRESS_LINES.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Si el navegador bloquea el clipboard, el cliente igual puede
      // seleccionar y copiar el texto a mano — no hace falta manejarlo.
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-brand-blue-500/20 bg-brand-blue-100/30 p-3.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-800">
        <MapPin className="h-4 w-4 text-brand-blue-600" />
        Dirección de nuestro almacén en EE.UU.
      </span>
      <p className="mt-1 text-xs leading-relaxed text-navy-600">
        Usá esta dirección al comprar con tu tarjeta en la tienda de EE.UU.
      </p>

      <div className="mt-2.5 rounded-xl bg-white p-3 text-sm text-navy-800">
        <p>Nombre: FlyCargoBolivia TYA</p>
        <p>
          Apellido:{" "}
          <span className="italic text-brand-blue-600">tu nombre y apellido</span>
        </p>
        <p>7812 NW 46th Street</p>
        <p>Doral, Miami, Florida 33166</p>
        <p>Email: Contacto@kellygroup.us</p>
        <p>Cel. referencial: +1 (305) 298-5719</p>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="focus-ring mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue-600 hover:underline"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar dirección"}
      </button>

      <p className="mt-2.5 text-xs leading-relaxed text-navy-600">
        Reemplazá &quot;tu nombre y apellido&quot; por el tuyo. Una vez hecha la compra,
        envianos por WhatsApp el comprobante detallado y el número de tracking.
      </p>
    </div>
  );
}
