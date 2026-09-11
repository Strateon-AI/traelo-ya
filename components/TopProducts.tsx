import { ArrowRight, Boxes } from "lucide-react";
import type { TopProduct } from "@/lib/types";
import { formatUsd } from "@/lib/calculator";
import { catalogInquiryUrl, customProductInquiryUrl } from "@/lib/whatsapp";

export function TopProducts({ products }: { products: TopProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section id="precios" className="bg-surface-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
              Productos más vendidos
            </h2>
            <p className="mt-2 text-navy-600">
              Lo que más nos piden traer nuestros clientes.
            </p>
          </div>
          <a
            href={catalogInquiryUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 hover:underline"
          >
            Ver todos los productos
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col items-center rounded-2xl border border-surface-200 bg-white p-4 text-center shadow-sm"
            >
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-surface-50">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <Boxes className="h-8 w-8 text-navy-300" strokeWidth={1.5} />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-navy-800">{product.name}</p>
              {product.price !== null && (
                <p className="mt-0.5 text-base font-extrabold text-brand-red-600">
                  {formatUsd(product.price)}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-blue-500/40 bg-brand-blue-100/30 p-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-blue-600 shadow-sm">
              <Boxes className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm font-bold text-navy-900">¿Otro producto?</p>
            <p className="mt-1 text-xs leading-snug text-navy-600">
              Usa nuestro cotizador o envíanos el link de la tienda y te damos el precio al
              instante.
            </p>
            <a
              href={customProductInquiryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-blue-600 hover:underline"
            >
              Cotizar otro producto
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
