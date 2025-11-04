-- AURA Stripe Wrapper Setup
-- Run this AFTER the initial schema and enabling wrappers extension

-- ====================================================================
-- STEP 1: Create the Stripe Foreign Data Wrapper
-- ====================================================================
CREATE FOREIGN DATA WRAPPER stripe_wrapper
  HANDLER stripe_fdw_handler
  VALIDATOR stripe_fdw_validator;

-- ====================================================================
-- STEP 3: Create Foreign Server
-- ====================================================================
-- IMPORTANT: Replace 'your_stripe_secret_key' with your actual Stripe secret key
-- For production, use Vault to store this securely:
-- INSERT INTO vault.secrets (name, secret) VALUES ('stripe_api_key', 'sk_live_...');
-- Then reference it in the server options

CREATE SERVER stripe_server
  FOREIGN DATA WRAPPER stripe_wrapper
  OPTIONS (
    api_key 'YOUR_STRIPE_SECRET_KEY_HERE', -- Replace with your actual Stripe secret key
    api_url 'https://api.stripe.com/v1',
    api_version '2023-10-16'  -- Use latest Stripe API version
  );

-- ====================================================================
-- STEP 4: Create Schema for Stripe Tables
-- ====================================================================
CREATE SCHEMA IF NOT EXISTS stripe;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA stripe TO authenticated;
GRANT USAGE ON FOREIGN DATA WRAPPER stripe_wrapper TO authenticated;
GRANT USAGE ON FOREIGN SERVER stripe_server TO authenticated;

-- ====================================================================
-- STEP 5: Import Stripe Tables
-- ====================================================================
-- This creates foreign tables for all Stripe objects
IMPORT FOREIGN SCHEMA stripe
  LIMIT TO (
    customers,
    products,
    prices,
    subscriptions,
    subscription_items,
    invoices,
    invoice_items,
    charges,
    payment_intents,
    checkout_sessions,
    balance_transactions,
    events
  )
  FROM SERVER stripe_server INTO stripe;

-- Grant SELECT permissions on Stripe tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO authenticated;

-- ====================================================================
-- STEP 6: Create Materialized Views for Performance
-- ====================================================================
-- These cache frequently accessed Stripe data locally

-- Active subscriptions view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.stripe_active_subscriptions AS
SELECT
  s.id as stripe_subscription_id,
  s.customer as stripe_customer_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.canceled_at,
  s.ended_at,
  si.price as price_id,
  p.product as product_id,
  pr.nickname as price_nickname,
  pr.unit_amount,
  pr.currency,
  pr.recurring_interval,
  pr.recurring_interval_count
FROM stripe.subscriptions s
JOIN stripe.subscription_items si ON s.id = si.subscription
JOIN stripe.prices pr ON si.price = pr.id
JOIN stripe.products p ON pr.product = p.id
WHERE s.status IN ('active', 'trialing', 'past_due')
WITH DATA;

-- Create index for fast lookups
CREATE UNIQUE INDEX idx_stripe_active_subs_id ON public.stripe_active_subscriptions(stripe_subscription_id);
CREATE INDEX idx_stripe_active_subs_customer ON public.stripe_active_subscriptions(stripe_customer_id);

-- Customer data view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.stripe_customers_cache AS
SELECT
  c.id as stripe_customer_id,
  c.email,
  c.name,
  c.created,
  c.currency,
  c.delinquent,
  c.balance
FROM stripe.customers c
WITH DATA;

CREATE UNIQUE INDEX idx_stripe_customers_cache_id ON public.stripe_customers_cache(stripe_customer_id);
CREATE INDEX idx_stripe_customers_cache_email ON public.stripe_customers_cache(email);

-- ====================================================================
-- STEP 7: Update Users Table to Link with Stripe
-- ====================================================================
-- We already have stripe_customer_id in our users table
-- Let's add a helper function to sync subscription status

