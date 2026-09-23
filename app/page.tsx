import { getQuoteConfig } from "@/lib/data/quoteConfig";
import { getTopProducts } from "@/lib/data/topProducts";
import { getInstagramVideos } from "@/lib/data/instagram";
import { getFlatRateCategories } from "@/lib/data/flatRateCategories";
import { Header } from "@/components/Header";
import { PromoBanner } from "@/components/PromoBanner";
import { Hero } from "@/components/Hero";
import { TrackingSection } from "@/components/TrackingSection";
import { HowItWorks } from "@/components/HowItWorks";
import { TopProducts } from "@/components/TopProducts";
import { InstagramSection } from "@/components/InstagramSection";
import { FAQ } from "@/components/FAQ";
import { BrandsSection } from "@/components/BrandsSection";
import { Footer } from "@/components/Footer";

// El contenido viene de Supabase y puede cambiar desde /admin — se
// revalida cada 60s (mismo criterio que La Tienda) en vez de quedar
// cacheado para siempre.
export const revalidate = 60;

export default async function Home() {
  const [config, topProducts, instagramVideos, flatRateCategories] = await Promise.all([
    getQuoteConfig(),
    getTopProducts(),
    getInstagramVideos(),
    getFlatRateCategories(),
  ]);

  const calculatorProducts = topProducts.map((p) => ({ id: p.id, name: p.name }));

  return (
    <>
      <Header />
      <PromoBanner />
      <main className="flex-1">
        <Hero
          config={config}
          calculatorProducts={calculatorProducts}
          flatRateCategories={flatRateCategories}
        />
        <TrackingSection />
        <HowItWorks />
        <TopProducts products={topProducts} />
        <InstagramSection videos={instagramVideos} />
        <FAQ />
        <BrandsSection />
      </main>
      <Footer />
    </>
  );
}
