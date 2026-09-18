import type { WeightEstimate, WeightEstimateSource } from "@/lib/types";

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
export function buildWeightPrompt(divisor: number): string {
  return `Sos el estimador de peso de un servicio de courier de Estados Unidos a Bolivia.
Recibís la información de una página de producto y devolvés cuánto va a pesar
LA CAJA EN QUE SE ENVÍA EL PRODUCTO, no el producto desnudo.

CONFIGURACIÓN
- Divisor volumétrico del courier: ${divisor}
- peso_volumetrico_kg = (largo_cm × ancho_cm × alto_cm) / ${divisor}

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
export function buildWeightSearchPrompt(divisor: number): string {
  return `Sos el estimador de peso de un servicio de courier de Estados Unidos a Bolivia.

No se pudo leer directamente la página del producto — la tienda bloquea el acceso automatizado. Te doy el NOMBRE DEL PRODUCTO tal como lo escribió el cliente, y el nombre de la tienda. Buscá en la web información sobre este producto (especificaciones del fabricante, la misma publicación en otra tienda, reviews que mencionen el tamaño de la caja de envío, foros) para estimar cuánto va a pesar LA CAJA EN QUE SE ENVÍA, no el producto desnudo.

CONFIGURACIÓN
- Divisor volumétrico del courier: ${divisor}
- peso_volumetrico_kg = (largo_cm × ancho_cm × alto_cm) / ${divisor}

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
