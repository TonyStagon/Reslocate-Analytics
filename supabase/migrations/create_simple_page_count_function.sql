-- Create SIMPLE and accurate function to count page_name repeated values
-- This directly counts each page_name occurrence as one click

CREATE OR REPLACE FUNCTION public.precisely_count_page_clicks(

p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE(
  page_name TEXT,
  total_click_count BIGINT,
  unique_session_count BIGINT
) LANGUAGE sql STABLE AS $$

  SELECT 
    page_name,
    COUNT(*)::BIGINT as total_click_count,  -- SIMPLE COUNT: Each record = 1 click
    COUNT(DISTINCT session_id)::BIGINT as unique_session_count
  FROM public.button_clicks
  WHERE created_at >= CURRENT_DATE - (INTERVAL '1 day' * p_days_back)
  GROUP BY page_name
  ORDER BY total_click_count DESC;

$$;

-- Very simple function - just count all page_names without time restrictions
CREATE OR REPLACE FUNCTION public.count_all_page_clicks()
RETURNS TABLE(
  page_name TEXT,
  total_clicks BIGINT,
  unique_sessions BIGINT
) LANGUAGE sql STABLE AS $$

  SELECT 
    page_name,
    COUNT(*)::BIGINT as total_clicks,  -- This counts each repeating page_name
    COUNT(DISTINCT session_id)::BIGINT as unique_sessions
  FROM public.button_clicks
  GROUP BY page_name
  ORDER BY total_clicks DESC;

$$;
