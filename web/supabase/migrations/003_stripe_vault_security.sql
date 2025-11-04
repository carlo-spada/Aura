-- AURA Stripe Vault Security Setup (RECOMMENDED FOR PRODUCTION)
-- This secures your Stripe API key using Supabase Vault
-- Run this AFTER the Stripe wrapper setup if you want to use Vault

-- ====================================================================
-- Enable Vault Extension (if not already enabled)
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS vault WITH SCHEMA vault;

-- ====================================================================
-- Store Stripe API Key Securely in Vault
-- ====================================================================
-- Replace 'your_stripe_secret_key' with your actual Stripe secret key
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'stripe_api_key',
  'YOUR_STRIPE_SECRET_KEY_HERE', -- Replace with your actual Stripe secret key
  'Stripe API key for AURA application'
)
ON CONFLICT (name)
DO UPDATE SET
  secret = EXCLUDED.secret,
  updated_at = NOW();

-- ====================================================================
-- Update Foreign Server to Use Vault
-- ====================================================================
-- Drop the existing server
DROP SERVER IF EXISTS stripe_server CASCADE;

-- Recreate with Vault reference
CREATE SERVER stripe_server
  FOREIGN DATA WRAPPER stripe_wrapper
  OPTIONS (
    api_key_id 'stripe_api_key', -- References the Vault secret name
    api_url 'https://api.stripe.com/v1',
    api_version '2023-10-16'
  );

-- ====================================================================
-- Re-import Stripe Tables with Secure Server
-- ====================================================================
-- Drop existing foreign tables
DROP SCHEMA IF EXISTS stripe CASCADE;
CREATE SCHEMA stripe;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA stripe TO authenticated;
GRANT USAGE ON FOREIGN SERVER stripe_server TO authenticated;

-- Re-import Stripe tables
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

-- Grant SELECT permissions on Stripe tables
GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO authenticated;

-- ====================================================================
-- Recreate Materialized Views
-- ====================================================================
-- Drop existing views
DROP MATERIALIZED VIEW IF EXISTS public.stripe_active_subscriptions CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.stripe_customers_cache CASCADE;

-- Active subscriptions view
CREATE MATERIALIZED VIEW public.stripe_active_subscriptions AS
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

-- Create indexes
CREATE UNIQUE INDEX idx_stripe_active_subs_id ON public.stripe_active_subscriptions(stripe_subscription_id);
CREATE INDEX idx_stripe_active_subs_customer ON public.stripe_active_subscriptions(stripe_customer_id);

-- Customer data view
CREATE MATERIALIZED VIEW public.stripe_customers_cache AS
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
-- Verify Vault Setup
-- ====================================================================
-- You can verify the secret is stored (but not see its value) with:
-- SELECT name, description, created_at FROM vault.secrets WHERE name = 'stripe_api_key';

-- ====================================================================
-- Additional Security: Create Read-Only Role for Stripe Data
-- ====================================================================
CREATE ROLE stripe_reader;
GRANT USAGE ON SCHEMA stripe TO stripe_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO stripe_reader;

-- ====================================================================
-- Notes:
-- ====================================================================
-- 1. Using Vault keeps your API key encrypted at rest
-- 2. The key is never visible in logs or configuration
-- 3. You can rotate keys easily by updating the Vault secret
-- 4. For production, always use Vault instead of plain text storage