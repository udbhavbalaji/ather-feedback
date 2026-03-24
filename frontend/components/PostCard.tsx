interface Post {
  id: string;
  reddit_id: string;
  subreddit: string;
  title: string;
  body: string | null;
  author: string;
  url: string;
  score: number;
  num_comments: number;
  created_at: number;
  is_owner_verified: boolean;
  sentiment_polarity: number;
  sentiment_label: string;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const seconds = Math.floor(now - timestamp);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(timestamp * 1000).toLocaleDateString();
}

export default function PostCard({ post }: { post: any }) {
  const sentimentClass =
    post.sentiment_label === "positive"
      ? "bg-emerald-100 text-emerald-800"
      : post.sentiment_label === "negative"
      ? "bg-red-100 text-red-800"
      : "bg-slate-100 text-slate-700";
  
  return (
    <div className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1 text-slate-400 min-w-[40px]">
          <span className="text-sm font-medium">{post.score}</span>
          <span className="text-xs">votes</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-900 hover:text-slate-700 line-clamp-2"
            >
              {post.title}
            </a>
            {post.is_owner_verified && (
              <span className="shrink-0 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                Owner
              </span>
            )}
          </div>
          
          {post.body && (
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
              {post.body}
            </p>
          )}
          
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-medium px-2 py-1 rounded ${sentimentClass}`}>
              {post.sentiment_label}
            </span>
            <span className="text-xs text-slate-500">
              {formatTimeAgo(post.created_at)}
            </span>
            <span className="text-xs text-slate-500">
              by {post.author}
            </span>
            <span className="text-xs text-slate-500">
              r/{post.subreddit}
            </span>
            <span className="text-xs text-slate-500">
              {post.num_comments} comments
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
