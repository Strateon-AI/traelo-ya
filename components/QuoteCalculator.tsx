"use client";

import { useState } from "react";
import { Calculator, Plus, Trash2 } from "lucide-react";
import type { ClientType, ProductSuggestion, QuoteConfig } from "@/lib/types";
import { calculateQuote, formatUsd } from "@/lib/calculator";
import { quoteUrl } from "@/lib/whatsapp";
import { WhatsAppGlyph } from "./icons";
import { BusinessQuoteCard } from "./BusinessQuoteCard";
import { LinkWeightEstimator } from "./LinkWeightEstimator";
import { WarehouseAddressCard } from "./WarehouseAddressCard";

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

interface ProductLine {
  id: string;
  productName: string;
  quantity: number | "";
  unitPrice: number | "";
  unitWeightKg: number | "";
}

function newLine(): ProductLine {
  return {
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random()),
    productName: "",
    quantity: 1,
    unitPrice: "",
    unitWeightKg: "",
  };
}

export function QuoteCalculator({
  config,
  products,
}: {
  config: QuoteConfig;
  products: ProductSuggestion[];
}) {
  const [clientType, setClientType] = useState<ClientType>("card");
  const [lines, setLines] = useState<ProductLine[]>([newLine()]);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateLine(id: string, patch: Partial<ProductLine>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== id) : prev));
  }

  // Si cambia cualquier dato del cálculo, la confirmación previa queda vieja.
  const quoteSignature = `${clientType}|${JSON.stringify(lines)}`;
  const [lastSignature, setLastSignature] = useState(quoteSignature);
  if (quoteSignature !== lastSignature) {
    setLastSignature(quoteSignature);
    setAgreed(false);
  }

  const isBuyForYou = clientType === "buy-for-you";

  const result = calculateQuote({
    isBuyForYou,
    lines: lines.map((line) => ({
      quantity: typeof line.quantity === "number" ? line.quantity : 1,
      unitPrice: typeof line.unitPrice === "number" ? line.unitPrice : 0,
      unitWeightKg: typeof line.unitWeightKg === "number" ? line.unitWeightKg : 0,
    })),
    ratePerKg: config.weightRatePerKg,
    commissionPercent: config.commissionPercent,
    commissionEnabled: config.commissionEnabled,
  });

  if (clientType === "business") {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-card-lg sm:p-7">
        <CalculatorHeader />
        <div className="mt-5">
          <ClientTypeSelector value={clientType} onChange={setClientType} />
        </div>
        <div className="mt-5">
          <BusinessQuoteCard variant="embedded" />
        </div>
      </div>
    );
  }

  const hasContactInfo = customerName.trim().length > 0 && customerWhatsapp.trim().length > 0;
  const allLinesComplete = lines.every(
    (line) =>
      line.productName.trim().length > 0 &&
      typeof line.quantity === "number" &&
      line.quantity > 0 &&
      typeof line.unitPrice === "number" &&
      line.unitPrice > 0 &&
      typeof line.unitWeightKg === "number" &&
      line.unitWeightKg > 0
  );
  const canSubmit = agreed && allLinesComplete && hasContactInfo;

  const whatsappHref = quoteUrl({
    lines: lines.map((line) => ({
      productName: line.productName.trim(),
      quantity: typeof line.quantity === "number" ? line.quantity : 1,
      unitPrice: typeof line.unitPrice === "number" ? line.unitPrice : 0,
    })),
    clientTypeLabel: CLIENT_TYPE_MESSAGE_LABEL[clientType],
    isBuyForYou,
    commissionEnabled: config.commissionEnabled,
    commissionPercent: config.commissionPercent,
    commissionCost: result.commissionCost,
    totalWeightKg: result.totalWeightKg,
    shippingCost: result.shippingCost,
    total: result.total,
  });

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/registrar-pedido", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerWhatsapp: customerWhatsapp.trim(),
          clientType,
          lines: lines.map((line) => ({
            productName: line.productName.trim(),
            quantity: typeof line.quantity === "number" ? line.quantity : 1,
            unitPrice: typeof line.unitPrice === "number" ? line.unitPrice : 0,
          })),
          totalWeightKg: result.totalWeightKg,
          shippingCost: result.shippingCost,
          commissionCost: result.commissionCost,
          total: result.total,
        }),
      });
    } catch {
      // No bloqueamos al cliente si falla el guardado — igual puede mandar
      // el WhatsApp; el registro en /admin es un plus, no un requisito.
    } finally {
      setSubmitting(false);
      window.open(whatsappHref, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card-lg sm:p-7">
      <CalculatorHeader />

      <div className="mt-5">
        <ClientTypeSelector value={clientType} onChange={setClientType} />
      </div>

      {isBuyForYou && !config.commissionEnabled && (
        <div className="mt-3 flex gap-2.5 rounded-2xl border border-brand-blue-500/20 bg-brand-blue-100/40 p-3.5">
          <span className="text-brand-blue-600">ℹ️</span>
          <p className="text-xs leading-relaxed text-navy-700">
            Se cobra un {config.commissionPercent}% adicional de comisión de compra sobre el
            precio del producto — coordinamos el monto exacto por WhatsApp.
          </p>
        </div>
      )}

      {clientType === "card" && <WarehouseAddressCard />}

      <div className="mt-5 space-y-4">
        {lines.map((line, index) => (
          <ProductLineFields
            key={line.id}
            index={index}
            line={line}
            products={products}
            canRemove={lines.length > 1}
            onChange={(patch) => updateLine(line.id, patch)}
            onRemove={() => removeLine(line.id)}
          />
        ))}

        <button
          type="button"
          onClick={addLine}
          className="focus-ring flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-blue-500/40 py-2.5 text-sm font-semibold text-brand-blue-600 hover:bg-brand-blue-100/40"
        >
          <Plus className="h-4 w-4" />
          Agregar otro producto
        </button>

        <SummaryRow label="Tarifa referencial" value={`${formatUsd(config.weightRatePerKg)} por kg`} />
        <SummaryRow label="Peso total estimado" value={`${result.totalWeightKg} kg`} />
        <SummaryRow label="Costo de envío" value={formatUsd(result.shippingCost)} />
        {result.hasCommission && (
          <SummaryRow
            label={`Comisión de compra (${config.commissionPercent}%)`}
            value={formatUsd(result.commissionCost)}
          />
        )}
        <SummaryRow label="Total estimado" value={formatUsd(result.total)} emphasis />
        <p className="-mt-1 text-xs text-navy-500">
          {result.hasCommission
            ? "El total incluye envío y comisión de compra — no incluye el valor del producto."
            : "No incluye el valor del producto: eso se paga en la tienda o se reembolsa aparte."}
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

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Tu nombre">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre y apellido"
            className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
          />
        </Field>
        <Field label="Tu WhatsApp">
          <input
            type="tel"
            value={customerWhatsapp}
            onChange={(e) => setCustomerWhatsapp(e.target.value)}
            placeholder="7XXXXXXX"
            className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
          />
        </Field>
      </div>
      <p className="mt-1.5 text-xs text-navy-500">
        Lo usamos para escribirte por si no llega tu mensaje de WhatsApp.
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-navy-800">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="focus-ring mt-0.5 h-4 w-4 rounded border-surface-200 text-brand-blue-600"
        />
        Entiendo que esta cotización es solo un estimado.
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        title={
          !allLinesComplete
            ? "Completá nombre, cantidad, precio y peso de cada producto para continuar"
            : !hasContactInfo
              ? "Completa tu nombre y WhatsApp para continuar"
              : undefined
        }
        className={`focus-ring mt-4 flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors ${
          canSubmit && !submitting
            ? "cursor-pointer bg-whatsapp-600 hover:bg-whatsapp-700"
            : "cursor-not-allowed bg-whatsapp-600/40"
        }`}
      >
        <WhatsAppGlyph className="h-4.5 w-4.5" />
        {submitting ? "Enviando…" : "Enviar cotización por WhatsApp"}
      </button>
    </div>
  );
}

