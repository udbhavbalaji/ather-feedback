#!/usr/bin/env python3
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

load_dotenv(project_root / "backend" / ".env")

import db
import scraper
import sentiment


def main():
    print("=" * 50)
    print("Ather Reddit Feedback Monitor")
    print("=" * 50)

    print("\n[1/4] Initializing database...")
    db.init_db()

    print("\n[2/4] Downloading NLP resources...")
    sentiment.download_vader()

    print("\n[3/4] Scraping Reddit...")
    results = scraper.scrape_all()

    print("\n[3.5/4] Syncing to remote database...")
    db.sync()

    print("\n[4/4] Fetching stats...")
    stats = db.get_stats()

    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print(f"Total posts in database: {stats['total_posts']}")
    print(f"Owner-verified posts: {stats['owner_posts']}")
    print(f"Average sentiment: {stats['avg_sentiment']:.3f}")
    print(f"Positive: {stats['positive_count']}")
    print(f"Negative: {stats['negative_count']}")
    print(f"Neutral: {stats['neutral_count']}")
    print(f"Posts this week: {stats['weekly_posts']}")

    print("\nScraping summary:")
    for source, count in results.items():
        print(f"  {source}: +{count}")

    print("\nDone!")


if __name__ == "__main__":
    main()
