"use client";

import { useState } from "react";
import { VideoResultRow } from "@/lib/types";

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

interface PastResultsProps {
  rows: VideoResultRow[];
  loading: boolean;
  onRefresh: () => void;
}

export default function PastResults({ rows, loading, onRefresh }: PastResultsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Past Results</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {loading && rows.length === 0 && (
        <div className="text-gray-500 text-sm py-4 text-center">Loading past results...</div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-gray-500 text-sm py-4 text-center">No past results found.</div>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Keyword",
                  "Title",
                  "URL",
                  "Views",
                  "Likes",
                  "Comments",
                  "Platform",
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
              {rows.map((r) => (
                <tr key={r.id ?? r.video_url}>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                      {r.keyword}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="font-medium text-gray-900 truncate" title={r.video_title}>
                      {r.video_title}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={r.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Watch
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">{r.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{r.likes.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{r.comments.toLocaleString()}</td>
                  <td className="px-4 py-3">{r.platform}</td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <ExpandableCell text={r.transcript} />
                  </td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <ExpandableCell text={r.hook_analysis} />
                  </td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <ExpandableCell text={r.body_analysis} />
                  </td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <ExpandableCell text={r.cta_analysis} />
                  </td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <ExpandableCell text={r.why_it_performed} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
