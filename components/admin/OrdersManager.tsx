"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { updateOrderStatus } from "@/app/admin/actions";

export type OrderStatus = "pending" | "contacted" | "completed";

export interface AdminOrderLine {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  id: string;
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

export function OrdersManager({ initial }: { initial: AdminOrder[] }) {
  const [orders, setOrders] = useState(initial);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: OrderStatus) {
    setSavingId(id);
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    await updateOrderStatus(id, status);
    setSavingId(null);
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <h2 className="text-base font-bold text-navy-900">Pedidos</h2>
      <p className="mt-1 text-sm text-navy-600">
        Cada vez que alguien completa el cotizador queda acá — se haya mandado el WhatsApp
        del otro lado o no.
      </p>

      <div className="mt-5 space-y-3">
        {orders.length === 0 && (
          <p className="text-sm text-navy-500">Todavía no hay pedidos.</p>
        )}
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-surface-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy-900">{order.customerName}</p>
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
                  onClick={() => handleStatusChange(order.id, status)}
                  disabled={savingId === order.id}
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
        ))}
      </div>
    </section>
  );
}
