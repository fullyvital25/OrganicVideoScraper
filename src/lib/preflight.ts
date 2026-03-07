import { execFile } from "child_process";
import { promisify } from "util";
import { resolveBinary } from "./binaries";

const execFileAsync = promisify(execFile);

export async function checkDependencies(): Promise<{
  ytdlp: boolean;
  ffmpeg: boolean;
}> {
  const check = async (name: string, args: string[]): Promise<boolean> => {
    try {
      await execFileAsync(resolveBinary(name), args, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  };

  const [ytdlp, ffmpeg] = await Promise.all([
    check("yt-dlp", ["--version"]),
    check("ffmpeg", ["-version"]),
  ]);

  return { ytdlp, ffmpeg };
}
