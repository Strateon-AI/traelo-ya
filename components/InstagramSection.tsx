import type { InstagramVideo } from "@/lib/types";
import { ExternalLink } from "lucide-react";

/**
 * Embeds de Instagram vía iframe directo a instagram.com/{tipo}/{code}/embed —
 * no necesita script externo (a diferencia del embed de TikTok), así que no
 * hace falta el timeout/fallback que usamos ahí. Si el post no admite embed
 * (privado, borrado), Instagram muestra su propio aviso adentro del iframe.
 */
function extractEmbed(url: string): { type: string; code: string } | null {
  const match = url.match(/instagram\.com\/(p|reel|reels|tv)\/([^/?#]+)/i);
  if (!match) return null;
  const type = match[1].toLowerCase() === "reels" ? "reel" : match[1].toLowerCase();
  return { type, code: match[2] };
}

export function InstagramSection({ videos }: { videos: InstagramVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          Míranos en Instagram
        </h2>
        <p className="mt-2 text-navy-600">Pedidos reales, en video.</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <InstagramEmbed key={video.id} url={video.videoUrl} />
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramEmbed({ url }: { url: string }) {
  const embed = extractEmbed(url);

  if (!embed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-2xl border border-surface-200 bg-surface-50 p-6 text-center text-sm font-semibold text-navy-700 hover:bg-surface-100"
      >
        Ver publicación en Instagram
        <ExternalLink className="h-4 w-4" />
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-50">
      <iframe
        src={`https://www.instagram.com/${embed.type}/${embed.code}/embed/captioned/`}
        className="aspect-[9/16] w-full"
        loading="lazy"
        allowFullScreen
        title="Publicación de Instagram"
      />
    </div>
  );
}
