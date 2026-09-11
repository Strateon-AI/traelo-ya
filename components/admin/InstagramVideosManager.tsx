"use client";

import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import type { InstagramVideo } from "@/lib/types";
import { deleteInstagramVideo, upsertInstagramVideo } from "@/app/admin/actions";
import { Banner } from "./Banner";

type DraftVideo = InstagramVideo & { isNew?: boolean };

export function InstagramVideosManager({ initial }: { initial: InstagramVideo[] }) {
  const [videos, setVideos] = useState<DraftVideo[]>(initial);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function update(id: string, patch: Partial<DraftVideo>) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function addVideo() {
    if (videos.length >= 3) {
      setBanner({ type: "error", text: "Máximo 3 videos — borrá uno para agregar otro." });
      return;
    }
    const draft: DraftVideo = {
      id: `nuevo-${crypto.randomUUID()}`,
      videoUrl: "",
      sortOrder: videos.length + 1,
      visible: true,
      isNew: true,
    };
    setVideos((prev) => [...prev, draft]);
  }

  async function save(video: DraftVideo) {
    if (!video.videoUrl.includes("instagram.com")) {
      setBanner({ type: "error", text: "Pegá el link completo de la publicación de Instagram." });
      return;
    }
    setSavingId(video.id);
    setBanner(null);
    const result = await upsertInstagramVideo({
      id: video.isNew ? null : video.id,
      videoUrl: video.videoUrl,
      sortOrder: video.sortOrder,
      visible: video.visible,
    });
    setSavingId(null);
    if (result.error) {
      setBanner({ type: "error", text: result.error });
      return;
    }
    setBanner({ type: "success", text: "Video guardado." });
    if (video.isNew) window.location.reload();
  }

  async function remove(video: DraftVideo) {
    if (video.isNew) {
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
      return;
    }
    setSavingId(video.id);
    const result = await deleteInstagramVideo(video.id);
    setSavingId(null);
    if (result.error) {
      setBanner({ type: "error", text: result.error });
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== video.id));
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-card sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-navy-900">Videos de Instagram</h2>
          <p className="mt-1 text-sm text-navy-600">
            Hasta 3 videos, se reproducen en la home. Pegá el link completo de la publicación
            (ej. https://www.instagram.com/reel/ABC123/ o https://www.instagram.com/p/ABC123/).
          </p>
        </div>
        <button
          type="button"
          onClick={addVideo}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-brand-blue-100 px-3.5 py-2 text-xs font-semibold text-brand-blue-600 hover:bg-brand-blue-100/70"
        >
          <Plus className="h-4 w-4" />
          Agregar video
        </button>
      </div>

      <Banner banner={banner} />

      <div className="mt-5 space-y-3">
        {videos.map((video) => (
          <div
            key={video.id}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-surface-200 p-4 sm:grid-cols-[1fr_auto_auto]"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-navy-600">
                Link de la publicación
              </span>
              <input
                type="url"
                value={video.videoUrl}
                onChange={(e) => update(video.id, { videoUrl: e.target.value })}
                placeholder="https://www.instagram.com/reel/..."
                className="focus-ring w-full rounded-lg border border-surface-200 px-3 py-2 text-sm placeholder:text-navy-400"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-navy-700 sm:pb-0 sm:self-center">
              <input
                type="checkbox"
                checked={video.visible}
                onChange={(e) => update(video.id, { visible: e.target.checked })}
                className="h-4 w-4"
              />
              Visible
            </label>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => save(video)}
                disabled={savingId === video.id}
                aria-label="Guardar"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-brand-blue-600 hover:bg-brand-blue-100/60 disabled:opacity-60"
              >
                <Save className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(video)}
                disabled={savingId === video.id}
                aria-label="Eliminar"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-navy-400 hover:bg-brand-red-600/10 hover:text-brand-red-600"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <p className="text-sm text-navy-500">Todavía no hay videos cargados.</p>
        )}
      </div>
    </section>
  );
}
