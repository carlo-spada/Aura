# AURA Setup Instructions

## ✅ What We've Completed So Far

1. **Database Schema Created**: Complete SQL schema file ready at `/supabase/migrations/001_initial_schema.sql`
2. **Supabase Auth Implementation**: Replaced Clerk with Supabase auth
3. **Authentication Pages**: Login, Signup, and callback pages created
4. **Middleware Updated**: Protected routes configured
5. **Environment Template**: Updated with all required variables

## 🔧 What You Need to Do Now

### 1. Supabase Database Setup (5 minutes)

Since you've already created your Supabase account:

1. **Go to your Supabase Dashboard**
2. **Click on "SQL Editor"** in the left sidebar
3. **Click "New Query"**
4. **Copy the entire contents** of `/supabase/migrations/001_initial_schema.sql`
5. **Paste it into the SQL Editor**
6. **Click "Run"** to execute the schema

This will create:
- All required tables (users, jobs, applications, etc.)
- Row Level Security policies
- Indexes for performance
- Triggers for automatic user profile creation
- Monthly usage reset function

### 2. Get Your Supabase Keys (2 minutes)

1. In Supabase Dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with: `eyJ...`)
   - **Service Role Key** (starts with: `eyJ...`) - Keep this SECRET!

### 3. Enable Authentication Providers (3 minutes)

1. In Supabase Dashboard, go to **Authentication → Providers**
2. Enable **Email** provider (should be on by default)
3. Enable **Google** provider:
   - You'll need Google OAuth credentials
   - Follow [this guide](https://supabase.com/docs/guides/auth/social-login/auth-google) if you haven't set up Google OAuth before
   - Add redirect URL: `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`

### 4. Create Storage Buckets (2 minutes)

1. In Supabase Dashboard, go to **Storage**
2. Create two buckets:
   - **resumes** (Private)
   - **generated-documents** (Private)

### 5. Stripe Setup (10-15 minutes)

1. **Create/Login to Stripe Account** at [stripe.com](https://stripe.com)
2. **Get your API Keys** from Dashboard → Developers → API Keys
3. **Create Products**:

   Go to Products → Add Product and create:

   **Plus Tier**:
   - Name: "AURA Plus"
   - Description: "6 personalized job matches per month"
   - Pricing:
     - Monthly: $5.00
     - Yearly: $48.00 ($4/month)

   **Premium Tier**:
   - Name: "AURA Premium"
   - Description: "Unlimited job matches with AI coaching"
   - Pricing:
     - Monthly: $10.00
     - Yearly: $96.00 ($8/month)

4. **Note the Price IDs** (they look like: `price_1234567890abcdef`)
5. **Set up Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `http://localhost:3000/api/webhooks/stripe` (for local testing)
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Note the signing secret (starts with: `whsec_`)

### 6. Update Your Environment Variables (5 minutes)

1. **Copy the example file**:
   ```bash
   cd web
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** with your actual values:
   ```env
   # Supabase (from step 2)
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Stripe (from step 5)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Stripe Price IDs (from step 5)
   STRIPE_PRICE_ID_PLUS_MONTHLY=price_xxxxx
   STRIPE_PRICE_ID_PLUS_YEARLY=price_xxxxx
   STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_xxxxx
   STRIPE_PRICE_ID_PREMIUM_YEARLY=price_xxxxx

   # Keep these as is for now
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### 7. Test the Setup (5 minutes)

1. **Start the development server**:
   ```bash
   cd web
   npm run dev
   ```

2. **Visit** http://localhost:3000

3. **Try signing up** with an email address

4. **Check Supabase Dashboard**:
   - Go to Authentication → Users
   - You should see your new user
   - Go to Table Editor → users
   - You should see the user profile created

## 🚨 Common Issues & Solutions

### Issue: SQL Schema fails to run
**Solution**: Make sure pgvector and pg_cron extensions are enabled in your Supabase project. These should be enabled by default on new projects.

### Issue: Google OAuth not working
**Solution**: Make sure you've added the correct redirect URL in Google Cloud Console and that you've added your Google Client ID and Secret in Supabase.

### Issue: "Invalid API key" errors
**Solution**: Double-check that you've copied the keys correctly, especially the difference between anon key and service role key.

### Issue: Stripe webhooks not working locally
**Solution**: Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 📝 Next Steps After Setup

Once you've completed the setup:

1. **Test Authentication Flow**:
   - Sign up with email
   - Login/Logout
   - Try Google OAuth

2. **We'll Continue Building**:
   - Pricing page with Stripe Checkout
   - Dashboard with job cards
   - Usage tracking
   - API endpoints

## ❓ Need Help?

If you encounter any issues:
1. Check the error messages in browser console
2. Check Supabase logs (Dashboard → Logs → API)
3. Let me know the specific error and we'll debug together

---

**Current Status**: Ready for you to complete the manual setup steps above. Once done, confirm and we'll continue with the implementation!