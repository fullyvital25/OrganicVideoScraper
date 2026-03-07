"use client";

import { useState } from "react";
import { VideoResult } from "@/lib/types";

interface ResultsTableProps {
  results: VideoResult[];
}

function ExpandableCell({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return <span className="text-gray-400 italic">N/A</span>;

  const isLong = text.length > 120;

  return (
    <div>
      <span className="whitespace-pre-wrap">
        {expanded || !isLong ? text : `${text.slice(0, 120)}...`}
      </span>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-500 hover:text-blue-700 text-xs ml-1 underline"
        >
          {expanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
}

export default function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {[
              "Title",
              "URL",
              "Views",
              "Likes",
              "Comments",
              "Transcript",
              "Hook Analysis",
              "Body Analysis",
              "CTA Analysis",
              "Why It Performed",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {results.map((r) => (
            <tr key={r.videoId} className={r.error ? "bg-red-50" : ""}>
              <td className="px-4 py-3 max-w-[200px]">
                <div className="font-medium text-gray-900 truncate" title={r.title}>
                  {r.title}
                </div>
                {r.error && (
                  <div className="text-red-600 text-xs mt-1">{r.error}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Watch
                </a>
              </td>
              <td className="px-4 py-3 text-right">
                {r.views.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                {r.likes.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                {r.comments.toLocaleString()}
              </td>
              <td className="px-4 py-3 max-w-[300px]">
                <ExpandableCell text={r.transcript} />
              </td>
              <td className="px-4 py-3 max-w-[250px]">
                <ExpandableCell text={r.analysis?.hook ?? null} />
              </td>
              <td className="px-4 py-3 max-w-[250px]">
                <ExpandableCell text={r.analysis?.body ?? null} />
              </td>
              <td className="px-4 py-3 max-w-[250px]">
                <ExpandableCell text={r.analysis?.cta ?? null} />
              </td>
              <td className="px-4 py-3 max-w-[250px]">
                <ExpandableCell text={r.analysis?.whyItPerformed ?? null} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
