"use client";

import { useState, useEffect, useCallback } from "react";
import SearchForm from "@/components/SearchForm";
import ProgressLog from "@/components/ProgressLog";
import ResultsTable from "@/components/ResultsTable";
import PastResults from "@/components/PastResults";
import { ProgressEvent, VideoResult, VideoResultRow } from "@/lib/types";

interface LogEntry {
  message: string;
  isError: boolean;
}

export default function Home() {
  const [keywords, setKeywords] = useState("");
  const [minViews, setMinViews] = useState(10000);
  const [minLikes, setMinLikes] = useState(500);
  const [minComments, setMinComments] = useState(50);
  const [maxResults, setMaxResults] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [pastResults, setPastResults] = useState<VideoResultRow[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  const fetchPastResults = useCallback(async () => {
    setLoadingPast(true);
    try {
      const res = await fetch("/api/results");
      if (res.ok) {
        const data = await res.json();
        setPastResults(data);
      }
    } catch {
      // Silently fail — past results are non-critical
    } finally {
      setLoadingPast(false);
    }
  }, []);

  useEffect(() => {
    fetchPastResults();
  }, [fetchPastResults]);

  const handleSearch = async () => {
    setIsRunning(true);
    setLogs([]);
    setResults([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          minViews,
          minLikes,
          minComments,
          maxResultsPerKeyword: maxResults,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setLogs((prev) => [
          ...prev,
          { message: `Error: ${errData.error}`, isError: true },
        ]);
        setIsRunning(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop()!;

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          try {
            const event: ProgressEvent = JSON.parse(line.slice(6));

            switch (event.type) {
              case "status":
                setLogs((prev) => [
                  ...prev,
                  { message: event.message!, isError: false },
                ]);
                break;
              case "error":
                setLogs((prev) => [
                  ...prev,
                  { message: event.message!, isError: true },
                ]);
                break;
              case "result":
                if (event.data) {
                  setResults((prev) => [...prev, event.data!]);
                }
                break;
              case "done":
                setLogs((prev) => [
                  ...prev,
                  {
                    message: `Done! ${event.totalResults} video(s) processed.`,
                    isError: false,
                  },
                ]);
                break;
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        {
          message: `Network error: ${err instanceof Error ? err.message : String(err)}`,
          isError: true,
        },
      ]);
    } finally {
      setIsRunning(false);
      fetchPastResults();
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">ShortsScraper</h1>
        <p className="text-gray-600">
          Search YouTube Shorts, transcribe with Whisper, and analyze with Claude.
        </p>

        <SearchForm
          keywords={keywords}
          setKeywords={setKeywords}
          minViews={minViews}
          setMinViews={setMinViews}
          minLikes={minLikes}
          setMinLikes={setMinLikes}
          minComments={minComments}
          setMinComments={setMinComments}
          maxResults={maxResults}
          setMaxResults={setMaxResults}
          isRunning={isRunning}
          onSubmit={handleSearch}
        />

        <ProgressLog logs={logs} />

        <ResultsTable results={results} />

        <PastResults rows={pastResults} loading={loadingPast} onRefresh={fetchPastResults} />
      </div>
    </main>
  );
}
