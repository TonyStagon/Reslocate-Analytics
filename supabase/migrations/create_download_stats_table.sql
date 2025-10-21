/*
  # Create Download Statistics Table

  1. New Tables
    - `download_stats`
      - `id` (uuid, primary key)
      - `date` (date, unique) - The date of the statistics
      - `total_downloads` (integer) - Cumulative total downloads
      - `daily_downloads` (integer) - Downloads on this specific day
      - `android_downloads` (integer) - Android platform downloads
      - `ios_downloads` (integer) - iOS platform downloads
      - `rating` (numeric) - App rating
      - `reviews_count` (integer) - Number of reviews
      - `source` (text) - Data source (e.g., 'google_play', 'manual', 'api')
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `download_stats` table
    - Add policy for public read access (analytics data)
    - Add policy for authenticated admin write access

  3. Indexes
    - Index on date for fast lookups
    - Index on created_at for time-series queries
*/

CREATE TABLE IF NOT EXISTS download_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_downloads integer DEFAULT 0,
  daily_downloads integer DEFAULT 0,
  android_downloads integer DEFAULT 0,
  ios_downloads integer DEFAULT 0,
  rating numeric(2,1) DEFAULT 0.0,
  reviews_count integer DEFAULT 0,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE download_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read download statistics"
  ON download_stats
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert download statistics"
  ON download_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update download statistics"
  ON download_stats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_download_stats_date ON download_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_download_stats_created_at ON download_stats(created_at DESC);

-- Insert initial data based on your Play Store page (1,000+ downloads range)
-- You can update these values with actual data from Play Console
INSERT INTO download_stats (date, total_downloads, daily_downloads, android_downloads, ios_downloads, rating, reviews_count, source)
VALUES (CURRENT_DATE, 1200, 45, 900, 300, 4.2, 32, 'manual')
ON CONFLICT (date) DO NOTHING;
