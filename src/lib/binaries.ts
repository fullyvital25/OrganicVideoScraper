const BINARY_PATHS: Record<string, string> = {
  "yt-dlp": "/usr/local/bin/yt-dlp",
  ffmpeg: "/usr/local/bin/ffmpeg",
};

export function resolveBinary(name: string): string {
  return BINARY_PATHS[name] ?? name;
}
