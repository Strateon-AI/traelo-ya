import type { ScreenshotEstimate, WeightEstimate, WeightEstimateSource } from "@/lib/types";

/**
 * Divisor volumétrico por defecto (cm³ por kg). El valor real depende del
 * courier con el que trabaja Tráelo Ya — típicamente 5000 o 6000 — y se
 * configura desde /admin, en "Tarifas del cotizador". Este es solo el
 * fallback si la tabla todavía no lo tiene cargado.
 */
export const DEFAULT_VOLUMETRIC_DIVISOR = 5000;

const SOURCES: WeightEstimateSource[] = [
  "pagina",
  "producto_mas_embalaje",
  "estimado",
  "sin_datos",
];

/**
 * Referencias de peso real sacadas de las guías de FlyCargo ya procesadas.
 * Es el respaldo fijo: se usa cuando todavía no hay recibos de almacén
 * cargados desde /admin (o cuando no se pudieron leer). Vive en un solo
 * lugar para que los tres prompts y el respaldo de los recibos no se
 * desfasen entre sí.
 */
export const DEFAULT_REFERENCE_DATA = `DATOS REALES DE REFERENCIA (de envíos ya pesados por este courier, Miami→Bolivia):
- Celular con caja: 0,4–0,6 kg
- Funda/case: 0,3–0,5 kg
- Tablet: 1–1,2 kg
- Zapatos/zapatillas: 1–1,5 kg
- Ropa (una prenda): 0,3–0,8 kg
- Cosméticos: 0,4–1,3 kg
- Accesorios chicos (memorias, cables, etc.): 0,15–0,65 kg

Usá estos rangos como referencia cuando el producto encaje en una de estas categorías y no tengas datos de la página — son más confiables que una estimación genérica, porque están sacados de paquetes reales de este mismo courier.`;

function referenceBlock(referenceData?: string): string {
  return referenceData && referenceData.trim() ? referenceData : DEFAULT_REFERENCE_DATA;
}

/**
 * El prompt es el producto acá: si el sistema es "link entra, estimado sale",
 * toda la calidad vive en este texto. Dos decisiones importantes:
 *
 * - El modelo estima LA CAJA, no el producto desnudo. Amazon publica seguido
 *   las medidas del producto sin embalaje, y esa es la causa número uno de
 *   cotizaciones que se quedan cortas.
 * - El modelo NO infla por las dudas. El margen comercial lo aplica el
 *   sistema aparte, así se puede ajustar sin reescribir el prompt (y no se
 *   aplica dos veces sin querer).
 */
export function buildWeightPrompt(divisor: number, referenceData?: string): string {
  return `Sos el estimador de peso de un servicio de courier de Estados Unidos a Bolivia.
Recibís la información de una página de producto y devolvés cuánto va a pesar
LA CAJA EN QUE SE ENVÍA EL PRODUCTO, no el producto desnudo.

CONFIGURACIÓN
- Divisor volumétrico del courier: ${divisor}
- peso_volumetrico_kg = (largo_cm × ancho_cm × alto_cm) / ${divisor}

${referenceBlock(referenceData)}

CÓMO ESTIMAR — en este orden de prioridad:

1. Si la página trae "Package Dimensions", "Shipping Weight" o equivalente,
   usá esos valores tal cual: son los del paquete real.
   → fuente: "pagina"

2. Si solo trae "Product Dimensions" o "Item Weight" (medidas del producto
   sin caja), sumale el embalaje. Como referencia: 2-4 cm por lado en
   productos chicos y livianos; 5-10 cm en electrónica, vidrio o cualquier
   cosa que viaje con relleno de protección. El peso sube entre 10% y 30%.
   → fuente: "producto_mas_embalaje"

3. Si no hay ninguna medida, estimá por el tipo de producto, comparando con
   productos equivalentes que conozcas.
   → fuente: "estimado"

4. Si no pudiste leer la página o no identificás el producto, NO INVENTES.
   → fuente: "sin_datos", todos los números en null

REGLAS
- Nunca devuelvas un peso cobrable exacto: siempre un rango mínimo–máximo.
- El peso cobrable es el MAYOR entre el peso real y el peso volumétrico.
- El rango tiene que ser realista, no defensivo. No infles por las dudas:
  el margen comercial lo aplica el sistema después, aparte.
- Si el peso volumétrico supera 3 veces el peso real, se cobra el promedio
  entre ambos en vez del volumétrico completo — así lo maneja el proveedor de
  courier para no sobrecargar piezas chicas y pesadas en cajas grandes.
  Cuando pase esto, mencionalo en la "nota".
- Respondé únicamente con el JSON, sin texto alrededor.

SALIDA
{
  "producto": "nombre corto",
  "tienda": "amazon | ebay | walmart | otro",
  "dimensiones_caja_cm": { "largo": 0, "ancho": 0, "alto": 0 },
  "peso_real_kg": 0,
  "peso_volumetrico_kg": 0,
  "peso_cobrable_kg": { "min": 0, "max": 0 },
  "fuente": "pagina | producto_mas_embalaje | estimado | sin_datos",
  "confianza": "alta | media | baja",
  "nota": "una frase sobre de dónde salió el número"
}`;
}

