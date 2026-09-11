import { createPublicClient } from "@/lib/supabase/public";
import type { InstagramVideo } from "@/lib/types";

export async function getInstagramVideos(): Promise<InstagramVideo[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("instagram_videos")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true })
    .limit(3);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    videoUrl: row.video_url,
    sortOrder: row.sort_order,
    visible: row.visible,
  }));
}
