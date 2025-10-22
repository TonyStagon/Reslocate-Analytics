-- Create functions for tracking active sessions and distinct users across day boundaries
-- Uses fixed calendar dates instead of rolling 24-hour periods

-- Function for getting active analytics for the previous day (Yesterday 12AM to previous 12AM)
CREATE OR REPLACE FUNCTION get_active_users_previous_day_analytics()
RETURNS TABLE(session_count_yesterday integer, distinct_users_yesterday integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer AS session_count_yesterday,
        COUNT(DISTINCT user_id)::integer AS distinct_users_yesterday
    FROM sessions
    WHERE start_time >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '1 day')
      AND start_time < DATE_TRUNC('day', CURRENT_DATE);
END;
$$;

-- Function for getting active analytics for the previous 7 days (including current week)
CREATE OR REPLACE FUNCTION get_active_users_previous_7days_analytics()
RETURNS TABLE(session_count_7days integer, distinct_users_7days integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer AS session_count_7days,
        COUNT(DISTINCT user_id)::integer AS distinct_users_7days
    FROM sessions
    WHERE start_time >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '7 days')
      AND start_time < DATE_TRUNC('day', CURRENT_DATE);
END;
$$;

-- Function for getting active analytics for the previous 30 days (consecutive days)
CREATE OR REPLACE FUNCTION get_active_users_previous_30days_analytics()
RETURNS TABLE(session_count_30days integer, distinct_users_30days integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer AS session_count_30days,
        COUNT(DISTINCT user_id)::integer AS distinct_users_30days
    FROM sessions
    WHERE start_time >= DATE_TRUNC('day', CURRENT_DATE - INTERVAL '30 days')
      AND start_time < DATE_TRUNC('day', CURRENT_DATE);
END;
$$;