/**
 * Variante del prompt para cuando la tienda no deja leer la página.
 *
 * Mismo esquema de salida que `buildWeightPrompt` — por eso
 * `parseWeightEstimate` sirve para las dos sin cambios — pero acá el modelo
 * busca el producto por nombre en la web entera en vez de leer una página
 * puntual. Solo se usa con Anthropic, que es el proveedor con búsqueda web.
 */
export function buildWeightSearchPrompt(divisor: number, referenceData?: string): string {
  return `Sos el estimador de peso de un servicio de courier de Estados Unidos a Bolivia.

No se pudo leer directamente la página del producto — la tienda bloquea el acceso automatizado. Te doy el NOMBRE DEL PRODUCTO tal como lo escribió el cliente, y el nombre de la tienda. Buscá en la web información sobre este producto (especificaciones del fabricante, la misma publicación en otra tienda, reviews que mencionen el tamaño de la caja de envío, foros) para estimar cuánto va a pesar LA CAJA EN QUE SE ENVÍA, no el producto desnudo.

CONFIGURACIÓN
- Divisor volumétrico del courier: ${divisor}
- peso_volumetrico_kg = (largo_cm × ancho_cm × alto_cm) / ${divisor}

${referenceBlock(referenceData)}

CÓMO ESTIMAR — en este orden de prioridad:

1. Si encontrás las medidas o el peso de envío reales de este producto (en el sitio del fabricante, en otra tienda, en una review), usalos.
   → fuente: "pagina"

2. Si solo encontrás las medidas o el peso del producto sin embalaje, sumale el embalaje. Como referencia: 2-4 cm por lado en productos chicos y livianos; 5-10 cm en electrónica, vidrio o cualquier cosa que viaje con relleno de protección. El peso sube entre 10% y 30%.
   → fuente: "producto_mas_embalaje"

3. Si no encontrás medidas de ningún lado, estimá por el tipo de producto, comparando con productos equivalentes que conozcas.
   → fuente: "estimado"

4. Si no lográs identificar qué producto es ni siquiera por el nombre, NO INVENTES.
   → fuente: "sin_datos", todos los números en null

REGLAS
- Nunca devuelvas un peso cobrable exacto: siempre un rango mínimo–máximo.
- El peso cobrable es el MAYOR entre el peso real y el peso volumétrico.
- El rango tiene que ser realista, no defensivo. No infles por las dudas.
- Si el peso volumétrico supera 3 veces el peso real, se cobra el promedio
  entre ambos en vez del volumétrico completo — así lo maneja el proveedor de
  courier para no sobrecargar piezas chicas y pesadas en cajas grandes.
  Cuando pase esto, mencionalo en la "nota".
- Respondé únicamente con el JSON, sin texto alrededor.

SALIDA
{
  "producto": "nombre corto",
  "tienda": "amazon | ebay | walmart | otro",
  "dimensiones_caja_cm": { "largo": 0, "ancho": 0, "alto": 0 },
  "peso_real_kg": 0,
  "peso_volumetrico_kg": 0,
  "peso_cobrable_kg": { "min": 0, "max": 0 },
  "fuente": "pagina | producto_mas_embalaje | estimado | sin_datos",
  "confianza": "alta | media | baja",
  "nota": "una frase sobre de dónde salió el número, mencionando que se buscó por nombre en vez de leer la página original"
}`;
}

