import Link from "next/link";
import { queryStats, queryClusters, querySentimentTrend, queryPosts } from "@/lib/db";
import SentimentChart from "@/components/SentimentChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, clusters, trend] = await Promise.all([
    queryStats(),
    queryClusters(),
    querySentimentTrend(14),
  ]);
  
  const negativePosts = await queryPosts({ limit: 5, sentiment: "negative" });
  const positivePosts = await queryPosts({ limit: 5, sentiment: "positive" });
  
  const topClusters = clusters.filter((c: any) => c.post_count > 0).slice(0, 4);
  
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
              <Link href="/" className="text-sm font-medium text-slate-900">Dashboard</Link>
              <Link href="/posts" className="text-sm text-slate-600 hover:text-slate-900">All Posts</Link>
              <Link href="/clusters" className="text-sm text-slate-600 hover:text-slate-900">Topics</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Posts"
            value={stats.total_posts.toLocaleString()}
            subtext="scraped from Reddit"
            trend={stats.weekly_posts > 0 ? `+${stats.weekly_posts} this week` : "No new posts this week"}
            trendPositive={stats.weekly_posts > 0}
            color="blue"
          />
          <StatCard
            label="Owner Verified"
            value={`${stats.total_posts > 0 ? Math.round(stats.owner_posts / stats.total_posts * 100) : 0}%`}
            subtext={`${stats.owner_posts} verified posts`}
            trend={stats.owner_posts > 10 ? "Good signal" : "Low sample size"}
            trendPositive={stats.owner_posts > 10}
            color="green"
          />
          <StatCard
            label="Avg Sentiment"
            value={stats.avg_sentiment > 0 ? `+${stats.avg_sentiment.toFixed(3)}` : stats.avg_sentiment.toFixed(3)}
            subtext="VADER score (-1 to 1)"
            trend={stats.avg_sentiment >= 0 ? "Generally Positive" : "Needs Attention"}
            trendPositive={stats.avg_sentiment >= 0}
            color={stats.avg_sentiment >= 0 ? "green" : "red"}
          />
          <StatCard
            label="This Week"
            value={stats.weekly_posts.toString()}
            subtext="new posts"
            trend={stats.weekly_posts > 5 ? "Active community" : "Low activity"}
            trendPositive={stats.weekly_posts > 5}
            color="violet"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Sentiment Trend</h2>
                <p className="text-sm text-slate-500">14-day rolling average</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span className="text-slate-600">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="text-slate-600">Negative</span>
                </div>
              </div>
            </div>
            <SentimentChart data={trend} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Sentiment Breakdown</h2>
            <p className="text-sm text-slate-500 mb-6">Based on VADER analysis</p>
            
            <div className="space-y-4">
              <SentimentBar
                label="Positive"
                count={stats.positive_count}
                total={stats.total_posts}
                color="bg-emerald-500"
                description="praise, satisfaction"
              />
              <SentimentBar
                label="Neutral"
                count={stats.neutral_count}
                total={stats.total_posts}
                color="bg-slate-400"
                description="questions, discussions"
              />
              <SentimentBar
                label="Negative"
                count={stats.negative_count}
                total={stats.total_posts}
                color="bg-red-500"
                description="complaints, issues"
              />
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-1">Key Insight</p>
              <p className="text-sm text-slate-600">
                {stats.negative_count > stats.positive_count * 0.5 
                  ? "High complaint rate - review negative feedback section below"
                  : "Generally positive sentiment - maintain quality"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Top Complaints</h2>
                <p className="text-sm text-slate-500">Owner-verified negative posts</p>
              </div>
              <Link href="/posts?sentiment=negative&verified=true" className="text-sm text-red-600 hover:text-red-700 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {negativePosts.filter((p: any) => p.is_owner_verified).length > 0 ? (
                negativePosts.filter((p: any) => p.is_owner_verified).slice(0, 3).map((post: any) => (
                  <div key={post.id} className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-sm text-slate-800 line-clamp-2">{post.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{post.author}</span>
                      <span>-</span>
                      <span>{new Date(post.created_at * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm py-4 text-center">No owner-verified complaints yet</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Top Praises</h2>
                <p className="text-sm text-slate-500">Owner-verified positive posts</p>
              </div>
              <Link href="/posts?sentiment=positive&verified=true" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {positivePosts.filter((p: any) => p.is_owner_verified).length > 0 ? (
                positivePosts.filter((p: any) => p.is_owner_verified).slice(0, 3).map((post: any) => (
                  <div key={post.id} className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-sm text-slate-800 line-clamp-2">{post.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{post.author}</span>
                      <span>-</span>
                      <span>{new Date(post.created_at * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm py-4 text-center">No owner-verified praises yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Topic Distribution</h2>
                <p className="text-sm text-slate-500">What customers are talking about</p>
              </div>
              <Link href="/clusters" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                All topics
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {topClusters.map((cluster: any) => (
                <div 
                  key={cluster.id} 
                  className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">{cluster.name}</span>
                    <span className="text-lg font-bold text-slate-900">{cluster.post_count}</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">posts</div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min((cluster.post_count / (clusters[0]?.post_count || 1)) * 100, 100)}%`,
                        backgroundColor: cluster.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Quick Stats</h2>
            <p className="text-sm text-slate-500 mb-6">Summary metrics</p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Source</span>
                <span className="text-sm font-medium text-slate-900">r/ATHERENERGY, r/india</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Analysis</span>
                <span className="text-sm font-medium text-slate-900">VADER Sentiment</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Refresh</span>
                <span className="text-sm font-medium text-slate-900">Every 4 hours</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Owner Filter</span>
                <span className="text-sm font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  trend,
  trendPositive,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  trend: string;
  trendPositive: boolean;
  color: string;
}) {
  const colorClasses: Record<string, { border: string }> = {
    blue: { border: "border-blue-200" },
    green: { border: "border-emerald-200" },
    red: { border: "border-red-200" },
    violet: { border: "border-violet-200" },
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${colorClasses[color]?.border || 'border-slate-200'} p-6`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      <div className="mt-4">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          trendPositive 
            ? 'bg-emerald-100 text-emerald-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

function SentimentBar({
  label,
  count,
  total,
  color,
  description,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  description: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-400 ml-2">({description})</span>
        </div>
        <span className="text-sm font-bold text-slate-900">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
