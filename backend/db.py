import os
import sqlite3
import json
from typing import Optional

TURSO_URL = os.getenv("TURSO_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

DB_PATH = os.path.join(os.path.dirname(__file__), "ather.db")

USE_TURSO = bool(TURSO_URL and TURSO_AUTH_TOKEN)


def turso_execute(sql: str, args: list = None):
    import requests

    turso_url = TURSO_URL.replace("libsql://", "https://")
    response = requests.post(
        turso_url,
        headers={
            "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"statements": [sql]},
    )
    if response.status_code != 200:
        raise Exception(f"Turso error: {response.status_code} - {response.text}")
    result = response.json()
    if isinstance(result, list) and len(result) > 0:
        return result[0]
    return result


def turso_execute_batch(sql: str, args_list: list = None):
    import requests

    statements = [{"sql": sql, "args": args} for args in (args_list or [[]])]
    response = requests.post(
        f"{TURSO_URL}",
        headers={
            "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
            "Content-Type": "application/json",
        },
        json={"statements": statements},
    )
    if response.status_code != 200:
        raise Exception(f"Turso error: {response.status_code} - {response.text}")
    return response.json()


def get_connection():
    if USE_TURSO:
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if USE_TURSO:
        return

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
    sql = """
    INSERT OR IGNORE INTO posts (
      id, reddit_id, subreddit, title, body, author, url,
      score, num_comments, created_at, is_owner_verified,
      sentiment_polarity, sentiment_label
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    args = [
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
        1 if post_data.get("is_owner_verified", False) else 0,
        post_data.get("sentiment_polarity"),
        post_data.get("sentiment_label"),
    ]

    try:
        if USE_TURSO:
            turso_execute(sql, args)
        else:
            conn = get_connection()
            conn.execute(sql, args)
            conn.commit()
            conn.close()
        return True
    except Exception as e:
        print(f"Error inserting post: {e}")
        return False


def insert_tag(post_id: str, tag: str, source: str = "keyword"):
    sql = """
    INSERT OR IGNORE INTO post_tags (post_id, tag, source)
    VALUES (?, ?, ?)
    """

    try:
        if USE_TURSO:
            turso_execute(sql, [post_id, tag, source])
        else:
            conn = get_connection()
            conn.execute(sql, [post_id, tag, source])
            conn.commit()
            conn.close()
    except Exception as e:
        print(f"Error inserting tag: {e}")


def get_posts(
    limit: int = 50,
    offset: int = 0,
    sentiment: Optional[str] = None,
    tag: Optional[str] = None,
    verified_only: bool = False,
    subreddit: Optional[str] = None,
):
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

    if USE_TURSO:
        result = turso_execute(sql, params)
        rows = []
        results_data = result.get("results", {})
        cols = results_data.get("columns", [])
        for row in results_data.get("rows", []):
            rows.append({k: v for k, v in zip(cols, row)})
        return rows
    else:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows


def get_stats():
    if USE_TURSO:
        result = turso_execute(
            """SELECT 
              COUNT(*) as total_posts,
              COUNT(CASE WHEN is_owner_verified = 1 THEN 1 END) as owner_posts,
              AVG(sentiment_polarity) as avg_sentiment,
              COUNT(CASE WHEN sentiment_polarity > 0.05 THEN 1 END) as positive_count,
              COUNT(CASE WHEN sentiment_polarity < -0.05 THEN 1 END) as negative_count,
              COUNT(CASE WHEN sentiment_label = 'neutral' THEN 1 END) as neutral_count
            FROM posts"""
        )
        results_data = result.get("results", {})
        r = results_data.get("rows", [[]])[0]
        cols = results_data.get("columns", [])
        row = {k: v for k, v in zip(cols, r)}

        week_result = turso_execute(
            "SELECT COUNT(*) as weekly_posts FROM posts WHERE created_at > strftime('%s', 'now', '-7 days')"
        )
        week_row = week_result.get("results", {}).get("rows", [[0]])[0][0]

        return {
            "total_posts": row.get("total_posts", 0) or 0,
            "owner_posts": row.get("owner_posts", 0) or 0,
            "avg_sentiment": row.get("avg_sentiment", 0) or 0,
            "positive_count": row.get("positive_count", 0) or 0,
            "negative_count": row.get("negative_count", 0) or 0,
            "neutral_count": row.get("neutral_count", 0) or 0,
            "weekly_posts": week_row or 0,
        }
    else:
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
    sql = """
    SELECT 
      c.id, c.name, c.keywords, c.color, c.icon,
      COUNT(pt.post_id) as post_count
    FROM clusters c
    LEFT JOIN post_tags pt ON c.name = pt.tag
    GROUP BY c.id
    ORDER BY post_count DESC
    """

    if USE_TURSO:
        result = turso_execute(sql)
        results_data = result.get("results", {})
        cols = results_data.get("columns", [])
        rows = []
        for row in results_data.get("rows", []):
            rows.append({k: v for k, v in zip(cols, row)})
        return rows
    else:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows


def get_sentiment_trend(days: int = 30):
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

    if USE_TURSO:
        result = turso_execute(sql, [str(days)])
        results_data = result.get("results", {})
        cols = results_data.get("columns", [])
        rows = []
        for row in results_data.get("rows", []):
            rows.append({k: v for k, v in zip(cols, row)})
        return rows
    else:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows


def get_sentiment_trend(days: int = 30):
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

    if USE_TURSO:
        result = turso_execute(sql, [str(days)])
        rows = []
        if result.get("results"):
            for row in result["results"][0].get("rows", []):
                rows.append(
                    {k: v for k, v in zip(result["results"][0]["columns"], row)}
                )
        return rows
    else:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, [str(days)])
        rows = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return rows


def post_exists(reddit_id: str) -> bool:
    sql = "SELECT 1 FROM posts WHERE reddit_id = ? LIMIT 1"

    if USE_TURSO:
        result = turso_execute(sql, [reddit_id])
        rows = result.get("results", {}).get("rows", [])
        return len(rows) > 0
    else:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, [reddit_id])
        exists = cursor.fetchone() is not None
        conn.close()
        return exists


def sync():
    if USE_TURSO:
        print("Data will be written directly to Turso")
    else:
        print("Note: For local development, data is stored in ather.db")
        print(
            "To sync to Turso, run: turso db push ather-feedback-udbhavbalaji ather.db"
        )
