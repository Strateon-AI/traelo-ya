import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_REFERENCE_DATA } from "@/lib/weightEstimate";

/**
 * Recibos de almacén cargados desde /admin. Alimentan las referencias de
 * peso real que usa la IA del cotizador.
 *
 * Dos caminos de acceso, a propósito:
 *
 * - El panel (leer, insertar, borrar) usa el cliente con la sesión del admin.
 *   La tabla tiene RLS solo para `authenticated`, así que esas funciones
 *   reciben el cliente ya autenticado en vez de crear uno.
 * - El cotizador público NO puede leer la tabla (y no debe: trae número de
 *   recibo y nombre de archivo, que pueden identificar a una persona). Para
 *   eso está la función SQL `warehouse_reference_items`, que devuelve solo
 *   descripción, peso y medidas — ver supabase-recibos-referencia.sql.
 */

export interface WarehouseReceiptItem {
  id: string;
  receiptNumber: string | null;
  productDescription: string;
  weightKg: number;
  dimensionsCm: { largo: number; ancho: number; alto: number } | null;
  sourceFileName: string | null;
  createdAt: string;
}

export interface NewWarehouseReceiptItem {
  receiptNumber: string | null;
  productDescription: string;
  weightKg: number;
  dimensionsCm: { largo: number; ancho: number; alto: number } | null;
  sourceFileName: string;
}

interface ReceiptRow {
  id: string;
  receipt_number: string | null;
  product_description: string;
  weight_kg: number | string;
  dimensions_cm: { largo: number; ancho: number; alto: number } | null;
  source_file_name: string | null;
  created_at: string;
}

function mapRow(row: ReceiptRow): WarehouseReceiptItem {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    productDescription: row.product_description,
    weightKg: Number(row.weight_kg),
    dimensionsCm: row.dimensions_cm ?? null,
    sourceFileName: row.source_file_name,
    createdAt: row.created_at,
  };
}

export async function getWarehouseReceiptItems(
  supabase: SupabaseClient
): Promise<WarehouseReceiptItem[]> {
  const { data, error } = await supabase
    .from("warehouse_receipt_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as ReceiptRow[]).map(mapRow);
}

/** Devuelve las filas insertadas con su id real, para que el panel pueda borrarlas sin recargar. */
export async function insertWarehouseReceiptItems(
  supabase: SupabaseClient,
  items: NewWarehouseReceiptItem[]
): Promise<{ items: WarehouseReceiptItem[]; error: string | null }> {
  if (items.length === 0) return { items: [], error: null };
  const { data, error } = await supabase
    .from("warehouse_receipt_items")
    .insert(
      items.map((item) => ({
        receipt_number: item.receiptNumber,
        product_description: item.productDescription,
        weight_kg: item.weightKg,
        dimensions_cm: item.dimensionsCm,
        source_file_name: item.sourceFileName,
      }))
    )
    .select("*");
  if (error) return { items: [], error: error.message };
  return { items: ((data ?? []) as ReceiptRow[]).map(mapRow), error: null };
}

/**
 * Clave para detectar un bulto ya cargado: número de recibo + descripción +
 * peso. El número solo NO alcanza: KGE consolida varios clientes bajo un
 * mismo número (W-115680 llegó en cinco PDFs distintos, uno por persona,
 * cada uno con bultos diferentes). Deduplicar por número habría rechazado
 * cuatro de esos cinco como "ya cargados".
 *
 * La descripción se normaliza (minúsculas, sin acentos ni signos) porque la
 * escribe la IA y puede variar un poco entre lecturas del mismo PDF.
 */
export function receiptItemKey(
  receiptNumber: string,
  productDescription: string,
  weightKg: number
): string {
  const desc = productDescription
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return `${receiptNumber.trim().toUpperCase()}|${desc}|${Number(weightKg).toFixed(2)}`;
}

/**
 * Claves de los bultos ya guardados para esos números de recibo. Devuelve
 * null si la consulta falla: en ese caso no se bloquea la carga — mejor un
 * duplicado raro que trabarle el flujo al admin.
 */
export async function existingReceiptItemKeys(
  supabase: SupabaseClient,
  receiptNumbers: string[]
): Promise<Set<string> | null> {
  if (receiptNumbers.length === 0) return new Set();
  const { data, error } = await supabase
    .from("warehouse_receipt_items")
    .select("receipt_number, product_description, weight_kg")
    .in("receipt_number", receiptNumbers);
  if (error || !data) return null;
  return new Set(
    (data as Array<{ receipt_number: string; product_description: string; weight_kg: number | string }>).map(
      (row) => receiptItemKey(row.receipt_number, row.product_description, Number(row.weight_kg))
    )
  );
}

export async function deleteWarehouseReceiptItem(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("warehouse_receipt_items").delete().eq("id", id);
  return { error: error?.message ?? null };
}

const REFERENCE_LIMIT = 40;

/**
 * Bloque de referencias para los prompts. Si no hay recibos cargados, o la
 * función SQL todavía no existe, o falla por lo que sea, devuelve el bloque
 * fijo de las guías de FlyCargo: el cotizador nunca se queda sin ancla.
 */
export async function getReferenceDataBlock(): Promise<string> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("warehouse_reference_items", {
      max_items: REFERENCE_LIMIT,
    });
    if (error || !Array.isArray(data) || data.length === 0) return DEFAULT_REFERENCE_DATA;

    const lines = (
      data as Array<{
        product_description: string;
        weight_kg: number | string;
        dimensions_cm: { largo: number; ancho: number; alto: number } | null;
      }>
    )
      .map((item) => {
        const d = item.dimensions_cm;
        const dims = d ? ` (${d.largo}×${d.ancho}×${d.alto} cm)` : "";
        return `- ${item.product_description}: ${Number(item.weight_kg)} kg${dims}`;
      })
      .join("\n");

    return `DATOS REALES DE REFERENCIA (pesos reales de paquetes ya recepcionados en almacén por este courier, Miami→Bolivia):
${lines}

Usá estos pesos como referencia cuando el producto se parezca a alguno de la lista y no tengas datos de la página — son más confiables que una estimación genérica, porque son paquetes reales de este mismo courier. Son pesos reales, no volumétricos.`;
  } catch {
    return DEFAULT_REFERENCE_DATA;
  }
}
