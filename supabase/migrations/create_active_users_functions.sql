-- Create functions for tracking active sessions and distinct users across different time periods

-- Function for getting active analytics in the last 24 hours
CREATE OR REPLACE FUNCTION get_active_users_last_24h_analytics()
RETURNS TABLE(session_count_24h integer, distinct_users_24h integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer AS session_count_24h,
        COUNT(DISTINCT user_id)::integer AS distinct_users_24h
    FROM sessions
    WHERE start_time >= NOW() - INTERVAL '24 hours';
END;
$$;

-- Function for getting active analytics in the last 7 days
CREATE OR REPLACE FUNCTION get_active_users_last_7d_analytics()
RETURNS TABLE(session_count_7d integer, distinct_users_7d integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer AS session_count_7d,
        COUNT(DISTINCT user_id)::integer AS distinct_users_7d
    FROM sessions
    WHERE start_time >= NOW() - INTERVAL '7 days';
END;
$$;

-- Function for getting active analytics in the last 30 days
CREATE OR REPLACE FUNCTION get_active_users_last_30d_analytics()
RETURNS TABLE(session_count_30d integer, distinct_users_30d integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer AS session_count_30d,
        COUNT(DISTINCT user_id)::integer AS distinct_users_30d
    FROM sessions
    WHERE start_time >= NOW() - INTERVAL '30 days';
END;
$$;