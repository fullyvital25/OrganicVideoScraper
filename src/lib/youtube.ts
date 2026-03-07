import { YouTubeVideo, VideoStats } from "./types";

const API_BASE = "https://www.googleapis.com/youtube/v3";

export async function searchShorts(
  keyword: string,
  maxResults: number
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const params = new URLSearchParams({
    part: "snippet",
    q: `${keyword} #shorts`,
    type: "video",
    videoDuration: "short",
    order: "viewCount",
    maxResults: String(maxResults),
    key: apiKey,
  });

  const res = await fetch(`${API_BASE}/search?${params}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube search API error (${res.status}): ${body}`);
  }

  const data = await res.json();

  return (data.items || []).map(
    (item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    })
  );
}

export async function getVideoStats(
  videoIds: string[]
): Promise<Map<string, VideoStats>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const stats = new Map<string, VideoStats>();

  // Batch in groups of 50 (API limit)
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: "statistics",
      id: batch.join(","),
      key: apiKey,
    });

    const res = await fetch(`${API_BASE}/videos?${params}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube videos API error (${res.status}): ${body}`);
    }

    const data = await res.json();
    for (const item of data.items || []) {
      stats.set(item.id, {
        viewCount: parseInt(item.statistics.viewCount || "0", 10),
        likeCount: parseInt(item.statistics.likeCount || "0", 10),
        commentCount: parseInt(item.statistics.commentCount || "0", 10),
      });
    }
  }

  return stats;
}
