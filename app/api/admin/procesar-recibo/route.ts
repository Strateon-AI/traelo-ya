import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  existingReceiptItemKeys,
  insertWarehouseReceiptItems,
  receiptItemKey,
} from "@/lib/data/warehouseReceipts";
import { askModelWithDocument, searchConfigured } from "@/lib/llm";
import { buildReceiptExtractionPrompt, parseReceiptExtraction } from "@/lib/weightEstimate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vence antes que maxDuration, para devolver nuestro error y no un 504. */
const LLM_TIMEOUT_MS = 50_000;

/**
 * Vercel corta cualquier body de más de 4,5 MB antes de que llegue acá, y el
 * cliente recibiría un 413 sin explicación. Con este tope (~3,2 MB de PDF)
 * el rechazo lo hacemos nosotros, con un mensaje claro. Los recibos de KGE
 * escaneados que vimos pesan ~1,1 MB.
 */
const MAX_DOC_BASE64 = 4_300_000;

/**
 * Lee un recibo de almacén en PDF y guarda sus ítems. Solo para el admin:
 * cada llamada gasta créditos de Anthropic, así que sin sesión válida no se
 * hace nada. El chequeo es el mismo que usan las server actions de /admin
 * (cliente con cookies + getUser), y el insert usa ese mismo cliente
 * autenticado — la tabla tiene RLS solo para `authenticated`.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let documentBase64: string;
  let mediaType: string;
  try {
    const body = (await request.json()) as { documentBase64?: unknown; mediaType?: unknown };
    documentBase64 = typeof body.documentBase64 === "string" ? body.documentBase64 : "";
    mediaType = typeof body.mediaType === "string" ? body.mediaType : "";
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  if (!documentBase64 || mediaType !== "application/pdf") {
    return NextResponse.json({ error: "Subí un archivo PDF." }, { status: 400 });
  }
  if (documentBase64.length > MAX_DOC_BASE64) {
    return NextResponse.json({ error: "El archivo es muy grande (máx. ~3 MB)." }, { status: 400 });
  }
  if (!searchConfigured()) {
    return NextResponse.json({ error: "Leer recibos todavía no está configurado." }, { status: 503 });
  }

  const result = await askModelWithDocument(
    buildReceiptExtractionPrompt(),
    documentBase64,
    mediaType,
    LLM_TIMEOUT_MS
  );

  if (!result.ok || !result.text) {
    console.error("[procesar-recibo] llm error:", result.error);
    return NextResponse.json({ error: "No pudimos leer el recibo en este momento." }, { status: 502 });
  }

  const items = parseReceiptExtraction(result.text);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "No encontramos ítems en ese archivo. Revisá que sea un recibo de almacén." },
      { status: 422 }
    );
  }

  // Duplicados: se descartan los bultos que ya estaban cargados (mismo
  // número + descripción + peso). Si eran todos, el recibo entero ya estaba.
  // Un bulto sin número de recibo no se puede comparar y se inserta igual.
  const receiptNumbers = Array.from(
    new Set(items.map((item) => item.numeroRecibo).filter((n): n is string => !!n))
  );
  const existingKeys = await existingReceiptItemKeys(supabase, receiptNumbers);
  const newItems = existingKeys
    ? items.filter(
        (item) =>
          !item.numeroRecibo ||
          !existingKeys.has(receiptItemKey(item.numeroRecibo, item.descripcion, item.pesoKg))
      )
    : items;
  const skipped = items.length - newItems.length;

  if (newItems.length === 0) {
    const label = receiptNumbers.length > 0 ? `El recibo ${receiptNumbers.join(", ")}` : "Ese recibo";
    return NextResponse.json(
      { error: `${label} ya estaba cargado — no se subió de nuevo.`, alreadyLoaded: true },
      { status: 409 }
    );
  }

  // El nombre que se guarda NO sale del archivo que subió el admin: los
  // recibos de KGE vienen nombrados con la persona que recibe el paquete
  // (Recibo_W-115680_Nombre_Apellido_.pdf). Se arma con el número de recibo
  // que leyó la IA, que es lo único que sirve para ubicar el documento.
  const uploadedAt = Date.now();
  const { items: inserted, error } = await insertWarehouseReceiptItems(
    supabase,
    newItems.map((item) => ({
      receiptNumber: item.numeroRecibo,
      productDescription: item.descripcion,
      weightKg: item.pesoKg,
      dimensionsCm: item.dimensionesCm,
      sourceFileName: storedFileName(item.numeroRecibo, uploadedAt),
    }))
  );

  if (error) {
    console.error("[procesar-recibo] insert error:", error);
    return NextResponse.json({ error: "No se pudieron guardar los ítems del recibo." }, { status: 500 });
  }

  return NextResponse.json({ inserted: inserted.length, items: inserted, skipped });
}

/** Solo caracteres de un número de recibo (W-115680); cualquier otra cosa se descarta. */
function storedFileName(receiptNumber: string | null, uploadedAt: number): string {
  const safe = (receiptNumber ?? "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 32);
  return `recibo-${safe || "sin-numero"}-${uploadedAt}.pdf`;
}
