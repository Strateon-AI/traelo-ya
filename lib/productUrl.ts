/**
 * Qué links acepta el cotizador, y cómo se resuelven los links cortos.
 *
 * La lista blanca no es cosmética: `/api/estimar-peso` es un endpoint público
 * que hace un fetch desde el servidor a la URL que mande el cliente. Sin
 * restringir el destino, cualquiera puede apuntarlo a direcciones internas
 * (localhost, 169.254.169.254, IPs privadas) y usarlo para sondear la infra
 * desde adentro. Con la lista, un host que no sea una de estas tiendas nunca
 * llega a pedirse.
 *
 * Para agregar una tienda nueva alcanza con sumar el dominio base acá.
 */
const ALLOWED_STORE_DOMAINS = [
  "amazon.com",
  "ebay.com",
  "walmart.com",
  "bestbuy.com",
  "target.com",
  "playstation.com",
] as const;

/**
 * Links cortos que genera la app de Amazon al compartir. Se aceptan como
 * entrada, pero solo valen si la redirección termina en un dominio de la
 * lista de arriba — el destino se valida igual que cualquier otro link.
 */
const SHORT_LINK_HOSTS = new Set(["a.co", "amzn.to"]);

const SHORT_LINK_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

/** Tiendas soportadas, para mostrarle al cliente cuando pega otra cosa. */
export const ALLOWED_STORES_LABEL = "Amazon, eBay, Walmart, Best Buy, Target y PlayStation";

function hostOf(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * El host es exactamente el dominio o un subdominio suyo. El chequeo con el
 * punto adelante es lo que evita que `amazon.com.sitio-falso.net` pase por
 * Amazon.
 */
function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/** ¿Es una de las tiendas permitidas? Una IP literal nunca entra acá. */
export function isAllowedProductHost(rawUrl: string): boolean {
  const host = hostOf(rawUrl);
  if (!host) return false;
  return ALLOWED_STORE_DOMAINS.some((domain) => matchesDomain(host, domain));
}

export function isShortLink(rawUrl: string): boolean {
  const host = hostOf(rawUrl);
  return host !== null && SHORT_LINK_HOSTS.has(host);
}

/** Acepta tanto una tienda de la lista como un link corto todavía sin resolver. */
export function isValidProductUrl(rawUrl: string): boolean {
  return isAllowedProductHost(rawUrl) || isShortLink(rawUrl);
}

/**
 * Sigue la cadena de redirecciones de un link corto sin bajar la página
 * completa — solo lee el header `location`. Devuelve null si la cadena
 * termina fuera de las tiendas permitidas, si se pasa de saltos o si falla:
 * en todos esos casos el link se trata como inválido y no se pide nada más.
 */
export async function resolveShortLink(rawUrl: string): Promise<string | null> {
  let current = rawUrl;

  for (let i = 0; i < MAX_REDIRECTS; i++) {
    // Cada salto se valida antes de pedirlo: el primero tiene que ser un
    // link corto conocido, y los siguientes, una tienda permitida.
    if (i > 0 && !isAllowedProductHost(current)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SHORT_LINK_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current, { redirect: "manual", signal: controller.signal });
    } catch (err) {
      console.error(
        "[productUrl] resolveShortLink error:",
        err instanceof Error ? err.message : err
      );
      return null;
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      try {
        current = new URL(location, current).toString();
      } catch {
        return null;
      }
      continue;
    }
    break;
  }

  return isAllowedProductHost(current) ? current : null;
}

/**
 * Deja el link listo para trabajar: resuelve el corto si hace falta y
 * devuelve null si el destino no es una tienda permitida.
 */
export async function resolveProductUrl(rawUrl: string): Promise<string | null> {
  if (isShortLink(rawUrl)) return resolveShortLink(rawUrl);
  return isAllowedProductHost(rawUrl) ? rawUrl : null;
}
