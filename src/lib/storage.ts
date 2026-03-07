import fs from "fs/promises";
import path from "path";
import { VideoResult } from "./types";

const RESULTS_DIR = "/tmp/shorts-scraper";
const RESULTS_FILE = path.join(RESULTS_DIR, "results.json");

export async function saveResults(results: VideoResult[]): Promise<void> {
  await fs.mkdir(RESULTS_DIR, { recursive: true });

  let existing: VideoResult[] = [];
  try {
    const data = await fs.readFile(RESULTS_FILE, "utf-8");
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }

  const merged = new Map<string, VideoResult>();
  for (const r of existing) merged.set(r.videoId, r);
  for (const r of results) merged.set(r.videoId, r);

  await fs.writeFile(
    RESULTS_FILE,
    JSON.stringify(Array.from(merged.values()), null, 2)
  );
}

export async function loadResults(): Promise<VideoResult[]> {
  try {
    const data = await fs.readFile(RESULTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}
