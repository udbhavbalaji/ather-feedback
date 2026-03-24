import { queryPosts, queryClusters } from "@/lib/db";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SearchParams {
  searchParams: {
    sentiment?: string;
    tag?: string;
    verified?: string;
  };
}

export default async function PostsPage({ searchParams }: SearchParams) {
  const { sentiment, tag, verified } = searchParams;
  
  const posts = await queryPosts({
    limit: 100,
    sentiment,
    tag,
    verifiedOnly: verified === "true",
  });
  
  const clusters = await queryClusters();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">A</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">Ather Feedback Monitor</h1>
                <p className="text-xs text-slate-500">Reddit Sentiment Analysis</p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
              <Link href="/posts" className="text-sm font-medium text-slate-900">All Posts</Link>
              <Link href="/clusters" className="text-sm text-slate-600 hover:text-slate-900">Topics</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Posts</h1>
            <p className="mt-1 text-slate-600">
              {posts.length} posts found
              {tag && ` in "${tag}"`}
              {sentiment && ` (${sentiment})`}
              {verified === "true" && " (owner verified)"}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <form className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sentiment</label>
              <select
                name="sentiment"
                defaultValue={sentiment || ""}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm min-w-[120px]"
              >
                <option value="">All</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <select
                name="tag"
                defaultValue={tag || ""}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm min-w-[160px]"
              >
                <option value="">All Topics</option>
                {clusters.map((cluster: any) => (
                  <option key={cluster.id} value={cluster.name}>
                    {cluster.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="verified"
                  value="true"
                  defaultChecked={verified === "true"}
                  className="rounded"
                />
                <span className="text-slate-700">Owner verified only</span>
              </label>
            </div>
            
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium"
              >
                Apply Filters
              </button>
              
              {(sentiment || tag || verified) && (
                <Link
                  href="/posts"
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">No posts found. Try adjusting your filters.</p>
            ) : (
              posts.map((post: any) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
