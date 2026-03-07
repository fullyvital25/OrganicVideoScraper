import { loadPastResults } from "@/lib/supabase";

export async function GET() {
  try {
    const results = await loadPastResults();
    return Response.json(results);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