CREATE OR REPLACE FUNCTION public.sync_user_subscription_from_stripe(user_id UUID)
RETURNS void AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_subscription RECORD;
BEGIN
  -- Get the user
  SELECT * INTO v_user FROM public.users WHERE id = user_id;

  IF v_user.stripe_customer_id IS NULL THEN
    RETURN;
  END IF;

  -- Get active subscription from Stripe
  SELECT
    s.*,
    CASE
      WHEN pr.nickname ILIKE '%premium%' THEN 'premium'::subscription_tier
      WHEN pr.nickname ILIKE '%plus%' THEN 'plus'::subscription_tier
      ELSE 'free'::subscription_tier
    END as tier_from_price,
    CASE
      WHEN pr.recurring_interval = 'month' THEN
        CASE
          WHEN pr.nickname ILIKE '%premium%' THEN 999  -- unlimited for premium
          WHEN pr.nickname ILIKE '%plus%' THEN 6
          ELSE 2
        END
      ELSE
        CASE
          WHEN pr.nickname ILIKE '%premium%' THEN 999  -- unlimited for premium
          WHEN pr.nickname ILIKE '%plus%' THEN 6
          ELSE 2
        END
    END as monthly_limit
  INTO v_subscription
  FROM stripe.subscriptions s
  JOIN stripe.subscription_items si ON s.id = si.subscription
  JOIN stripe.prices pr ON si.price = pr.id
  WHERE s.customer = v_user.stripe_customer_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created DESC
  LIMIT 1;

  IF FOUND THEN
    -- Update user with subscription info
    UPDATE public.users
    SET
      subscription_tier = v_subscription.tier_from_price,
      subscription_status = v_subscription.status::subscription_status,
      stripe_subscription_id = v_subscription.id,
      monthly_job_matches_limit = v_subscription.monthly_limit,
      subscription_ends_at = to_timestamp(v_subscription.current_period_end),
      updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- No active subscription, set to free
    UPDATE public.users
    SET
      subscription_tier = 'free',
      subscription_status = 'canceled',
      stripe_subscription_id = NULL,
      monthly_job_matches_limit = 2,
      subscription_ends_at = NULL,
      updated_at = NOW()
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 8: Create Function to Create or Get Stripe Customer
-- ====================================================================
CREATE OR REPLACE FUNCTION public.ensure_stripe_customer(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_user public.users%ROWTYPE;
  v_customer_id TEXT;
BEGIN
  -- Get the user
  SELECT * INTO v_user FROM public.users WHERE id = user_id;

  IF v_user.stripe_customer_id IS NOT NULL THEN
    RETURN v_user.stripe_customer_id;
  END IF;

  -- Check if customer exists in Stripe by email
  SELECT id INTO v_customer_id
  FROM stripe.customers
  WHERE email = v_user.email
  LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
    -- Update user with existing Stripe customer ID
    UPDATE public.users
    SET stripe_customer_id = v_customer_id
    WHERE id = user_id;

    RETURN v_customer_id;
  END IF;

  -- If no customer exists, return NULL
  -- The application will need to create one via Stripe API
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 9: Create Views for Application Use
-- ====================================================================

-- User subscription details view
CREATE OR REPLACE VIEW public.user_subscription_details AS
SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  u.subscription_tier,
  u.subscription_status,
  u.monthly_job_matches_used,
  u.monthly_job_matches_limit,
  u.monthly_reset_date,
  u.stripe_customer_id,
  u.stripe_subscription_id,
  s.current_period_end as subscription_renews_at,
  s.cancel_at_period_end as will_cancel,
  s.canceled_at,
  pr.nickname as plan_name,
  pr.unit_amount as plan_amount,
  pr.currency as plan_currency,
  pr.recurring_interval as billing_interval
FROM public.users u
LEFT JOIN stripe.subscriptions s ON u.stripe_subscription_id = s.id
LEFT JOIN stripe.subscription_items si ON s.id = si.subscription
LEFT JOIN stripe.prices pr ON si.price = pr.id
WHERE u.id = auth.uid();

-- Grant access to authenticated users
GRANT SELECT ON public.user_subscription_details TO authenticated;

-- ====================================================================
-- STEP 10: Refresh Functions for Materialized Views
-- ====================================================================
CREATE OR REPLACE FUNCTION public.refresh_stripe_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.stripe_active_subscriptions;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.stripe_customers_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic refresh (every 5 minutes)
SELECT cron.schedule(
  'refresh-stripe-cache',
  '*/5 * * * *',
  'SELECT public.refresh_stripe_cache();'
);

-- ====================================================================
-- STEP 11: Create Billing Portal Function
-- ====================================================================
-- This function helps generate Stripe billing portal links
CREATE OR REPLACE FUNCTION public.get_billing_portal_url(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_customer_id TEXT;
BEGIN
  -- Get the user's Stripe customer ID
  SELECT stripe_customer_id INTO v_customer_id
  FROM public.users
  WHERE id = user_id;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'No Stripe customer found for user';
  END IF;

  -- Return the customer ID so the app can create a portal session
  -- The actual URL generation needs to happen in the application
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_billing_portal_url(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_user_subscription_from_stripe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_stripe_customer(UUID) TO authenticated;

-- ====================================================================
-- NOTES FOR IMPLEMENTATION:
-- ====================================================================
-- 1. Replace 'your_stripe_secret_key' with your actual Stripe secret key
-- 2. For production, use Vault to store the API key securely
-- 3. The materialized views cache Stripe data for performance
-- 4. Refresh the cache periodically with the cron job
-- 5. Use sync_user_subscription_from_stripe() after webhook events
-- 6. Price nicknames should include 'plus' or 'premium' for auto-detection