export function volumetricWeightKg(
  dims: { largo: number; ancho: number; alto: number },
  divisor: number
): number {
  if (!divisor || divisor <= 0) return 0;
  return round2((dims.largo * dims.ancho * dims.alto) / divisor);
}

/**
 * El modelo a veces envuelve el JSON en ```json … ``` aunque se le pida que
 * no lo haga. Se limpia antes de parsear en vez de fallar por eso.
 */
/**
 * Regla del courier de Tráelo Ya: una pieza chica y pesada dentro de una caja
 * grande no se cobra por el volumétrico completo. Cuando el volumétrico es 3
 * veces o más el peso real, se cobra el promedio entre los dos.
 *
 * Ejemplo del cliente: 2 kg reales en una caja de 15 kg volumétricos (7,5x)
 * se cobran como (2 + 15) / 2 = 8,5 kg, no 15.
 */
export const FACTOR_CAJA_GRANDE = 3;

function usaPromedioPorCajaGrande(
  pesoRealKg: number | null,
  pesoVolumetricoKg: number | null
): boolean {
  if (!pesoRealKg || !pesoVolumetricoKg) return false;
  return pesoVolumetricoKg >= pesoRealKg * FACTOR_CAJA_GRANDE;
}

function basePesoCobrable(
  pesoRealKg: number | null,
  pesoVolumetricoKg: number | null
): number {
  const real = pesoRealKg ?? 0;
  const volumetrico = pesoVolumetricoKg ?? 0;

  if (usaPromedioPorCajaGrande(pesoRealKg, pesoVolumetricoKg)) {
    return round2((real + volumetrico) / 2);
  }
  return Math.max(real, volumetrico);
}

/** Mismo margen de siempre alrededor del valor base. */
function rangoDesdeBase(base: number): { min: number; max: number } | null {
  if (base <= 0) return null;
  return { min: round2(base * 0.9), max: round2(base * 1.15) };
}

export function parseWeightEstimate(raw: string, divisor: number): WeightEstimate | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  const fuente = SOURCES.includes(obj.fuente as WeightEstimateSource)
    ? (obj.fuente as WeightEstimateSource)
    : "estimado";

  if (fuente === "sin_datos") {
    return {
      producto: asText(obj.producto),
      tienda: asText(obj.tienda),
      dimensionesCm: null,
      pesoRealKg: null,
      pesoVolumetricoKg: null,
      pesoCobrableKg: null,
      fuente: "sin_datos",
      confianza: "baja",
      nota: asText(obj.nota),
    };
  }

  const dims = asDimensions(obj.dimensiones_caja_cm);
  const pesoRealKg = asNumber(obj.peso_real_kg);

  // El volumétrico se recalcula acá con el divisor real en vez de confiar en
  // la aritmética del modelo, que es justamente lo que peor hace.
  const pesoVolumetricoKg = dims ? volumetricWeightKg(dims, divisor) : asNumber(obj.peso_volumetrico_kg);

  const rango = asRange(obj.peso_cobrable_kg);
  const cobrableBase = basePesoCobrable(pesoRealKg, pesoVolumetricoKg);
  const aplicaPromedio = usaPromedioPorCajaGrande(pesoRealKg, pesoVolumetricoKg);

  // Cuando aplica la regla del promedio se descarta el rango que propuso el
  // modelo: ese rango está anclado al volumétrico completo, que es justamente
  // lo que el courier NO cobra en este caso. En el caso normal se respeta el
  // rango del modelo como siempre.
  const pesoCobrableKg = aplicaPromedio
    ? rangoDesdeBase(cobrableBase)
    : rango ?? rangoDesdeBase(cobrableBase);

  return {
    producto: asText(obj.producto),
    tienda: asText(obj.tienda),
    dimensionesCm: dims,
    pesoRealKg,
    pesoVolumetricoKg,
    pesoCobrableKg,
    fuente,
    confianza: asConfidence(obj.confianza),
    nota: asText(obj.nota),
  };
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? round2(n) : null;
}

