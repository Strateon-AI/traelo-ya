import { getPromo, getPromoStatus } from "@/lib/data/promo";
import { PromoModal } from "./PromoModal";

// Server Component: trae los datos de la promo y decide si está vigente.
// Sin cambios en esa lógica — lo único que cambió es la presentación
// (antes una franja arriba de la página, ahora un modal), que vive en
// PromoModal (Client Component).
export async function PromoBanner() {
  const promo = await getPromo();
  const status = getPromoStatus(promo);

  if (status !== "vigente") return null;
  if (!promo.title && !promo.description) return null;

  return <PromoModal promo={promo} />;
}
