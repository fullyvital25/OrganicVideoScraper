export interface SearchParams {
  keywords: string[];
  minViews: number;
  minLikes: number;
  minComments: number;
  maxResultsPerKeyword: number;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
}

export interface VideoStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface VideoResult {
  videoId: string;
  title: string;
  url: string;
  channelTitle: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  transcript: string | null;
  analysis: VideoAnalysis | null;
  error?: string;
}

export interface VideoAnalysis {
  hook: string;
  body: string;
  cta: string;
  whyItPerformed: string;
}

export interface ProgressEvent {
  type: "status" | "result" | "error" | "done";
  message?: string;
  data?: VideoResult;
  totalResults?: number;
}

export interface VideoResultRow {
  id?: number;
  keyword: string;
  video_title: string;
  video_url: string;
  views: number;
  likes: number;
  comments: number;
  transcript: string | null;
  hook_analysis: string | null;
  body_analysis: string | null;
  cta_analysis: string | null;
  why_it_performed: string | null;
  platform: string;
  created_at?: string;
}
