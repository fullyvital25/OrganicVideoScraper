import Anthropic from "@anthropic-ai/sdk";
import { VideoAnalysis } from "./types";

const SYSTEM_PROMPT = `You are a viral YouTube Shorts content analyst. Given a transcript, title, and performance metrics of a YouTube Short, analyze the content and return a JSON object with exactly these four fields:
- "hook": Identify and analyze the hook (first 3-5 seconds / opening line). What technique is used? Why is it effective?
- "body": Analyze the main body/content. What value does it deliver? How is it structured?
- "cta": Identify the call-to-action. Is it explicit or implicit? How effective is it?
- "whyItPerformed": Why did this Short perform well? Consider the topic, format, emotional triggers, and audience psychology.

Return ONLY valid JSON, no other text.`;

export async function analyzeTranscript(
  transcript: string,
  title: string,
  stats: { views: number; likes: number; comments: number }
): Promise<VideoAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Title: ${title}\nViews: ${stats.views.toLocaleString()} | Likes: ${stats.likes.toLocaleString()} | Comments: ${stats.comments.toLocaleString()}\n\nTranscript:\n${transcript}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    // Strip markdown code fences if present
    const jsonStr = text.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
    return JSON.parse(jsonStr) as VideoAnalysis;
  } catch {
    // Fallback: put raw response in hook field
    return {
      hook: text,
      body: "",
      cta: "",
      whyItPerformed: "",
    };
  }
}
