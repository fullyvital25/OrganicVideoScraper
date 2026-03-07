"use client";

interface SearchFormProps {
  keywords: string;
  setKeywords: (v: string) => void;
  minViews: number;
  setMinViews: (v: number) => void;
  minLikes: number;
  setMinLikes: (v: number) => void;
  minComments: number;
  setMinComments: (v: number) => void;
  maxResults: number;
  setMaxResults: (v: number) => void;
  isRunning: boolean;
  onSubmit: () => void;
}

export default function SearchForm({
  keywords,
  setKeywords,
  minViews,
  setMinViews,
  minLikes,
  setMinLikes,
  minComments,
  setMinComments,
  maxResults,
  setMaxResults,
  isRunning,
  onSubmit,
}: SearchFormProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords (comma-separated)
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="cooking tips, fitness hacks, money advice"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isRunning}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Views
          </label>
          <input
            type="number"
            value={minViews}
            onChange={(e) => setMinViews(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Likes
          </label>
          <input
            type="number"
            value={minLikes}
            onChange={(e) => setMinLikes(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Comments
          </label>
          <input
            type="number"
            value={minComments}
            onChange={(e) => setMinComments(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Results/Keyword
          </label>
          <input
            type="number"
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            min={1}
            max={50}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRunning}
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isRunning || !keywords.trim()}
        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isRunning ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Running...
          </span>
        ) : (
          "Run Search"
        )}
      </button>
    </div>
  );
}
