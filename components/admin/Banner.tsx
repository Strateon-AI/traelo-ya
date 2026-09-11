export function Banner({ banner }: { banner: { type: "success" | "error"; text: string } | null }) {
  if (!banner) return null;
  return (
    <div
      className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
        banner.type === "success"
          ? "bg-whatsapp-600/10 text-whatsapp-700"
          : "bg-brand-red-600/10 text-brand-red-600"
      }`}
    >
      {banner.text}
    </div>
  );
}
