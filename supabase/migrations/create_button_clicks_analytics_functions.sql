-- Create accurate analytics functions for button_clicks data
-- Fixes inaccurate 979/976 counts by providing proper aggregate queries

-- Function to get total clicks and unique sessions for a single page
CREATE OR REPLACE FUNCTION public.get_page_clicks(
  p_page text,
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_clicks bigint,
  unique_sessions bigint
) LANGUAGE sql STABLE AS $$
  SELECT
    COUNT(*)::bigint AS total_clicks,
    COUNT(DISTINCT session_id)::bigint AS unique_sessions
  FROM public.button_clicks
  WHERE page_name = p_page
    AND (p_start IS NULL OR created_at >= p_start)
    AND (p_end   IS NULL OR created_at <  p_end);
$$;

-- Function to get metrics for multiple pages at once
CREATE OR REPLACE FUNCTION public.get_clicks_by_page(
  p_pages text[],
  p_start timestamptz DEFAULT NULL,
  p_end timestamptz DEFAULT NULL
)
RETURNS TABLE(
  page_name text,
  total_clicks bigint,
  unique_sessions bigint
) LANGUAGE sql STABLE AS $$
  SELECT
    page_name,
    COUNT(*)::bigint AS total_clicks,
    COUNT(DISTINCT session_id)::bigint AS unique_sessions
  FROM public.button_clicks
  WHERE (p_pages IS NULL OR page_name = ANY(p_pages))
    AND (p_start IS NULL OR created_at >= p_start)
    AND (p_end   IS NULL OR created_at <  p_end)
  GROUP BY page_name;
$$;

-- Function to get time-segmented trends
CREATE OR REPLACE FUNCTION public.get_clicks_by_page_segment(
  p_pages text[],
  p_granularity text,            -- 'day' | 'week' | 'month'
  p_start timestamptz,
  p_end timestamptz
)
RETURNS TABLE(
  page_name text,
  bucket timestamptz,
  total_clicks bigint,
  unique_sessions bigint
) LANGUAGE sql STABLE AS $$
  SELECT
    page_name,
    date_trunc(p_granularity, created_at) AS bucket,
    COUNT(*)::bigint AS total_clicks,
    COUNT(DISTINCT session_id)::bigint AS unique_sessions
  FROM public.button_clicks
  WHERE (p_pages IS NULL OR page_name = ANY(p_pages))
    AND created_at >= p_start
    AND created_at <  p_end
  GROUP BY page_name, date_trunc(p_granularity, created_at)
  ORDER BY page_name, bucket;
$$;

-- Performance indexes for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_button_clicks_page ON public.button_clicks(page_name);
CREATE INDEX IF NOT EXISTS idx_button_clicks_page_created_at ON public.button_clicks(page_name, created_at);
CREATE INDEX IF NOT EXISTS idx_button_clicks_page_session ON public.button_clicks(page_name, session_id);