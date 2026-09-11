import { getPromo, getPromoStatus } from "@/lib/data/promo";
import { WhatsAppGlyph } from "./icons";
import { genericContactUrl } from "@/lib/whatsapp";

export async function PromoBanner() {
  const promo = await getPromo();
  const status = getPromoStatus(promo);

  if (status !== "vigente") return null;
  if (!promo.title && !promo.description) return null;

  return (
    <section className="bg-brand-red-600">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-3.5 text-center sm:flex-row sm:justify-between sm:gap-4 sm:px-6 sm:text-left lg:px-8">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
          {promo.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={promo.imageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          )}
          <div>
            {promo.title && (
              <p className="text-sm font-extrabold text-white sm:text-base">{promo.title}</p>
            )}
            {promo.description && (
              <p className="text-xs text-white/90 sm:text-sm">{promo.description}</p>
            )}
          </div>
        </div>
        <a
          href={genericContactUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-red-600 hover:bg-white/90"
        >
          <WhatsAppGlyph className="h-4 w-4" />
          {promo.ctaText}
        </a>
      </div>
    </section>
  );
}