function ProductLineFields({
  index,
  line,
  products,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  line: ProductLine;
  products: ProductSuggestion[];
  canRemove: boolean;
  onChange: (patch: Partial<ProductLine>) => void;
  onRemove: () => void;
}) {
  const datalistId = `producto-sugerencias-${index}`;

  return (
    <div className="rounded-2xl border border-surface-200 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-navy-400">
          Producto {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Eliminar este producto"
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-navy-400 hover:bg-brand-red-600/10 hover:text-brand-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2.5 space-y-3">
        <Field label="¿Qué producto quieres traer?">
          <input
            type="text"
            list={datalistId}
            value={line.productName}
            onChange={(e) => onChange({ productName: e.target.value })}
            placeholder="Ej. iPhone 16 Pro, zapatillas, consola de videojuegos..."
            className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
          />
          <datalist id={datalistId}>
            {products.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cantidad">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={line.quantity}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                onChange({
                  quantity: digitsOnly === "" ? "" : Math.max(1, parseInt(digitsOnly, 10)),
                });
              }}
              onBlur={() => {
                if (line.quantity === "" || line.quantity < 1) onChange({ quantity: 1 });
              }}
              className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900"
            />
          </Field>
          <Field label="Precio por unidad (USD)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={line.unitPrice}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({ unitPrice: raw === "" ? "" : Math.max(0, Number(raw)) });
              }}
              placeholder="0.00"
              className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
            />
          </Field>
        </div>

        <LinkWeightEstimator
          productName={line.productName}
          onWeight={(kg) => onChange({ unitWeightKg: kg })}
        />

        <Field label="Peso por unidad (kg)">
          <input
            type="number"
            min={0}
            step="0.1"
            value={line.unitWeightKg}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({ unitWeightKg: raw === "" ? "" : Math.max(0, Number(raw)) });
            }}
            placeholder="0"
            className="focus-ring w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400"
          />
          <span className="mt-1 block text-xs text-navy-500">
            Se multiplica por la cantidad — no hace falta que lo calcules vos.
          </span>
        </Field>
      </div>
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
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-t border-surface-100 pt-3 text-sm ${
        emphasis ? "text-base" : ""
      }`}
    >
      <span className={emphasis ? "font-bold text-navy-900" : "text-navy-600"}>{label}</span>
      <span className={emphasis ? "font-extrabold text-brand-red-600" : "font-semibold text-navy-900"}>
        {value}
      </span>
    </div>
  );
}
