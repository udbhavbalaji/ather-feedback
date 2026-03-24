# Ather Reddit Feedback Monitor

Monitor customer feedback for Ather electric scooters from Reddit with sentiment analysis and topic clustering.

## Features

- **Automated Reddit Scraping** - Collects posts from r/ATHERENERGY and r/india via Pushshift API
- **Owner Verification** - Filters posts to identify actual vehicle owners (km ridden, ownership keywords)
- **Sentiment Analysis** - VADER-based sentiment scoring (positive/negative/neutral)
- **Topic Clustering** - Keyword-based categorization into 8 topic areas
- **Real-time Dashboard** - Next.js dashboard with charts and filtering

## Tech Stack

- **Database**: Local SQLite (athr.db) / Turso (production)
- **Backend**: Python scraper + analyzer
- **Frontend**: Next.js 14 + Tailwind CSS + Recharts
- **Scheduler**: GitHub Actions (scraper)

## Quick Start

### 1. Run the Backend Scraper

```bash
cd ather-feedback/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
python -m nltk.downloader vader_lexicon

# Run the scraper
python main.py
```

### 2. Run the Frontend

```bash
cd ather-feedback/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000

---

## Deployment Steps for Automation

### Step 1: Push to GitHub

```bash
cd ather-feedback
git init
git add .
git commit -m "Initial commit: Ather feedback monitor"
git remote add origin https://github.com/YOUR_USERNAME/ather-feedback.git
git push -u origin main
```

### Step 2: Create Turso Database (if not already done)

1. Go to https://console.turso.tech
2. Create a new database
3. Note the database URL and create an auth token

### Step 3: Add GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

| Secret Name | Value |
|------------|-------|
| `TURSO_URL` | Your Turso database URL (e.g., `libsql://xxx.turso.io`) |
| `TURSO_AUTH_TOKEN` | Your Turso auth token |

### Step 4: Update Backend for Turso (Optional)

The current setup uses local SQLite (`ather.db`). For production with Turso:

1. Update `backend/db.py` to use Turso connection
2. Or use `turso db push` command to sync local data to Turso

### Step 5: Deploy Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel
```

Add these environment variables in Vercel:
- `TURSO_URL` - Your Turso database URL
- `TURSO_AUTH_TOKEN` - Your Turso auth token

### Step 6: Verify GitHub Actions

1. Go to your GitHub repo → **Actions** tab
2. You should see the "Scrape Ather Feedback" workflow
3. It runs every 4 hours automatically
4. Click "Run workflow" to test manually

---

## Local Development Notes

### Database Location
- Local database: `backend/ather.db`
- Frontend expects: `../backend/ather.db` (relative to frontend folder)

### Running the Scraper
```bash
cd backend
source venv/bin/activate
python main.py
```

### Syncing to Turso (for production)
```bash
# After logging into Turso CLI
turso auth login
turso db push ather-feedback-udbhavbalaji backend/ather.db
```

---

## Dashboard Features

The dashboard provides:
- **Overview Cards**: Total posts, owner verification rate, sentiment score, weekly activity
- **Sentiment Trend**: 14-day rolling average chart
- **Sentiment Breakdown**: Pie/bar chart of positive/neutral/negative posts
- **Top Complaints**: Owner-verified negative posts for quick review
- **Top Praises**: Owner-verified positive posts
- **Topic Distribution**: Bar chart of topics being discussed
- **Quick Stats**: Data source, analysis method, refresh rate

---

## Topic Clusters

| Cluster | Keywords |
|---------|----------|
| 🔋 Battery & Range | battery, range, charging, km, drain |
| 🔧 Service & Support | service, repair, warranty, issue, problem |
| ⚡ Performance | speed, acceleration, warp, power |
| 🔩 Build Quality | quality, rattle, noise, vibration |
| 📱 App & Tech | app, software, update, bluetooth |
| 💰 Buying Experience | price, delivery, showroom, deal |
| 🛋️ Comfort | seat, suspension, ride, pillion |
| ❤️ Positive Experience | love, amazing, great, recommend |

---

## Owner Verification

Posts are marked as "owner-verified" if they contain:
- Ownership keywords: "km", "ridden", "my ather", "owned", "bought", etc.
- Distance patterns: "5000 km", "10k km", etc.

And exclude non-owner indicators:
- "looking to buy", "considering", "test ride", etc.

---

## Cost

This project is **100% free** to run:
- GitHub Actions: 2,000 min/month (4-hour scrape = ~180 min/month)
- Turso: Free tier (500 DBs, 9GB storage)
- Vercel: Free tier
- Sentiment Analysis: VADER (NLTK library, no API needed)
