# AURA Launch Roadmap & Action Plan

## Executive Summary
This roadmap outlines the steps to launch AURA with a subscription-based SaaS model using Stripe payments, Supabase for auth/database, Vercel for frontend hosting, and serverless containers for AI services.

## Immediate Next Steps (This Week)

### 1. Infrastructure Setup
**Priority: Critical | Timeline: 2-3 days**

#### Supabase Setup
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Enable authentication providers:
   - Email/Password
   - Google OAuth
   - GitHub OAuth (optional)
3. Create initial database schema:
   ```sql
   -- Run in Supabase SQL Editor
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT auth.uid(),
     email TEXT UNIQUE NOT NULL,
     subscription_tier TEXT DEFAULT 'free',
     subscription_status TEXT DEFAULT 'active',
     stripe_customer_id TEXT,
     monthly_job_matches_used INT DEFAULT 0,
     monthly_reset_date TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE preferences (
     user_id UUID PRIMARY KEY REFERENCES users(id),
     desired_roles TEXT[],
     industries TEXT[],
     locations JSONB,
     salary_range JSONB,
     work_type TEXT,
     company_size_preference TEXT
   );

   CREATE TABLE jobs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     company TEXT NOT NULL,
     location TEXT,
     salary JSONB,
     description TEXT,
     requirements TEXT[],
     ai_analysis JSONB,
     source TEXT,
     posted_date TIMESTAMP,
     expires_date TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE applications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     job_id UUID REFERENCES jobs(id),
     user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5),
     status TEXT,
     generated_cv_url TEXT,
     generated_cover_letter_url TEXT,
     notes TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
   ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies
   CREATE POLICY "Users can read own data" ON users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own data" ON users
     FOR UPDATE USING (auth.uid() = id);
   ```

4. Enable pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

#### Stripe Setup
1. Create Stripe account and get API keys
2. Create products in Stripe Dashboard:
   - **Free Tier**: $0/month
   - **Plus Tier**: $5/month, $48/year
   - **Premium Tier**: $10/month, $96/year
3. Set up Customer Portal for subscription management
4. Configure webhooks for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

#### Update Environment Files
Create `/web/.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS_MONTHLY=price_...
STRIPE_PRICE_ID_PLUS_YEARLY=price_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_...

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Frontend Implementation
**Priority: High | Timeline: 3-4 days**

#### Install Required Packages
```bash
cd web
npm install @supabase/supabase-js @stripe/stripe-js stripe
npm install @radix-ui/react-dialog @radix-ui/react-tabs
npm install lucide-react class-variance-authority
```

#### Create Core Components
1. `components/auth/AuthModal.tsx` - Supabase auth UI
2. `components/pricing/PricingCard.tsx` - Subscription tier cards
3. `components/dashboard/JobCard.tsx` - Job display component
4. `components/dashboard/UsageIndicator.tsx` - Show remaining job matches
5. `app/api/webhooks/stripe/route.ts` - Stripe webhook handler

#### Update Pages
1. Landing page with pricing
2. Dashboard with usage tracking
3. Settings page with subscription management

### 3. Backend Services Setup
**Priority: High | Timeline: 2-3 days**

#### Python API Updates
```bash
cd services/api
pip install supabase stripe openai python-dotenv
```

Create `/services/api/.env`:
```env
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
OPENAI_API_KEY=your_key
STRIPE_API_KEY=your_key
```

#### Implement Core Endpoints
1. `/api/subscription/check-usage` - Verify user hasn't exceeded limits
2. `/api/jobs/search` - Search and cache jobs
3. `/api/jobs/rank` - AI ranking with tier-based priority
4. `/api/applications/generate` - Generate CV/cover letter (Plus/Premium only)

### 4. Deployment Preparation
**Priority: Medium | Timeline: 1-2 days**

#### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set up preview deployments

#### API Deployment Options

**Option A: Google Cloud Run (Recommended)**
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/[PROJECT_ID]/aura-api
gcloud run deploy aura-api --image gcr.io/[PROJECT_ID]/aura-api --platform managed
```

**Option B: Railway.app (Simpler)**
1. Connect GitHub repo
2. Deploy from `/services/api`
3. Add environment variables

## Week-by-Week Development Plan

### Week 1-2: Foundation
- [x] Documentation updates
- [ ] Supabase setup and schema
- [ ] Stripe product configuration
- [ ] Basic auth flow implementation
- [ ] Landing page with pricing

### Week 3-4: Core Features
- [ ] Job ingestion from RemoteOK API
- [ ] Basic ranking algorithm
- [ ] Dashboard with job cards
- [ ] Rating system
- [ ] Usage tracking

