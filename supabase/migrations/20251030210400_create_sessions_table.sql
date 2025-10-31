-- Create sessions table that was missing but is referenced throughout the application
CREATE TABLE IF NOT EXISTS public.sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disconnected', 'crashed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON public.sessions(end_time);

-- Add foreign key constraint to profiles table if it exists (optional)
-- ALTER TABLE public.sessions ADD CONSTRAINT fk_sessions_user_id 
-- FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sessions_updated_at();

-- Add RLS policies if needed
-- ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.sessions IS 'Educational institution exploration sessions tracking';
COMMENT ON COLUMN public.sessions.session_id IS 'Unique identifier for each session';
COMMENT ON COLUMN public.sessions.user_id IS 'User identifier associated with the session';
COMMENT ON COLUMN public.sessions.start_time IS 'When the session started';
COMMENT ON COLUMN public.sessions.end_time IS 'When the session ended (NULL means active session)';
COMMENT ON COLUMN public.sessions.status IS 'Session status: active, completed, disconnected, crashed';