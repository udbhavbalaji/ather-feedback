import { queryClusters, queryPosts } from "@/lib/db";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SearchParams {
  searchParams: {
    topic?: string;
  };
}

export default async function ClustersPage({ searchParams }: SearchParams) {
  const { topic } = searchParams;
  
  const clusters = await queryClusters();
  const selectedPosts = topic
    ? await queryPosts({ limit: 20, tag: topic })
    : [];
  
  const selectedCluster = clusters.find(
    (c: any) => c.name === topic
  );
  
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
              <Link href="/posts" className="text-sm text-slate-600 hover:text-slate-900">All Posts</Link>
              <Link href="/clusters" className="text-sm font-medium text-slate-900">Topics</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Topic Clusters</h1>
          <p className="mt-1 text-slate-600">Browse feedback grouped by topic</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cluster: any) => (
            <Link
              key={cluster.id}
              href={`/clusters?topic=${encodeURIComponent(cluster.name)}`}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                topic === cluster.name
                  ? "ring-2 ring-slate-900"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{cluster.name}</h3>
                <span 
                  className="text-lg font-bold"
                  style={{ color: cluster.color }}
                >
                  {cluster.post_count}
                </span>
              </div>
              <p className="text-sm text-slate-500">{cluster.post_count} posts</p>
              <div 
                className="h-1 rounded-full mt-4"
                style={{ backgroundColor: cluster.color }}
              />
            </Link>
          ))}
        </div>
        
        {topic && selectedCluster && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedCluster.name}</h2>
              <p className="text-slate-600">{selectedCluster.post_count} posts in this topic</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="space-y-4">
                {selectedPosts.length === 0 ? (
                  <p className="text-slate-500 text-sm py-8 text-center">No posts in this topic yet.</p>
                ) : (
                  selectedPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </div>
            
            <div className="text-center">
              <Link
                href={`/posts?tag=${encodeURIComponent(topic)}`}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                View all posts in {selectedCluster.name}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
