"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { updateOrderStatus } from "@/app/admin/actions";

export type OrderStatus = "pending" | "contacted" | "completed";

export interface AdminOrderLine {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  id: string;
  orderCode?: string;
  customerName: string;
  customerWhatsapp: string;
  lines: AdminOrderLine[];
  totalWeightKg: number;
  shippingCost: number;
  commissionCost: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  completed: "Completado",
};

const STATUS_OPTIONS: OrderStatus[] = ["pending", "contacted", "completed"];

function whatsappHref(phone: string, customerName: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  const text = encodeURIComponent(
    `Hola ${customerName}! Te escribo de Tráelo Ya por tu cotización.`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

/**
 * Orden de los grupos: lo que hay que atender primero, arriba. "contacted" es
 * el estado intermedio (ya se le escribió, falta cerrar). No hay estado de
 * cancelado: updateOrderStatus solo acepta estos tres.
 */
const GROUPS: { status: OrderStatus; title: string; collapsedByDefault: boolean }[] = [
  { status: "pending", title: "Pendientes", collapsedByDefault: false },
  { status: "contacted", title: "Contactados", collapsedByDefault: false },
  // Plegado de entrada: con el tiempo es el grupo que más crece.
  { status: "completed", title: "Completados", collapsedByDefault: true },
];

/** Un estado que no sea de los tres conocidos se trata como pendiente, para que no quede escondido. */
function groupOf(status: string): OrderStatus {
  return STATUS_OPTIONS.includes(status as OrderStatus) ? (status as OrderStatus) : "pending";
}

function newestFirst(a: AdminOrder, b: AdminOrder): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function OrdersManager({ initial }: { initial: AdminOrder[] }) {
  const [orders, setOrders] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<OrderStatus, boolean>>(
    () =>
      Object.fromEntries(GROUPS.map((g) => [g.status, g.collapsedByDefault])) as Record<
        OrderStatus,
        boolean
      >
  );

  async function handleStatusChange(id: string, status: OrderStatus) {
    const previous = orders.find((order) => order.id === id)?.status;
    if (previous === status) return;

    setSavingId(id);
    setError(null);
    // Cambio optimista: el pedido se mueve a su grupo en el acto.
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    const result = await updateOrderStatus(id, status);
    setSavingId(null);

    // Si no se guardó, vuelve a su grupo: si no, el panel mostraría un estado
    // que la base no tiene y al recargar el pedido "saltaría" de vuelta.
    if (result?.error && previous) {
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status: previous } : order))
      );
      setError(`No se pudo cambiar el estado: ${result.error}`);
    }
  }

  const groups = GROUPS.map((group) => ({
    ...group,
    items: orders.filter((order) => groupOf(order.status) === group.status).sort(newestFirst),
  }));

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="text-base font-bold text-navy-900">Pedidos</h2>
      <p className="mt-1 text-sm text-navy-600">
        Cada vez que alguien completa el cotizador queda acá — se haya mandado el WhatsApp
        del otro lado o no.
      </p>

      {error && (
        <p className="mt-3 rounded-xl bg-brand-red-600/10 px-4 py-2.5 text-sm font-medium text-brand-red-600">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="mt-5 text-sm text-navy-500">Todavía no hay pedidos.</p>
      ) : (
        <div className="mt-5 space-y-6">
          {groups
            .filter((group) => group.items.length > 0)
            .map((group) => {
              const isCollapsed = collapsed[group.status];
              return (
                <div key={group.status}>
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [group.status]: !prev[group.status] }))
                    }
                    aria-expanded={!isCollapsed}
                    className="focus-ring flex w-full items-center justify-between rounded-lg py-1 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-navy-500">
                      {group.title} ({group.items.length})
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-navy-400 transition-transform ${
                        isCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="mt-2 space-y-3">
                      {group.items.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          saving={savingId === order.id}
                          onStatusChange={(status) => handleStatusChange(order.id, status)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}

function OrderCard({
  order,
  saving,
  onStatusChange,
}: {
  order: AdminOrder;
  saving: boolean;
  onStatusChange: (status: OrderStatus) => void;
}) {
  return (
    <div className="rounded-2xl border border-surface-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-navy-900">
            {order.customerName}
            {order.orderCode && (
              <span className="ml-2 rounded-full bg-navy-100 px-2 py-0.5 text-xs font-bold text-navy-700">
                {order.orderCode}
              </span>
            )}
          </p>
          <p className="text-sm text-navy-600">{order.customerWhatsapp}</p>
          <p className="mt-0.5 text-xs text-navy-500">
            {new Date(order.createdAt).toLocaleString("es-BO")}
          </p>
        </div>
        <a
          href={whatsappHref(order.customerWhatsapp, order.customerName)}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-whatsapp-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-whatsapp-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Escribirle
        </a>
      </div>

      {order.lines.filter((line) => line.productName).length > 0 && (
        <ul className="mt-2.5 space-y-0.5 text-sm text-navy-700">
          {order.lines
            .filter((line) => line.productName)
            .map((line, i) => (
              <li key={i}>
                • {line.productName} (x{line.quantity})
                {line.unitPrice > 0 ? ` — US$ ${line.unitPrice.toFixed(2)} c/u` : ""}
              </li>
            ))}
        </ul>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-600">
        <span>Peso: {order.totalWeightKg} kg</span>
        <span>Envío: US$ {order.shippingCost.toFixed(2)}</span>
        {order.commissionCost > 0 && (
          <span>Comisión: US$ {order.commissionCost.toFixed(2)}</span>
        )}
        <span className="font-bold text-navy-900">Total: US$ {order.total.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex gap-1.5">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            disabled={saving}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
              order.status === status
                ? "bg-navy-900 text-white"
                : "bg-surface-100 text-navy-600 hover:bg-surface-200"
            }`}
          >
            {STATUS_LABEL[status]}
          </button>
        ))}
      </div>
    </div>
  );
}
