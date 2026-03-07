import OpenAI from "openai";
import fs from "fs";
import { stat } from "fs/promises";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Whisper limit

export async function transcribeAudio(audioPath: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const fileInfo = await stat(audioPath);
  if (fileInfo.size > MAX_FILE_SIZE) {
    throw new Error(
      `Audio file too large (${(fileInfo.size / 1024 / 1024).toFixed(1)}MB). Whisper limit is 25MB.`
    );
  }

  const openai = new OpenAI({ apiKey });

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: fs.createReadStream(audioPath),
    response_format: "text",
  });

  return transcription as unknown as string;
}
