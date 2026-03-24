-- Ather Feedback Monitor Database Schema

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  reddit_id TEXT UNIQUE NOT NULL,
  subreddit TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  author TEXT,
  url TEXT,
  score INTEGER DEFAULT 0,
  num_comments INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  is_owner_verified BOOLEAN DEFAULT FALSE,
  sentiment_polarity REAL,
  sentiment_label TEXT,
  scraped_at TEXT DEFAULT (datetime('now'))
);

-- Keyword-based topic tags
CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  source TEXT DEFAULT 'keyword',
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Topic clusters (predefined)
CREATE TABLE IF NOT EXISTS clusters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  keywords TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  icon TEXT DEFAULT '',
  is_auto_generated BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON posts(sentiment_polarity);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_verified ON posts(is_owner_verified);
CREATE INDEX IF NOT EXISTS idx_posts_subreddit ON posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON post_tags(tag);

-- Insert predefined clusters
INSERT OR IGNORE INTO clusters (name, keywords, color, icon) VALUES
  ('Battery & Range', '["battery", "range", "charging", "km", "charge", "drain", "mileage", "range anxiety"]', '#f59e0b', ''),
  ('Service & Support', '["service", "repair", "warranty", "support", "maintenance", "issue", "problem", "broken"]', '#ef4444', ''),
  ('Performance', '["speed", "acceleration", "warp", "power", "torque", "fast", "performance"]', '#8b5cf6', ''),
  ('Build Quality', '["quality", "rattle", "noise", "vibration", "plastic", "build", "durability"]', '#6b7280', ''),
  ('App & Tech', '["app", "software", "update", "bluetooth", "display", "connected", "connectivity"]', '#3b82f6', ''),
  ('Buying Experience', '["buying", "purchase", "price", "delivery", "showroom", "deal", "ex-showroom"]', '#ec4899', ''),
  ('Comfort', '["seat", "suspension", "ride", "comfortable", "bumpy", "pillion", "cushion"]', '#14b8a6', ''),
  ('Positive Experience', '["love", "amazing", "best", "great", "excellent", "happy", "fantastic", "perfect"]', '#22c55e', '');
