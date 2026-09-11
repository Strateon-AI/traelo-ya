"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import type { Promo, QuoteConfig, TiktokVideo, TopProduct } from "@/lib/types";
import { signOut } from "@/app/admin/actions";
import { QuoteConfigForm } from "./QuoteConfigForm";
import { PromoForm } from "./PromoForm";
import { TopProductsManager } from "./TopProductsManager";
import { TiktokVideosManager } from "./TiktokVideosManager";

export function AdminDashboard({
  userEmail,
  initialPromo,
  initialQuoteConfig,
  initialTopProducts,
  initialTiktokVideos,
}: {
  userEmail: string;
  initialPromo: Promo | null;
  initialQuoteConfig: QuoteConfig | null;
  initialTopProducts: TopProduct[];
  initialTiktokVideos: TiktokVideo[];
}) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      <header className="border-b border-surface-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <Logo tagline={false} />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-navy-600 sm:inline">{userEmail}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-brand-red-600"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <QuoteConfigForm initial={initialQuoteConfig ?? { weightRatePerKg: 28, commissionPercent: 5 }} />
        <PromoForm initial={initialPromo} />
        <TopProductsManager initial={initialTopProducts} />
        <TiktokVideosManager initial={initialTiktokVideos} />
      </div>
    </div>
  );
}
