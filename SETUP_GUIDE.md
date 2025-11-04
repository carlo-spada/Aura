# AURA Setup Guide

## ✅ Current Status

### Completed
- Database schema deployed (users, jobs, applications tables)
- Authentication system (Supabase Auth replacing Clerk)
- Pricing page with Stripe checkout flow
- Basic project structure

### ⚠️ Pending - Stripe Wrapper Issue
The Stripe Foreign Data Wrapper needs to be enabled in your Supabase dashboard:
1. Go to: https://supabase.com/dashboard/project/ugxdczjjgavxownullaa/database/extensions
2. Find **"wrappers"** extension
3. Click **"Enable"**
4. After enabling, run the wrapper setup SQL in `/supabase/migrations/002b_stripe_wrapper_setup.sql`

## 🔑 Environment Variables Needed

Update your `/web/.env.local` file:

```env
# Supabase (from Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://ugxdczjjgavxownullaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (after creating products)
STRIPE_PRICE_ID_PLUS_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PLUS_YEARLY=price_xxxxx
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_xxxxx

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📦 Required Stripe Products

Create in your Stripe Dashboard:
1. **AURA Plus**: $5/month or $48/year
2. **AURA Premium**: $10/month or $96/year

## 🚀 Quick Start

```bash
# Install dependencies
cd web
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000

## 📁 Project Structure

```
/web              - Next.js frontend
/services/api     - Python FastAPI backend
/supabase         - Database migrations and config
```

## 🔄 Next Development Steps

1. Enable wrappers extension in Supabase
2. Create Stripe products and add Price IDs to .env.local
3. Build dashboard with job cards
4. Implement job search API
5. Add usage tracking

## 🐛 Troubleshooting

### Stripe Wrapper Issues
If you can't enable the wrappers extension, we can use a webhook-based approach instead of the Foreign Data Wrapper.

### Authentication Issues
Make sure you have the correct Supabase keys in your .env.local file.

### Database Issues
All migrations are in `/supabase/migrations/` - run them in order if starting fresh.