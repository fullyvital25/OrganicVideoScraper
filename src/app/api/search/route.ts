import { NextRequest } from "next/server";
import { SearchParams, ProgressEvent, VideoResult, YouTubeVideo } from "@/lib/types";
import { checkDependencies } from "@/lib/preflight";
import { searchShorts, getVideoStats } from "@/lib/youtube";
import { downloadVideo, extractAudio, cleanup } from "@/lib/downloader";
import { transcribeAudio } from "@/lib/transcriber";
import { analyzeTranscript } from "@/lib/analyzer";
import { saveResults } from "@/lib/storage";
import { saveVideoResult } from "@/lib/supabase";

export const maxDuration = 300; // 5 min max for long processing

export async function POST(request: NextRequest) {
  let body: SearchParams;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { keywords, minViews, minLikes, minComments, maxResultsPerKeyword } = body;

  if (!keywords || keywords.length === 0) {
    return new Response(JSON.stringify({ error: "Keywords are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check env vars
  const missingKeys = [];
  if (!process.env.YOUTUBE_API_KEY) missingKeys.push("YOUTUBE_API_KEY");
  if (!process.env.OPENAI_API_KEY) missingKeys.push("OPENAI_API_KEY");
  if (!process.env.ANTHROPIC_API_KEY) missingKeys.push("ANTHROPIC_API_KEY");
  if (missingKeys.length > 0) {
    return new Response(
      JSON.stringify({ error: `Missing environment variables: ${missingKeys.join(", ")}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check dependencies
  const deps = await checkDependencies();
  if (!deps.ytdlp || !deps.ffmpeg) {
    const missing = [];
    if (!deps.ytdlp) missing.push("yt-dlp");
    if (!deps.ffmpeg) missing.push("ffmpeg");
    return new Response(
      JSON.stringify({
        error: `Missing system dependencies: ${missing.join(", ")}. Install with: brew install ${missing.join(" ")}`,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // Step 1: Search YouTube for each keyword
        send({ type: "status", message: "Searching YouTube for Shorts..." });

        const allVideos: YouTubeVideo[] = [];
        const seenIds = new Set<string>();
        const videoKeywordMap = new Map<string, string>();

        for (const keyword of keywords) {
          send({ type: "status", message: `Searching for "${keyword}"...` });
          try {
            const videos = await searchShorts(keyword, maxResultsPerKeyword);
            for (const video of videos) {
              if (!seenIds.has(video.videoId)) {
                seenIds.add(video.videoId);
                allVideos.push(video);
                videoKeywordMap.set(video.videoId, keyword);
              }
            }
          } catch (err) {
            send({
              type: "error",
              message: `YouTube search failed for "${keyword}": ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }

        if (allVideos.length === 0) {
          send({ type: "error", message: "No videos found for any keyword." });
          send({ type: "done", totalResults: 0 });
          controller.close();
          return;
        }

        // Step 2: Fetch statistics
        send({ type: "status", message: `Fetching statistics for ${allVideos.length} videos...` });
        const statsMap = await getVideoStats(allVideos.map((v) => v.videoId));

        // Step 3: Filter by thresholds
        const qualifying = allVideos.filter((video) => {
          const stats = statsMap.get(video.videoId);
          if (!stats) return false;
          return (
            stats.viewCount >= minViews &&
            stats.likeCount >= minLikes &&
            stats.commentCount >= minComments
          );
        });

        send({
          type: "status",
          message: `${qualifying.length} videos meet thresholds (out of ${allVideos.length} found).`,
        });

        if (qualifying.length === 0) {
          send({ type: "error", message: "No videos met the minimum thresholds." });
          send({ type: "done", totalResults: 0 });
          controller.close();
          return;
        }

        // Step 4: Process each video sequentially (cap to maxResultsPerKeyword)
        const toProcess = qualifying.slice(0, maxResultsPerKeyword);
        const results: VideoResult[] = [];

        for (let i = 0; i < toProcess.length; i++) {
          const video = toProcess[i];
          const stats = statsMap.get(video.videoId)!;
          const videoNum = `[${i + 1}/${toProcess.length}]`;

          const result: VideoResult = {
            videoId: video.videoId,
            title: video.title,
            url: `https://www.youtube.com/shorts/${video.videoId}`,
            channelTitle: video.channelTitle,
            publishedAt: video.publishedAt,
            views: stats.viewCount,
            likes: stats.likeCount,
            comments: stats.commentCount,
            transcript: null,
            analysis: null,
          };

          try {
            // Download
            send({ type: "status", message: `${videoNum} Downloading "${video.title}"...` });
            const videoPath = await downloadVideo(video.videoId);

            // Extract audio
            send({ type: "status", message: `${videoNum} Extracting audio...` });
            const audioPath = await extractAudio(videoPath);

            // Transcribe
            send({ type: "status", message: `${videoNum} Transcribing with Whisper...` });
            result.transcript = await transcribeAudio(audioPath);

            // Analyze
            send({ type: "status", message: `${videoNum} Analyzing with Claude...` });
            result.analysis = await analyzeTranscript(result.transcript, video.title, {
              views: stats.viewCount,
              likes: stats.likeCount,
              comments: stats.commentCount,
            });

            send({ type: "status", message: `${videoNum} Done processing "${video.title}".` });
          } catch (err) {
            result.error = err instanceof Error ? err.message : String(err);
            send({
              type: "error",
              message: `${videoNum} Error processing "${video.title}": ${result.error}`,
            });
          } finally {
            await cleanup(video.videoId);
          }

          // Save to Supabase
          if (!result.error) {
            try {
              const kw = videoKeywordMap.get(video.videoId) || keywords[0];
              await saveVideoResult(kw, result);
            } catch (err) {
              send({
                type: "error",
                message: `${videoNum} Supabase save failed: ${err instanceof Error ? err.message : String(err)}`,
              });
            }
          }

          results.push(result);
          send({ type: "result", data: result });
        }

        // Save results
        send({ type: "status", message: "Saving results..." });
        await saveResults(results);

        send({ type: "done", totalResults: results.length });
      } catch (err) {
        send({
          type: "error",
          message: `Fatal error: ${err instanceof Error ? err.message : String(err)}`,
        });
        send({ type: "done", totalResults: 0 });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
