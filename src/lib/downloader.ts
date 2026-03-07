import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { resolveBinary } from "./binaries";

const execFileAsync = promisify(execFile);
const DOWNLOAD_DIR = "/tmp/shorts-scraper/downloads";

export async function ensureDownloadDir(): Promise<string> {
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
  return DOWNLOAD_DIR;
}

export async function downloadVideo(videoId: string): Promise<string> {
  const dir = await ensureDownloadDir();
  const url = `https://www.youtube.com/shorts/${videoId}`;
  const outputTemplate = path.join(dir, `${videoId}.%(ext)s`);

  await execFileAsync(
    resolveBinary("yt-dlp"),
    [
      "-f",
      "best[height<=720]",
      "--no-playlist",
      "-o",
      outputTemplate,
      url,
    ],
    { timeout: 60000 }
  );

  // Find the downloaded file (extension varies)
  const files = await fs.readdir(dir);
  const videoFile = files.find(
    (f) => f.startsWith(videoId) && !f.endsWith(".mp3")
  );
  if (!videoFile) throw new Error(`Downloaded file not found for ${videoId}`);

  return path.join(dir, videoFile);
}

export async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^.]+$/, ".mp3");

  await execFileAsync(
    resolveBinary("ffmpeg"),
    ["-i", videoPath, "-vn", "-acodec", "libmp3lame", "-q:a", "4", "-y", audioPath],
    { timeout: 30000 }
  );

  return audioPath;
}

export async function cleanup(videoId: string): Promise<void> {
  try {
    const files = await fs.readdir(DOWNLOAD_DIR);
    for (const file of files) {
      if (file.startsWith(videoId)) {
        await fs.unlink(path.join(DOWNLOAD_DIR, file));
      }
    }
  } catch {
    // Cleanup errors are non-critical
  }
}
