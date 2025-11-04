-- Add onboarding fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS job_search_status TEXT DEFAULT 'pending' CHECK (job_search_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS first_search_at TIMESTAMP WITH TIME ZONE;

-- Add preferences JSON column for storing detailed preferences
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add qualifications JSON column for storing parsed CV data
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS qualifications JSONB DEFAULT '{}'::jsonb;

-- Create an index for faster onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON public.users(onboarding_completed, onboarding_step);

-- Create a function to update onboarding progress
CREATE OR REPLACE FUNCTION public.update_onboarding_progress(
    user_id UUID,
    step INTEGER,
    completed BOOLEAN DEFAULT FALSE
)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET
        onboarding_step = step,
        onboarding_completed = completed,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_onboarding_progress(UUID, INTEGER, BOOLEAN) TO authenticated;