-- Create precise page_name click counting function for "Click-Through Rate by Page Name"
-- This provides accurate click counts by counting the repeating page_name values
-- Optimized for large datasets with more than 10k records

CREATE OR REPLACE FUNCTION public.get_precise_page_click_counts(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  page_name TEXT,
  total_clicks BIGINT,
  unique_sessions BIGINT,
  avg_clicks_per_session DECIMAL(10,2),
  first_click_date TIMESTAMPTZ,
  last_click_date TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
  SELECT
    page_name,
    COUNT(*)::BIGINT AS total_clicks,                                       -- Count repeated page_name values
    COUNT(DISTINCT session_id)::BIGINT AS unique_sessions,                  -- Unique session count
    ROUND(AVG(click_count_per_session)::DECIMAL, 2) AS avg_clicks_per_session,
    MIN(first_session_click) AS first_click_date,
    MAX(last_session_click) AS last_click_date
  FROM (
    SELECT
      bc.page_name,
      bc.session_id,
      COUNT(*) OVER (PARTITION BY bc.page_name, bc.session_id) AS click_count_per_session,
      MIN(bc.created_at) OVER (PARTITION BY bc.page_name, bc.session_id) AS first_session_click,
      MAX(bc.created_at) OVER (PARTITION BY bc.page_name, bc.session_id) AS last_session_click
    FROM public.button_clicks bc
    WHERE (p_start_date IS NULL OR bc.created_at >= p_start_date)
      AND (p_end_date IS NULL OR bc.created_at <= p_end_date)
  ) subquery
  GROUP BY page_name
  ORDER BY total_clicks DESC;               -- Sort by highest click count first
$$;

-- High-precision function for real-time CTR by counting repeating page_name records
CREATE OR REPLACE FUNCTION public.get_page_click_rate(
  p_time_interval TEXT DEFAULT '7d'  -- 'today', '1d', '7d', '30d', 'all'
)
RETURNS TABLE(
  page_name TEXT,
  total_clicks BIGINT,
  unique_sessions BIGINT,
  clicks_per_session DECIMAL(10,2),
  session_percentage DECIMAL(5,2)
) LANGUAGE sql STABLE AS $$
  WITH clicks_filtered AS (
    SELECT
      bc.page_name,
      bc.session_id,
      bc.created_at
    FROM public.button_clicks bc
    WHERE
      CASE p_time_interval
        WHEN 'today' THEN 
          bc.created_at >= CURRENT_DATE
        WHEN '1d' THEN 
          bc.created_at >= CURRENT_DATE - INTERVAL '1 day'
        WHEN '7d' THEN 
          bc.created_at >= CURRENT_DATE - INTERVAL '7 days'
        WHEN '30d' THEN 
          bc.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ELSE 
          true  -- 'all'
      END
  ),
  unique_sessions_total AS (
    SELECT COUNT(DISTINCT session_id)::DECIMAL AS total_sessions
    FROM clicks_filtered
  )

  SELECT
    page_name,
    COUNT(*)::BIGINT as total_clicks,                 -- Primary click count from repeated page_name
    COUNT(DISTINCT session_id)::BIGINT as unique_sessions,
    ROUND(
      CASE 
        WHEN COUNT(DISTINCT session_id) > 0 
        THEN COUNT(*)::DECIMAL / GREATEST(COUNT(DISTINCT session_id), 1)
        ELSE 0 
      END, 2
    ) as clicks_per_session,
    ROUND(
      CASE 
        WHEN (SELECT total_sessions FROM unique_sessions_total) > 0 
        THEN (COUNT(DISTINCT session_id) / (SELECT total_sessions FROM unique_sessions_total)) * 100
        ELSE 0 
      END, 2
    ) as session_percentage
  FROM clicks_filtered
  GROUP BY page_name
  ORDER BY total_clicks DESC;
$$;