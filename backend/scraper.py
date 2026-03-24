import requests
import time
from datetime import datetime, timedelta
from analyzer import is_owner_post, get_tags
from db import insert_post, insert_tag, post_exists

PUSHSHIFT_URL = "https://api.pullpush.io/reddit/search/submission"


def scrape_subreddit(
    subreddit: str, limit: int = 100, skip_existing: bool = True
) -> int:
    count = 0

    print(f"Scraping r/{subreddit} via Pushshift...")

    current_time = int(time.time())
    thirty_days_ago = current_time - (30 * 24 * 60 * 60)

    params = {
        "subreddit": subreddit,
        "size": min(limit, 100),
        "sort": "desc",
        "sort_type": "created_utc",
        "after": thirty_days_ago,
    }

    try:
        response = requests.get(
            PUSHSHIFT_URL,
            params=params,
            timeout=30,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; AtherFeedbackMonitor/1.0)"
            },
        )
        response.raise_for_status()
        data = response.json()["data"]

        print(f"  Found {len(data)} posts from last 30 days")

        for post in data:
            reddit_id = str(post.get("id", ""))

            if skip_existing and post_exists(reddit_id):
                continue

            title = post.get("title", "")
            body = post.get("selftext", "") or post.get("body", "") or ""

            post_data = {
                "id": f"{subreddit}_{reddit_id}",
                "reddit_id": reddit_id,
                "subreddit": subreddit,
                "title": title,
                "body": body,
                "author": post.get("author", "[deleted]"),
                "url": f"https://reddit.com/r/{subreddit}/comments/{reddit_id}",
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
                "created_at": post.get("created_utc", 0),
                "is_owner_verified": is_owner_post(title, body),
            }

            sentiment = analyze_sentiment_http(f"{title} {body}")
            post_data["sentiment_polarity"] = sentiment["polarity"]
            post_data["sentiment_label"] = sentiment["label"]

            if insert_post(post_data):
                count += 1

                tags = get_tags(title, body)
                for tag, _ in tags:
                    insert_tag(post_data["id"], tag)

                created = datetime.fromtimestamp(post_data["created_at"])
                print(f"  + [{created.strftime('%Y-%m-%d')}] {title[:50]}...")
            else:
                print(f"  ~ Skipped (already exists)")

    except Exception as e:
        print(f"Error scraping r/{subreddit}: {e}")

    print(f"Added {count} posts from r/{subreddit}")
    return count


def search_reddit(query: str, subreddit: str = "india", limit: int = 50) -> int:
    count = 0

    print(f"Searching r/{subreddit} for '{query}' via Pushshift...")

    current_time = int(time.time())
    thirty_days_ago = current_time - (30 * 24 * 60 * 60)

    params = {
        "subreddit": subreddit,
        "q": query,
        "size": min(limit, 100),
        "sort": "new",
        "after": thirty_days_ago,
    }

    try:
        response = requests.get(
            PUSHSHIFT_URL,
            params=params,
            timeout=30,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; AtherFeedbackMonitor/1.0)"
            },
        )
        response.raise_for_status()
        data = response.json()["data"]

        print(f"  Found {len(data)} posts from last 30 days")

        for post in data:
            title = post.get("title", "").lower()
            body = (post.get("selftext", "") or "").lower()

            if not any(kw in title + body for kw in ["ather", "450x", "rizta", "450s"]):
                continue

            reddit_id = str(post.get("id", ""))

            if post_exists(reddit_id):
                continue

            title_orig = post.get("title", "")
            body_orig = post.get("selftext", "") or ""

            post_data = {
                "id": f"{subreddit}_{reddit_id}",
                "reddit_id": reddit_id,
                "subreddit": subreddit,
                "title": title_orig,
                "body": body_orig,
                "author": post.get("author", "[deleted]"),
                "url": f"https://reddit.com/r/{subreddit}/comments/{reddit_id}",
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
                "created_at": post.get("created_utc", 0),
                "is_owner_verified": is_owner_post(title_orig, body_orig),
            }

            sentiment = analyze_sentiment_http(f"{title_orig} {body_orig}")
            post_data["sentiment_polarity"] = sentiment["polarity"]
            post_data["sentiment_label"] = sentiment["label"]

            if insert_post(post_data):
                count += 1

                tags = get_tags(title_orig, body_orig)
                for tag, _ in tags:
                    insert_tag(post_data["id"], tag)

                created = datetime.fromtimestamp(post_data["created_at"])
                print(f"  + [{created.strftime('%Y-%m-%d')}] {title_orig[:50]}...")

    except Exception as e:
        print(f"Error searching: {e}")

    print(f"Added {count} posts from search")
    return count


def analyze_sentiment_http(text: str) -> dict:
    from sentiment import analyze_sentiment

    return analyze_sentiment(text)


def scrape_all() -> dict:
    results = {}

    results["r/ATHERENERGY"] = scrape_subreddit("ATHERENERGY", limit=100)

    results["r/india_ather"] = search_reddit("Ather", "india", limit=50)

    return results
