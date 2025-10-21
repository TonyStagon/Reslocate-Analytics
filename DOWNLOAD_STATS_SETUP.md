# Download Statistics Setup Guide

## Overview
Your dashboard now fetches **real download data** from your Supabase database instead of mock data. This guide explains how to set everything up and update your download statistics.

## Important Note About Google Play API
**The Google Play Developer API does NOT directly provide download statistics.** While we have your Google service account credentials, the API only provides:
- App metadata
- In-app products
- Reviews/ratings
- Subscription data

Download counts are only accessible through the **Google Play Console web interface**.

## Solution: Database-Backed Download Tracking

We've implemented a Supabase database table to store your download statistics that you manually update from Google Play Console.

---

## Setup Steps

### Step 1: Create the Database Table

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/xowstorcasdewwjvcgtn)
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/create_download_stats_table.sql`
5. Click **Run** to execute the migration

This creates a `download_stats` table with:
- `date` - The date of the statistics
- `total_downloads` - Cumulative total downloads
- `daily_downloads` - Downloads on that specific day
- `android_downloads` - Android platform downloads
- `ios_downloads` - iOS platform downloads
- `rating` - App rating
- `reviews_count` - Number of reviews
- `source` - Data source (manual, api, etc.)

### Step 2: Insert Initial Data

**Option A: Use the Setup HTML Tool**
1. Open `setup-downloads-table.html` in your browser
2. Click "Create Table & Insert Initial Data"
3. Check the output for success/error messages

**Option B: Use Supabase Dashboard**
1. Go to **Table Editor** > `download_stats`
2. Click **Insert row**
3. Fill in the data from your Google Play Console

---

## How to Update Download Statistics

### From Google Play Console:

1. **Get Your Current Downloads:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Navigate to your app (com.reslocate.new)
   - Go to **Statistics** or **Acquisition reports**
   - Note down:
     - Total installs (cumulative)
     - Installs today
     - Rating
     - Number of reviews

2. **Update the Database:**

**Method 1: Using the HTML Tool**
- Open `setup-downloads-table.html` in your browser
- Fill in the manual update form with your Play Console data
- Click "Submit Stats"
- Your dashboard will immediately reflect the new data

**Method 2: Using Supabase Dashboard**
- Go to your [Supabase Table Editor](https://supabase.com/dashboard/project/xowstorcasdewwjvcgtn/editor/download_stats)
- Click **Insert row** or **Update** existing row for today
- Fill in the fields with data from Play Console
- Click **Save**

**Method 3: Using the API (Advanced)**
```javascript
import { updateDownloadStats } from './src/utils/downloadStats'

await updateDownloadStats({
  total_downloads: 1500,
  downloads_24h: 52,
  android_downloads: 1125,
  ios_downloads: 375,
  rating: 4.3,
  reviews_count: 38
})
```

---

## How It Works

1. **Overview Page** (`src/pages/Overview.tsx`) calls `fetchDownloadStats()`
2. **fetchDownloadStats()** queries the `download_stats` table
3. It calculates:
   - Downloads in last 24h (daily_downloads from latest entry)
   - Downloads in last 7 days (sum of daily_downloads for last 7 days)
   - Downloads in last 30 days (sum of daily_downloads for last 30 days)
4. If no data exists, it falls back to estimated values based on "1,000+" from Play Store

---

## Automation Options (Future)

While the Google Play API doesn't provide download counts directly, you could:

1. **Google Play Console Reports API**:
   - Requires additional setup
   - Can provide statistical reports
   - Limited access compared to web console

2. **Web Scraping** (Not Recommended):
   - Against Google's Terms of Service
   - Unreliable and fragile

3. **Third-Party Analytics**:
   - Use Firebase Analytics
   - Integrate with mobile analytics SDKs

---

## Quick Reference

### View Current Stats
```sql
SELECT * FROM download_stats
ORDER BY date DESC
LIMIT 7;
```

### Update Today's Stats
```sql
INSERT INTO download_stats (date, total_downloads, daily_downloads, android_downloads, ios_downloads, rating, reviews_count)
VALUES (CURRENT_DATE, 1500, 52, 1125, 375, 4.3, 38)
ON CONFLICT (date)
DO UPDATE SET
  total_downloads = EXCLUDED.total_downloads,
  daily_downloads = EXCLUDED.daily_downloads,
  android_downloads = EXCLUDED.android_downloads,
  ios_downloads = EXCLUDED.ios_downloads,
  rating = EXCLUDED.rating,
  reviews_count = EXCLUDED.reviews_count,
  updated_at = now();
```

---

## Files Changed

1. ✅ `src/utils/downloadStats.ts` - New utility for fetching download stats
2. ✅ `src/pages/Overview.tsx` - Updated to use real data from database
3. ✅ `supabase/migrations/create_download_stats_table.sql` - Database migration
4. ✅ `setup-downloads-table.html` - Admin tool for managing stats
5. ✅ `src/utils/playStoreStats.ts` - Deprecated (no longer used)

---

## Support

If you encounter any issues:
1. Check Supabase logs in the Dashboard
2. Check browser console for errors
3. Verify the table was created successfully
4. Ensure you have the latest download numbers from Play Console

Your dashboard now displays **real data** based on what you input from Google Play Console!
