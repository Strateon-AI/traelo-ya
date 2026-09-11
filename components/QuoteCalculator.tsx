"use client";

import { useState } from "react";
import { Calculator, Info } from "lucide-react";
import type { ClientType, ProductSuggestion, QuoteConfig } from "@/lib/types";
import { calculateQuote, formatUsd } from "@/lib/calculator";
import { quoteUrl } from "@/lib/whatsapp";
import { WhatsAppGlyph } from "./icons";
import { BusinessQuoteCard } from "./BusinessQuoteCard";

const CLIENT_TYPES: { id: ClientType; label: string; helper: string }[] = [
  { id: "card", label: "Con tu tarjeta", helper: "Sin costo adicional" },
  { id: "buy-for-you", label: "Compramos por vos", helper: "(+5%)" },
  { id: "business", label: "Comercio / pedido grande", helper: "Tarifas especiales" },
];

const CLIENT_TYPE_MESSAGE_LABEL: Record<ClientType, string> = {
  card: "Con tu tarjeta",
  "buy-for-you": "Compran por mí",
  business: "Comercio / pedido grande",
};

export function QuoteCalculator({
  config,
  products,
}: {
  config: QuoteConfig;
  products: ProductSuggestion[];
}) {
  const [clientType, setClientType] = useState<ClientType>("card");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [productPrice, setProductPrice] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [agreed, setAgreed] = useState(false);

  // Si cambia cualquier dato del cálculo, la confirmación previa queda vieja.
  // (patrón de "ajustar estado durante el render" recomendado por React en
  // vez de un useEffect, para no disparar un setState síncrono en el efecto)
  const quoteSignature = `${clientType}|${productName}|${quantity}|${productPrice}|${weightKg}`;
  const [lastSignature, setLastSignature] = useState(quoteSignature);
  if (quoteSignature !== lastSignature) {
    setLastSignature(quoteSignature);
    setAgreed(false);
  }

  const result = calculateQuote({
    clientType,
    weightKg: typeof weightKg === "number" ? weightKg : 0,
    ratePerKg: config.weightRatePerKg,
    productPrice: typeof productPrice === "number" ? productPrice : 0,
    quantity,
    commissionPercent: config.commissionPercent,
  });

  if (clientType === "business") {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-card-lg sm:p-7">
        <CalculatorHeader />
        <ClientTypeSelector value={clientType} onChange={setClientType} />
        <div className="mt-5">
          <BusinessQuoteCard variant="embedded" />
        </div>
      </div>
    );
  }

  const hasWeight = typeof weightKg === "number" && weightKg > 0;
  const canSubmit = agreed && hasWeight;

  const whatsappHref = quoteUrl({
    productName: productName.trim(),
    quantity,
    productPrice: typeof productPrice === "number" ? productPrice : 0,
    clientTypeLabel: CLIENT_TYPE_MESSAGE_LABEL[clientType],
    commissionCost: result.commissionCost,
    isCommissionApplied: result.commissionRate > 0,
    weightKg: typeof weightKg === "number" ? weightKg : 0,
    shippingCost: result.shippingCost,
    total: result.total,
  });

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card-lg sm:p-7">
      <CalculatorHeader />

      <div className="mt-5 space-y-4">
        <Field label="¿Qué producto quieres traer? (opcional)">
          <input
            type="text"
            list="producto-sugerencias"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ej. iPhone 16 Pro, zapatillas, consola de videojuegos..."
            className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
          />
          <datalist id="producto-sugerencias">
            {products.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
              className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900"
            />
          </Field>
          <Field label="Precio (USD, opcional)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={productPrice}
              onChange={(e) => {
                const raw = e.target.value;
                setProductPrice(raw === "" ? "" : Math.max(0, Number(raw)));
              }}
              placeholder="0.00"
              className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
            />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-navy-500">
          El producto y el precio son opcionales — solo se usan para calcular la comisión de
          compra. El envío siempre se calcula por peso.
        </p>

        <ClientTypeSelector value={clientType} onChange={setClientType} />

        <Field label="Peso estimado de todo el pedido (kg)">
          <input
            type="number"
            min={0}
            step="0.1"
            value={weightKg}
            onChange={(e) => {
              const raw = e.target.value;
              setWeightKg(raw === "" ? "" : Math.max(0, Number(raw)));
            }}
            placeholder="0"
            className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
          />
        </Field>

        <SummaryRow label="Tarifa referencial" value={`${formatUsd(config.weightRatePerKg)} por kg`} />
        <SummaryRow label="Costo de envío" value={formatUsd(result.shippingCost)} />
        {result.commissionRate > 0 && (
          <SummaryRow
            label={`Servicio de compra (${result.commissionRate}%)`}
            value={formatUsd(result.commissionCost)}
            icon
          />
        )}
        <SummaryRow label="Total estimado" value={formatUsd(result.total)} emphasis />
        <p className="-mt-1 text-xs text-navy-500">
          No incluye el valor del producto: eso se paga en la tienda o se reembolsa aparte.
        </p>
      </div>

      <div className="mt-5 flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
        <span className="text-amber-500">⚠️</span>
        <p className="text-xs leading-relaxed text-amber-900">
          Este valor es un estimado. El peso y costo final se confirmarán una vez que el
          paquete sea recepcionado en nuestro almacén y se verifique el peso real y el
          peso volumétrico.
        </p>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-navy-800">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="focus-ring mt-0.5 h-4 w-4 rounded border-surface-200 text-brand-blue-600"
        />
        Entiendo que esta cotización es solo un estimado.
      </label>

      {canSubmit ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-4 flex items-center justify-center gap-2.5 rounded-full bg-whatsapp-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-whatsapp-700"
        >
          <WhatsAppGlyph className="h-4.5 w-4.5" />
          Enviar cotización por WhatsApp
        </a>
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Completa el peso estimado y marca la casilla para continuar"
          className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-full bg-whatsapp-600/40 px-6 py-3.5 text-sm font-semibold text-white"
        >
          <WhatsAppGlyph className="h-4.5 w-4.5" />
          Enviar cotización por WhatsApp
        </button>
      )}
    </div>
  );
}

