import os
import sqlite3
from typing import Optional

TURSO_URL = os.getenv("TURSO_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

DB_PATH = os.path.join(os.path.dirname(__file__), "ather.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    import subprocess

    schema_path = os.path.join(os.path.dirname(__file__), "..", "libsql", "schema.sql")
    db_path = os.path.join(os.path.dirname(__file__), "ather.db")

    result = subprocess.run(
        ["sqlite3", db_path],
        input=open(schema_path).read(),
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"Warning: {result.stderr}")

    print("Database initialized")


def insert_post(post_data: dict) -> bool:
    conn = get_connection()

    sql = """
    INSERT OR IGNORE INTO posts (
      id, reddit_id, subreddit, title, body, author, url,
      score, num_comments, created_at, is_owner_verified,
      sentiment_polarity, sentiment_label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    try:
        cursor = conn.cursor()
        cursor.execute(
            sql,
            [
                post_data["id"],
                post_data["reddit_id"],
                post_data["subreddit"],
                post_data["title"],
                post_data.get("body"),
                post_data.get("author"),
                post_data.get("url"),
                post_data.get("score", 0),
                post_data.get("num_comments", 0),
                post_data["created_at"],
                post_data.get("is_owner_verified", False),
                post_data.get("sentiment_polarity"),
                post_data.get("sentiment_label"),
            ],
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error inserting post: {e}")
        conn.close()
        return False


def insert_tag(post_id: str, tag: str, source: str = "keyword"):
    conn = get_connection()

    sql = """
    INSERT OR IGNORE INTO post_tags (post_id, tag, source)
    VALUES (?, ?, ?)
    """

    try:
        cursor = conn.cursor()
        cursor.execute(sql, [post_id, tag, source])
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error inserting tag: {e}")
        conn.close()


def get_posts(
    limit: int = 50,
    offset: int = 0,
    sentiment: Optional[str] = None,
    tag: Optional[str] = None,
    verified_only: bool = False,
    subreddit: Optional[str] = None,
):
    conn = get_connection()

    conditions = ["1=1"]
    params = []

    if sentiment:
        if sentiment == "positive":
            conditions.append("sentiment_polarity > 0.05")
        elif sentiment == "negative":
            conditions.append("sentiment_polarity < -0.05")
        else:
            conditions.append(
                "sentiment_polarity >= -0.05 AND sentiment_polarity <= 0.05"
            )

    if verified_only:
        conditions.append("is_owner_verified = 1")

    if subreddit:
        conditions.append("subreddit = ?")
        params.append(subreddit)

    where_clause = " AND ".join(conditions)

    if tag:
        sql = f"""
        SELECT DISTINCT p.* FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        WHERE {where_clause} AND pt.tag = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
        """
        params.extend([tag, limit, offset])
    else:
        sql = f"""
        SELECT * FROM posts
        WHERE {where_clause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])

    cursor = conn.cursor()
    cursor.execute(sql, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_stats():
    conn = get_connection()
    cursor = conn.cursor()

    stats_sql = """
    SELECT 
      COUNT(*) as total_posts,
      COUNT(CASE WHEN is_owner_verified = 1 THEN 1 END) as owner_posts,
      AVG(sentiment_polarity) as avg_sentiment,
      COUNT(CASE WHEN sentiment_polarity > 0.05 THEN 1 END) as positive_count,
      COUNT(CASE WHEN sentiment_polarity < -0.05 THEN 1 END) as negative_count,
      COUNT(CASE WHEN sentiment_label = 'neutral' THEN 1 END) as neutral_count
    FROM posts
    """

    cursor.execute(stats_sql)
    row = cursor.fetchone()

    week_sql = """
    SELECT COUNT(*) as weekly_posts FROM posts
    WHERE created_at > strftime('%s', 'now', '-7 days')
    """
    cursor.execute(week_sql)
    week_row = cursor.fetchone()

    conn.close()

    return {
        "total_posts": row["total_posts"] if row else 0,
        "owner_posts": row["owner_posts"] if row else 0,
        "avg_sentiment": row["avg_sentiment"] if row else 0,
        "positive_count": row["positive_count"] if row else 0,
        "negative_count": row["negative_count"] if row else 0,
        "neutral_count": row["neutral_count"] if row else 0,
        "weekly_posts": week_row["weekly_posts"] if week_row else 0,
    }


def get_clusters():
    conn = get_connection()
    cursor = conn.cursor()

    sql = """
    SELECT 
      c.id, c.name, c.keywords, c.color, c.icon,
      COUNT(pt.post_id) as post_count
    FROM clusters c
    LEFT JOIN post_tags pt ON c.name = pt.tag
    GROUP BY c.id
    ORDER BY post_count DESC
    """

    cursor.execute(sql)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_sentiment_trend(days: int = 30):
    conn = get_connection()
    cursor = conn.cursor()

    sql = """
    SELECT 
      date(created_at, 'unixepoch') as date,
      AVG(sentiment_polarity) as avg_sentiment,
      COUNT(*) as post_count
    FROM posts
    WHERE created_at > strftime('%s', 'now', '-' || ? || ' days')
    GROUP BY date(created_at, 'unixepoch')
    ORDER BY date ASC
    """

    cursor.execute(sql, [str(days)])
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def post_exists(reddit_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()

    sql = "SELECT 1 FROM posts WHERE reddit_id = ? LIMIT 1"
    cursor.execute(sql, [reddit_id])
    exists = cursor.fetchone() is not None
    conn.close()
    return exists


def sync():
    print("Note: For local development, data is stored in ather.db")
    print("To sync to Turso, run: turso db push ather-feedback-udbhavbalaji ather.db")
