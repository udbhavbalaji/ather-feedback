import { createClient } from "@libsql/client";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:../backend/ather.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export { turso };

export async function queryPosts(params: {
  limit?: number;
  sentiment?: string;
  tag?: string;
  verifiedOnly?: boolean;
}) {
  const { limit = 50, sentiment, tag, verifiedOnly } = params;
  
  let sql = "SELECT DISTINCT p.* FROM posts p";
  const queryParams: any[] = [];
  const conditions: string[] = [];
  
  if (tag) {
    sql += " JOIN post_tags pt ON p.id = pt.post_id";
    conditions.push("pt.tag = ?");
    queryParams.push(tag);
  }
  
  if (sentiment === "positive") {
    conditions.push("p.sentiment_polarity > 0.05");
  } else if (sentiment === "negative") {
    conditions.push("p.sentiment_polarity < -0.05");
  } else if (sentiment === "neutral") {
    conditions.push("p.sentiment_polarity >= -0.05 AND p.sentiment_polarity <= 0.05");
  }
  
  if (verifiedOnly) {
    conditions.push("p.is_owner_verified = 1");
  }
  
  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  
  sql += ` ${whereClause} ORDER BY p.created_at DESC LIMIT ?`;
  queryParams.push(limit);
  
  const result = await turso.execute(sql, queryParams);
  return result.rows;
}

export async function queryStats() {
  const statsSql = `
    SELECT 
      COUNT(*) as total_posts,
      COUNT(CASE WHEN is_owner_verified = 1 THEN 1 END) as owner_posts,
      AVG(sentiment_polarity) as avg_sentiment,
      COUNT(CASE WHEN sentiment_polarity > 0.05 THEN 1 END) as positive_count,
      COUNT(CASE WHEN sentiment_polarity < -0.05 THEN 1 END) as negative_count,
      COUNT(CASE WHEN sentiment_label = 'neutral' THEN 1 END) as neutral_count
    FROM posts
  `;
  
  const statsResult = await turso.execute(statsSql);
  const stats = statsResult.rows[0] || {};
  
  const weekResult = await turso.execute(`
    SELECT COUNT(*) as weekly_posts FROM posts
    WHERE created_at > strftime('%s', 'now', '-7 days')
  `);
  const weeklyPosts = weekResult.rows[0]?.weekly_posts || 0;
  
  return {
    total_posts: stats.total_posts || 0,
    owner_posts: stats.owner_posts || 0,
    avg_sentiment: stats.avg_sentiment || 0,
    positive_count: stats.positive_count || 0,
    negative_count: stats.negative_count || 0,
    neutral_count: stats.neutral_count || 0,
    weekly_posts: weeklyPosts,
  };
}

export async function queryClusters() {
  const sql = `
    SELECT 
      c.id, c.name, c.keywords, c.color, c.icon,
      COUNT(pt.post_id) as post_count
    FROM clusters c
    LEFT JOIN post_tags pt ON c.name = pt.tag
    GROUP BY c.id
    ORDER BY post_count DESC
  `;
  
  const result = await turso.execute(sql);
  return result.rows;
}

export async function querySentimentTrend(days: number = 30) {
  const sql = `
    SELECT 
      date(created_at, 'unixepoch') as date,
      AVG(sentiment_polarity) as avg_sentiment,
      COUNT(*) as post_count
    FROM posts
    WHERE created_at > strftime('%s', 'now', '-' || ? || ' days')
    GROUP BY date(created_at, 'unixepoch')
    ORDER BY date ASC
  `;
  
  const result = await turso.execute(sql, [days.toString()]);
  return result.rows;
}

export async function queryPostTags(postId: string) {
  const sql = "SELECT tag FROM post_tags WHERE post_id = ?";
  const result = await turso.execute(sql, [postId]);
  return result.rows.map((row: any) => row.tag);
}
