import { createClient } from "@supabase/supabase-js";
import { VideoResult, VideoResultRow } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveVideoResult(
  keyword: string,
  result: VideoResult
): Promise<void> {
  const row: Omit<VideoResultRow, "id" | "created_at"> = {
    keyword,
    video_title: result.title,
    video_url: result.url,
    views: result.views,
    likes: result.likes,
    comments: result.comments,
    transcript: result.transcript,
    hook_analysis: result.analysis?.hook ?? null,
    body_analysis: result.analysis?.body ?? null,
    cta_analysis: result.analysis?.cta ?? null,
    why_it_performed: result.analysis?.whyItPerformed ?? null,
    platform: "youtube",
  };

  const { error } = await supabase
    .from("video_results")
    .upsert(row, { onConflict: "video_url" });

  if (error) {
    throw new Error(`Supabase save error: ${error.message}`);
  }
}

export async function loadPastResults(): Promise<VideoResultRow[]> {
  const { data, error } = await supabase
    .from("video_results")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase load error: ${error.message}`);
  }

  return data ?? [];
}