function asConfidence(value: unknown): "alta" | "media" | "baja" {
  return value === "alta" || value === "media" || value === "baja" ? value : "baja";
}

function asDimensions(value: unknown): { largo: number; ancho: number; alto: number } | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  const largo = asNumber(obj.largo);
  const ancho = asNumber(obj.ancho);
  const alto = asNumber(obj.alto);
  if (!largo || !ancho || !alto) return null;
  return { largo, ancho, alto };
}

function asRange(value: unknown): { min: number; max: number } | null {
  if (typeof value !== "object" || value === null) return null;
  const obj = value as Record<string, unknown>;
  const min = asNumber(obj.min);
  const max = asNumber(obj.max);
  if (!min || !max) return null;
  return min <= max ? { min, max } : { min: max, max: min };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Variante para cuando el cliente manda una captura de pantalla en vez del
 * link. Las capturas casi nunca muestran las medidas de la caja, así que el
 * peso sale por categoría de producto (con las referencias reales como
 * ancla). El precio, en cambio, sí se lee de la imagen — y solo se acepta si
 * se ve literalmente, nunca inventado.
 */
export function buildScreenshotPrompt(divisor: number, referenceData?: string): string {
  return `Sos el estimador de peso de un servicio de courier de Estados Unidos a Bolivia.

El cliente te mandó una CAPTURA DE PANTALLA de la página de un producto (no el link, no el texto de la página). Mirá la imagen y extraé lo que se vea: nombre del producto y precio. Las capturas normales NO muestran las medidas de la caja de envío, así que para el peso usá el mismo criterio que cuando no hay página: identificá el tipo de producto y estimá por categoría.

${referenceBlock(referenceData)}

CONFIGURACIÓN
- Divisor volumétrico del courier: ${divisor}

CÓMO ESTIMAR
1. Leé el precio exacto que se ve en la captura — número real, no inventado. Si no se alcanza a leer con claridad, dejalo en null.
2. Para el peso, estimá por categoría de producto usando las referencias reales de arriba. Si no podés identificar qué tipo de producto es ni por la imagen, fuente: "sin_datos".

REGLAS
- El precio tiene que ser el que literalmente se ve en la imagen, nunca inventado.
- El peso cobrable siempre es un rango min-max, nunca un número exacto.
- Respondé únicamente con el JSON, sin texto alrededor.

SALIDA
{
  "producto": "nombre corto",
  "precio_usd": 0,
  "peso_cobrable_kg": { "min": 0, "max": 0 },
  "fuente": "estimado | sin_datos",
  "confianza": "alta | media | baja",
  "nota": "una frase — aclarando que viene de una captura, no de la página"
}`;
}

const CONFIANZAS = ["alta", "media", "baja"] as const;

export function parseScreenshotEstimate(text: string): ScreenshotEstimate | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const peso = raw.peso_cobrable_kg as { min?: unknown; max?: unknown } | null | undefined;
    const precio = raw.precio_usd;
    const confianza = CONFIANZAS.find((c) => c === raw.confianza) ?? "baja";

    return {
      producto: typeof raw.producto === "string" && raw.producto.trim() ? raw.producto.trim() : null,
      // 0 no es un precio leído: es el placeholder del esquema de salida.
      precioUsd: typeof precio === "number" && precio > 0 ? precio : null,
      pesoCobrableKg:
        peso && typeof peso.min === "number" && typeof peso.max === "number" && peso.max > 0
          ? { min: peso.min, max: peso.max }
          : null,
      fuente: raw.fuente === "sin_datos" ? "sin_datos" : "estimado",
      confianza,
      nota: typeof raw.nota === "string" ? raw.nota : null,
    };
  } catch {
    return null;
  }
}

