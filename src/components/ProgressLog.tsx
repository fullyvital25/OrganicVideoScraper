"use client";

import { useEffect, useRef } from "react";

interface LogEntry {
  message: string;
  isError: boolean;
}

interface ProgressLogProps {
  logs: LogEntry[];
}

export default function ProgressLog({ logs }: ProgressLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="bg-gray-900 rounded-lg shadow p-4 max-h-48 overflow-y-auto font-mono text-xs">
      {logs.map((log, i) => (
        <div
          key={i}
          className={log.isError ? "text-red-400" : "text-green-400"}
        >
          {log.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
