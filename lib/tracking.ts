export type TrackingStepStatus = "done" | "current" | "pending";

export interface TrackingStep {
  label: string;
  status: TrackingStepStatus;
  timestamp?: string;
}

export interface TrackingResult {
  orderCode: string;
  statusLabel: string;
  steps: TrackingStep[];
  carrierTrackingCode: string;
}

/**
 * Rastreo de pedidos — versión DEMO / manual.
 *
 * Tráelo Ya todavía actualiza el estado del pedido a mano (no hay
 * integración con DHL/FedEx/UPS todavía). Esta función devuelve datos de
 * ejemplo para cualquier código no vacío, solo para mostrar cómo se va a
 * ver el panel de seguimiento.
 *
 * Para conectar un backend real más adelante: reemplazar el cuerpo de esta
 * función por un `fetch` a la API/tabla donde Tráelo Ya vaya cargando el
 * estado de cada pedido. El resto de la app (TrackingSection.tsx) ya está
 * armado para recibir esta misma forma de datos (TrackingResult), así que
 * no hay que tocar la interfaz.
 */
export function getDemoTracking(code: string): TrackingResult | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  return {
    orderCode: trimmed,
    statusLabel: "En tránsito",
    carrierTrackingCode: "1Z1234567890",
    steps: [
      { label: "Compra realizada", status: "done", timestamp: "12 mar · 10:24" },
      { label: "Recibido en almacén USA", status: "done", timestamp: "14 mar · 16:30" },
      { label: "En tránsito a Bolivia", status: "current", timestamp: "16 mar · 08:15" },
      { label: "Llegó a Bolivia", status: "pending" },
      { label: "Listo para entrega", status: "pending" },
      { label: "Entregado", status: "pending" },
    ],
  };
}
