"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ExternalLink } from "lucide-react";
import type { TiktokVideo } from "@/lib/types";

function extractVideoId(url: string): string | null {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Embeds reales de TikTok. Aviso de otro proyecto (Olardu): la cáscara del
 * embed a veces carga pero el video no arranca, y TikTok puede responder
 * "overload-protect triggered" con varios seguidos. Por eso cada tarjeta
 * tiene su propio timeout: si a los 6s no apareció el iframe real, cae a
 * un link directo a TikTok en vez de dejar un hueco vacío.
 */
export function TikTokSection({ videos }: { videos: TiktokVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          Míranos en TikTok
        </h2>
        <p className="mt-2 text-navy-600">Pedidos reales, en video.</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <TikTokEmbed key={video.id} url={video.videoUrl} />
          ))}
        </div>
      </div>
      <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </section>
  );
}

function TikTokEmbed({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoId = extractVideoId(url);

  useEffect(() => {
    if (!videoId) return;
    const timeout = window.setTimeout(() => {
      const hasIframe = containerRef.current?.querySelector("iframe");
      if (!hasIframe) setFailed(true);
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [videoId]);

  if (failed || !videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-2xl border border-surface-200 bg-surface-50 p-6 text-center text-sm font-semibold text-navy-700 hover:bg-surface-100"
      >
        Ver video en TikTok
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  }

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl bg-surface-50">
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ maxWidth: "100%", minWidth: "100%" }}
      >
        <section />
      </blockquote>
    </div>
  );
}
