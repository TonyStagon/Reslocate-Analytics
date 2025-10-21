import { supabase } from '../lib/supabase'

const migrationSQL = `
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

CREATE POLICY IF NOT EXISTS "Anyone can read download statistics"
  ON download_stats
  FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert download statistics"
  ON download_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update download statistics"
  ON download_stats
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_download_stats_date ON download_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_download_stats_created_at ON download_stats(created_at DESC);

INSERT INTO download_stats (date, total_downloads, daily_downloads, android_downloads, ios_downloads, rating, reviews_count, source)
VALUES (CURRENT_DATE, 1200, 45, 900, 300, 4.2, 32, 'manual')
ON CONFLICT (date) DO NOTHING;
`;

async function applyMigration() {
  try {
    console.log('Applying download_stats migration...')

    // Note: This requires service role key with elevated permissions
    // For production, migrations should be run through Supabase CLI or dashboard
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      console.error('Migration error:', error)
      throw error
    }

    console.log('Migration applied successfully!', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to apply migration:', error)
    return { success: false, error }
  }
}

// Run migration
applyMigration()