### Week 5-6: Premium Features
- [ ] Application generation (OpenAI/Anthropic)
- [ ] CV customization
- [ ] Cover letter generation
- [ ] Career coaching chatbot
- [ ] Analytics dashboard

### Week 7-8: Polish & Launch
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta user recruitment
- [ ] Production deployment

## Testing Checklist

### Payment Flow
- [ ] Free user can sign up without payment
- [ ] Upgrade from Free to Plus works
- [ ] Upgrade from Plus to Premium works
- [ ] Downgrade works correctly
- [ ] Annual billing discount applies
- [ ] Subscription cancellation works
- [ ] Usage limits enforced per tier

### Core Features
- [ ] Job search returns relevant results
- [ ] Rating system saves correctly
- [ ] Application generation works for Plus/Premium
- [ ] Usage counter resets monthly
- [ ] Profile data saves correctly

### Security
- [ ] RLS policies work correctly
- [ ] API endpoints require authentication
- [ ] File uploads are secure
- [ ] Rate limiting is in place
- [ ] CORS configured correctly

## Budget Estimation

### Monthly Costs (Production)
- **Supabase**: $25/month (Pro tier)
- **Vercel**: $20/month (Pro tier)
- **Stripe**: 2.9% + $0.30 per transaction
- **Cloud Run/Lambda**: ~$10-50/month (usage-based)
- **OpenAI API**: ~$50-200/month (usage-based)
- **Domain**: $15/year

**Total**: ~$120-300/month initially

### Revenue Projections
Assuming conservative growth:
- Month 1: 100 free, 10 Plus, 2 Premium = $70
- Month 3: 500 free, 50 Plus, 10 Premium = $350
- Month 6: 2000 free, 200 Plus, 50 Premium = $1,500
- Month 12: 10000 free, 1000 Plus, 200 Premium = $7,000

## Marketing & Launch Strategy

### Pre-Launch (2 weeks before)
1. Create landing page with email waitlist
2. Write launch blog posts
3. Prepare demo videos
4. Reach out to beta testers

### Launch Week
1. **Product Hunt Launch**
   - Prepare assets and copy
   - Schedule for Tuesday 12:01 AM PT
   - Engage with comments

2. **Social Media**
   - Twitter/X announcement thread
   - LinkedIn post with video demo
   - Reddit posts in relevant subreddits

3. **Content Marketing**
   - "How we built AURA" technical blog post
   - "The future of job hunting" thought piece
   - Video tutorials on YouTube

### Post-Launch
1. Collect and implement user feedback
2. Weekly feature releases
3. Case studies from successful users
4. SEO optimization for job-related keywords

## Risk Mitigation

### Technical Risks
- **API Rate Limits**: Implement caching and queuing
- **Cost Overruns**: Set up billing alerts and usage caps
- **Scaling Issues**: Use serverless architecture

### Business Risks
- **Low Conversion**: A/B test pricing and features
- **High Churn**: Implement engagement features
- **Competition**: Focus on AI differentiation

## Success Metrics (First 3 Months)

### Target Metrics
- 1,000 registered users
- 5% free-to-paid conversion
- <3% monthly churn
- 4.5+ star rating average
- <24hr support response time

### Tracking Setup
1. Mixpanel or Posthog for analytics
2. Stripe Dashboard for revenue metrics
3. Supabase Dashboard for usage metrics
4. Sentry for error tracking

## Contact & Resources

### Key Services
- **Supabase**: [supabase.com](https://supabase.com)
- **Stripe**: [stripe.com](https://stripe.com)
- **Vercel**: [vercel.com](https://vercel.com)
- **Google Cloud Run**: [cloud.google.com/run](https://cloud.google.com/run)

### Documentation
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts)

### Support Channels
- GitHub Issues for bug reports
- Discord for community support
- Email for business inquiries

---

## Action Items for Today

1. **Create Accounts**:
   - [ ] Supabase account
   - [ ] Stripe account
   - [ ] Vercel account (if not exists)

2. **Setup Infrastructure**:
   - [ ] Create Supabase project
   - [ ] Create Stripe products
   - [ ] Update environment variables

3. **Start Coding**:
   - [ ] Implement Supabase auth
   - [ ] Create pricing page
   - [ ] Set up Stripe checkout

Remember: Launch fast, iterate based on feedback. The goal is to get a working MVP in users' hands within 2-4 weeks.

---
*Last Updated: November 2024*
*Questions? Reach out in the project Discord or open a GitHub issue.*