import Link from "next/link";

interface Cluster {
  id: number;
  name: string;
  keywords: string;
  color: string;
  icon: string;
  post_count: number;
}

export default function ClusterList({ clusters }: { clusters: Cluster[] }) {
  if (!clusters || clusters.length === 0) {
    return (
      <p className="text-slate-500 text-sm text-center py-4">No clusters yet</p>
    );
  }

  return (
    <div className="space-y-2">
      {clusters.slice(0, 8).map((cluster) => (
        <Link
          key={cluster.id}
          href={`/posts?tag=${encodeURIComponent(cluster.name)}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-medium text-slate-700">{cluster.name}</span>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700">
            {cluster.post_count}
          </span>
        </Link>
      ))}
    </div>
  );
}