function CalculatorHeader() {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue-100 text-brand-blue-600">
        <Calculator className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <div>
        <h2 className="text-lg font-bold text-navy-900">Cotizador rápido</h2>
        <p className="text-sm text-navy-600">Calcula el costo estimado de tu pedido</p>
      </div>
    </div>
  );
}

function ClientTypeSelector({
  value,
  onChange,
}: {
  value: ClientType;
  onChange: (value: ClientType) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-navy-800">Tipo de cliente</legend>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {CLIENT_TYPES.map((option) => {
          const active = value === option.id;
          return (
            <label
              key={option.id}
              className={`focus-ring flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors ${
                active
                  ? "border-brand-blue-600 bg-brand-blue-100/60"
                  : "border-surface-200 hover:border-brand-blue-500/40"
              }`}
            >
              <span className="flex items-center gap-2 font-semibold text-navy-900">
                <input
                  type="radio"
                  name="clientType"
                  checked={active}
                  onChange={() => onChange(option.id)}
                  className="h-4 w-4 text-brand-blue-600"
                />
                {option.label}
              </span>
              <span className="pl-6 text-xs text-navy-500">{option.helper}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-navy-800">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
  icon,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  icon?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-t border-surface-100 pt-3 text-sm ${
        emphasis ? "text-base" : ""
      }`}
    >
      <span className={`flex items-center gap-1.5 ${emphasis ? "font-bold text-navy-900" : "text-navy-600"}`}>
        {label}
        {icon && <Info className="h-3.5 w-3.5 text-navy-400" />}
      </span>
      <span className={emphasis ? "font-extrabold text-brand-red-600" : "font-semibold text-navy-900"}>
        {value}
      </span>
    </div>
  );
}