/**
 * Lectura de recibos de almacén desde /admin. Los recibos de KGE / Magaya
 * traen el nombre del destinatario pegado a la descripción
 * ("DISCOS MUSIC [ OSCAR MEDINA ]"). Ese nombre es de un tercero — puede ser
 * un cliente de FlyCargo que no tiene nada que ver con Tráelo Ya — y no se
 * guarda: el prompt le pide al modelo que lo descarte, y además
 * `limpiarDescripcion` lo saca de nuevo del lado del servidor, por si el
 * modelo no cumple.
 */
export function buildReceiptExtractionPrompt(): string {
  return `Sos un asistente que lee recibos/guías de almacén de un courier de Estados Unidos a Bolivia (formato típico: "Warehouse Receipt" de KGE / Magaya Cargo System, con filas de Pcs/Package, Dimensions, Description, Weight, Volume).

El documento es un recibo o guía de un paquete recepcionado en almacén. Puede traer uno o varios bultos/ítems, cada uno con descripción, peso y a veces medidas.

Extraé TODOS los ítems que encuentres. Para cada uno:
- descripcion: SOLO el tipo de producto (ej: "Discos de música", "Zapatillas", "Herramientas"). Si el recibo trae un nombre de persona entre corchetes o como nota (ej: "[ OSCAR MEDINA ]"), NO lo incluyas — es el nombre del destinatario, no del producto, y no debe guardarse.
- peso_kg: el peso real en kg. Si el recibo lo da en libras (lb), convertilo a kg (1 lb = 0.453592 kg).
- dimensiones_cm: { largo, ancho, alto } en centímetros. Las medidas en los recibos suelen venir en PULGADAS (formato "17.80x13.40x4.80in") — convertilas a cm (1 in = 2.54 cm). Si no hay medidas, dejalo en null.
- numero_recibo: el número de recibo (ej: "W-115601"), se puede repetir entre ítems del mismo recibo.

Ignorá: volumen en m³, peso volumétrico (VKg) ya calculado, números de tracking, nombres de personas, direcciones.

Si el documento no es un recibo de almacén o no se puede leer, devolvé una lista vacía.

Respondé únicamente con el JSON, sin texto alrededor.

SALIDA
{
  "items": [
    {
      "numero_recibo": "texto o null",
      "descripcion": "texto",
      "peso_kg": 0,
      "dimensiones_cm": { "largo": 0, "ancho": 0, "alto": 0 }
    }
  ]
}`;
}

export interface ReceiptExtractedItem {
  numeroRecibo: string | null;
  descripcion: string;
  pesoKg: number;
  dimensionesCm: { largo: number; ancho: number; alto: number } | null;
}

/** Saca cualquier "[ ... ]" (el nombre del destinatario en los recibos de KGE) y espacios sobrantes. */
export function limpiarDescripcion(descripcion: string): string {
  return descripcion
    .replace(/\[[^\]]*\]?/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function parseReceiptExtraction(text: string): ReceiptExtractedItem[] {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const raw = JSON.parse(jsonMatch[0]) as { items?: unknown };
    if (!Array.isArray(raw.items)) return [];

    const out: ReceiptExtractedItem[] = [];
    for (const entry of raw.items as Array<Record<string, unknown>>) {
      if (!entry || typeof entry !== "object") continue;
      if (typeof entry.descripcion !== "string" || !isPositiveNumber(entry.peso_kg)) continue;

      const descripcion = limpiarDescripcion(entry.descripcion);
      if (!descripcion) continue;

      const d = entry.dimensiones_cm as Record<string, unknown> | null | undefined;
      const dimensionesCm =
        d && isPositiveNumber(d.largo) && isPositiveNumber(d.ancho) && isPositiveNumber(d.alto)
          ? { largo: d.largo, ancho: d.ancho, alto: d.alto }
          : null;

      out.push({
        numeroRecibo:
          typeof entry.numero_recibo === "string" && entry.numero_recibo.trim()
            ? entry.numero_recibo.trim()
            : null,
        descripcion,
        pesoKg: entry.peso_kg,
        dimensionesCm,
      });
    }
    return out;
  } catch {
    return [];
  }
}
