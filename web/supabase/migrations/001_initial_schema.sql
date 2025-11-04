-- AURA Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA extensions;

-- Create custom types
CREATE TYPE public.subscription_tier AS ENUM ('free', 'plus', 'premium');
CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'canceled', 'past_due', 'paused');
CREATE TYPE public.work_type AS ENUM ('remote', 'hybrid', 'onsite', 'flexible');
CREATE TYPE public.company_size AS ENUM ('startup', 'mid', 'enterprise', 'any');
CREATE TYPE public.experience_level AS ENUM ('entry', 'mid', 'senior', 'executive');
CREATE TYPE public.application_status AS ENUM ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    subscription_tier public.subscription_tier DEFAULT 'free',
    subscription_status public.subscription_status DEFAULT 'active',
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    monthly_job_matches_used INTEGER DEFAULT 0,
    monthly_job_matches_limit INTEGER DEFAULT 2,
    monthly_reset_date TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
    subscription_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE public.preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    desired_roles TEXT[],
    industries TEXT[],
    locations JSONB DEFAULT '[]'::jsonb,
    salary_range JSONB DEFAULT '{"min": 0, "max": 0, "currency": "USD"}'::jsonb,
    work_type public.work_type DEFAULT 'flexible',
    company_size_preference public.company_size DEFAULT 'any',
    willing_to_relocate BOOLEAN DEFAULT false,
    visa_sponsorship_needed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User qualifications
CREATE TABLE public.qualifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    experience_level public.experience_level DEFAULT 'entry',
    years_of_experience INTEGER DEFAULT 0,
    structured_cv_data JSONB DEFAULT '{}'::jsonb,
    skills TEXT[],
    languages JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    certifications TEXT[],
    portfolio_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    ai_highlights TEXT[],
    ai_summary TEXT,
    profile_embedding extensions.vector(1536), -- For semantic matching
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo_url TEXT,
    location TEXT,
    remote_type public.work_type,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    salary_is_estimated BOOLEAN DEFAULT false,
    description TEXT NOT NULL,
    requirements TEXT[],
    nice_to_haves TEXT[],
    benefits TEXT[],
    application_url TEXT,
    application_email TEXT,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    posted_date TIMESTAMPTZ,
    expires_date TIMESTAMPTZ,
    is_featured BOOLEAN DEFAULT false,
    job_embedding extensions.vector(1536), -- For semantic search
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(external_id, source)
);

-- Job views tracking (for analytics)
CREATE TABLE public.job_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    match_score FLOAT,
    status public.application_status DEFAULT 'saved',
    generated_cv_url TEXT,
    generated_cover_letter_url TEXT,
    notes TEXT,
    applied_at TIMESTAMPTZ,
    interview_dates JSONB DEFAULT '[]'::jsonb,
    offer_details JSONB,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- User feedback for improving recommendations
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL, -- 'not_relevant', 'wrong_level', 'bad_location', 'low_salary', etc.
    feedback_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription usage logs
CREATE TABLE public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'job_match_viewed', 'application_generated', 'cv_generated', etc.
    credits_used INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history for AI assistant
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX idx_jobs_posted_date ON public.jobs(posted_date DESC);
CREATE INDEX idx_jobs_source ON public.jobs(source);
CREATE INDEX idx_jobs_title_search ON public.jobs USING GIN(to_tsvector('english', title));
CREATE INDEX idx_jobs_company_search ON public.jobs USING GIN(to_tsvector('english', company));
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_job_views_user_id ON public.job_views(user_id);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at);

-- Vector similarity search indexes (for AI matching)
CREATE INDEX ON public.jobs USING ivfflat (job_embedding extensions.vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON public.qualifications USING ivfflat (profile_embedding extensions.vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Preferences policies
CREATE POLICY "Users can view own preferences" ON public.preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Qualifications policies
CREATE POLICY "Users can view own qualifications" ON public.qualifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own qualifications" ON public.qualifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own qualifications" ON public.qualifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users can view own applications" ON public.applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.applications
    FOR UPDATE USING (auth.uid() = user_id);

-- Job views policies
CREATE POLICY "Users can view own job views" ON public.job_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job views" ON public.job_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs table is public read (no RLS needed for read)
-- But we might want to add RLS for admin-only write access later

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );

    -- Create default preferences
    INSERT INTO public.preferences (user_id)
    VALUES (NEW.id);

    -- Create default qualifications
    INSERT INTO public.qualifications (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON public.preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qualifications_updated_at BEFORE UPDATE ON public.qualifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to reset monthly usage (to be called by cron job)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET
        monthly_job_matches_used = 0,
        monthly_reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE monthly_reset_date <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Set up cron job to reset usage monthly (runs daily at midnight)
SELECT cron.schedule(
    'reset-monthly-usage',
    '0 0 * * *',
    'SELECT public.reset_monthly_usage();'
);

-- Function to check usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user public.users%ROWTYPE;
BEGIN
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;

    IF v_user.subscription_tier = 'premium' THEN
        RETURN TRUE; -- Unlimited for premium
    END IF;

    RETURN v_user.monthly_job_matches_used < v_user.monthly_job_matches_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_action TEXT)
RETURNS void AS $$
BEGIN
    -- Increment the counter
    UPDATE public.users
    SET monthly_job_matches_used = monthly_job_matches_used + 1
    WHERE id = p_user_id;

    -- Log the usage
    INSERT INTO public.usage_logs (user_id, action, credits_used)
    VALUES (p_user_id, p_action, 1);
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (optional - comment out in production)
/*
INSERT INTO public.jobs (title, company, location, description, requirements, salary_min, salary_max, source, posted_date)
VALUES
    ('Senior Full Stack Developer', 'TechCorp', 'San Francisco, CA', 'We are looking for a senior full stack developer...', ARRAY['React', 'Node.js', '5+ years experience'], 150000, 200000, 'manual', NOW()),
    ('Frontend Engineer', 'StartupXYZ', 'Remote', 'Join our growing team as a frontend engineer...', ARRAY['Vue.js', 'TypeScript', '3+ years experience'], 100000, 140000, 'manual', NOW()),
    ('Backend Developer', 'EnterpriseCo', 'New York, NY', 'Backend developer position available...', ARRAY['Python', 'PostgreSQL', 'AWS'], 120000, 160000, 'manual', NOW());
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;