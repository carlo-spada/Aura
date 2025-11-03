# AURA Product Specifications

## Part 1: Product & UX Vision

### 1.1. Core Mission & Target User
* **Core Problem**: To find users the best possible job tailored to their unique needs and wants at any point in their career.
* **Primary Outcome**: To help users find and secure a better job position than their current one in less than a year.
* **MVP Target User**: Recent graduates and junior professionals looking for their first job or a career upgrade.
* **Value Proposition**: AI-powered job matching that learns from user feedback to deliver increasingly personalized opportunities.

### 1.2. The User Journey Map
1. **Landing & Auth**: A single landing page with Supabase Auth integration (email/password, OAuth providers).
2. **Subscription Selection**: Clear presentation of Free, Plus ($5/mo), and Premium ($10/mo) tiers with Stripe checkout.
3. **Onboarding**: A guided, multi-step wizard to capture the user's Preferences (what they want).
4. **Profile Creation**: The user can either upload an existing CV or create one from scratch via a guided conversation with the AI chatbot. This populates their Qualifications profile.
5. **Dashboard & Rating**: Based on subscription tier, users see their monthly allocation of job matches (2/6/unlimited). They rate each job from 1-5 stars, providing the core feedback signal.
6. **Application Generation**: For jobs rated 4-5 stars (Plus/Premium only), users can click "Generate Application." The system creates a tailored CV and Cover Letter.
7. **Application Tracking**: Jobs are tracked in the ApplicationsPage with status updates (Applied, Interviewing, Offer, etc.), providing a secondary feedback loop.

### 1.3. Subscription Tiers & Features

| Tier | Monthly | Annual | Job Matches | Features |
|------|---------|--------|-------------|----------|
| **Free** | $0 | $0 | 2/month | • Basic job matching<br>• Manual application tracking<br>• Community support |
| **Plus** | $5 | $48 ($4/mo) | 6/month | • Enhanced AI matching<br>• Application generation<br>• Priority ranking<br>• Email support |
| **Premium** | $10 | $96 ($8/mo) | Unlimited | • All Plus features<br>• Career coaching AI<br>• Advanced analytics<br>• API access<br>• Priority support |

### 1.4. UI/UX Principles & App Personality
* **Frictionless Experience**: The UI will be designed to be fast, intuitive, and "dopaminergic," especially the job card rating process.
* **Transparent Pricing**: Clear usage indicators showing remaining job matches for the month.
* **Proactive Guidance**: The app will act as an intelligent co-pilot, proactively offering advice rather than waiting to be asked.
* **App Personality**: The voice of the app will be professional yet approachable, data-driven but empathetic.

## Part 2: Application Architecture & Structure

### 2.1. Technology Stack
* **Frontend**: Next.js 14 with App Router, Shadcn/ui, and Tailwind CSS, hosted on Vercel
* **Authentication & Database**: Supabase (PostgreSQL + Auth + Realtime)
* **Vector Database**: pgvector extension in Supabase for semantic search
* **AI Backend**: Python/FastAPI microservices deployed as serverless containers (Cloud Run/Lambda)
* **Payments**: Stripe for subscription management and billing
* **File Storage**: Supabase Storage for CVs and generated documents
* **Monitoring**: Vercel Analytics, Supabase Dashboard, Sentry

### 2.2. Frontend Pages & Components
* **LandingPage**: Marketing page with pricing tiers and Supabase Auth modal
* **PricingPage**: Detailed comparison of subscription tiers with Stripe checkout
* **OnboardingWizard**: Multi-step flow for preferences and profile creation
* **DashboardPage**: Main view with job cards (respecting monthly limits)
* **ApplicationsPage**: Track application status with kanban board view
* **CareerPlanPage**: AI-generated growth advice (Premium feature)
* **SettingsPage**: Manage subscription, preferences, and account details
* **UsagePage**: Track monthly job match usage and billing history
* **Chatbot**: AI assistant for profile building and career advice

### 2.3. Backend Services (Microservices)
* **UserService** (Supabase): Manages user accounts, preferences, and qualifications
* **SubscriptionService** (Stripe + Supabase): Handles billing, usage tracking, and tier management
* **JobService** (Python/FastAPI): Implements job sourcing and caching from multiple APIs
* **RankingService** (Python/FastAPI): AI-powered job scoring and personalization
* **GenerationService** (Python/FastAPI): Creates tailored CVs and cover letters
* **ChatService** (Python/FastAPI): Powers the conversational AI and career coaching
* **UsageService** (Supabase Edge Functions): Tracks and enforces monthly usage limits

### 2.4. Core Data Schemas

#### Users & Auth
```typescript
interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'plus' | 'premium';
  subscription_status: 'active' | 'canceled' | 'past_due';
  stripe_customer_id?: string;
  monthly_job_matches_used: number;
  monthly_reset_date: Date;
  created_at: Date;
  updated_at: Date;
}
```

#### Preferences & Qualifications
```typescript
interface Preferences {
  user_id: string;
  desired_roles: string[];
  industries: string[];
  locations: Location[];
  salary_range: { min: number; max: number; currency: string };
  work_type: 'remote' | 'hybrid' | 'onsite' | 'flexible';
  company_size_preference?: 'startup' | 'mid' | 'enterprise' | 'any';
}

interface Qualifications {
  user_id: string;
  structured_cv_data: {
    experience: Experience[];
    skills: Skill[];
    education: Education[];
    certifications: string[];
  };
  ai_highlights: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
}
```

#### Jobs & Applications
```typescript
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: { min: number; max: number; currency: string; is_estimated: boolean };
  description: string;
  requirements: string[];
  ai_analysis: {
    summary: string;
    pros: string[];
    cons: string[];
    match_score: number;
  };
  source: string;
  posted_date: Date;
  expires_date?: Date;
}

interface Application {
  id: string;
  user_id: string;
  job_id: string;
  user_rating: 1 | 2 | 3 | 4 | 5;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  generated_cv_url?: string;
  generated_cover_letter_url?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

## Part 3: The AI Engine - Step-by-Step Processes

### Phase 1: User Profile Creation
An LLM parses uploaded CVs or chat conversations into structured Qualifications data:
- Extract work experience, skills, education, and certifications
- Identify experience level and career trajectory
- Generate AI highlights for standout achievements
- Store embeddings for semantic matching

### Phase 2: Job Ingestion & Caching
Asynchronous job sourcing with intelligent caching:
- Query multiple job APIs (LinkedIn, Indeed, RemoteOK, etc.)
- Normalize data using LLM for consistent formatting
- Extract salary ranges (mark as estimated when inferred)
- Generate embeddings for semantic search
- Cache in Supabase with 7-day TTL

### Phase 3: Matching & Ranking Algorithm
Multi-factor scoring system:
- **Semantic Fit (40%)**: Vector similarity between job and user profile
- **Preference Score (30%)**: Location, salary, company size alignment
- **Experience Score (20%)**: Skills and years of experience match
- **Feedback Score (10%)**: Learning from user ratings and outcomes
- **Subscription Boost**: Premium users get priority ranking

### Phase 4: Generation & Guidance

#### Application Generation (Plus/Premium)
- Analyze job description for key requirements
- Restructure user's qualifications to highlight relevant experience
- Generate tailored cover letter with company research
- Create ATS-optimized formatting
- Store generated documents in Supabase Storage

#### Career Guidance (Premium)
- Identify skill gaps based on desired roles
- Recommend certifications and learning paths
- Analyze market trends for career pivots
- Provide salary negotiation insights

## Part 4: Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Core infrastructure and authentication
- [ ] Supabase project setup with auth and database
- [ ] Stripe products and webhook configuration
- [ ] Next.js app with Supabase Auth integration
- [ ] Basic landing page with pricing tiers
- [ ] User onboarding flow

### Phase 2: Core Features (Week 3-4)
**Goal**: Job matching and usage tracking
- [ ] Job ingestion pipeline from RemoteOK/other APIs
- [ ] Basic ranking algorithm implementation
- [ ] Dashboard with job cards UI
- [ ] Usage tracking and monthly limits
- [ ] Rating system implementation

### Phase 3: Premium Features (Week 5-6)
**Goal**: AI-powered features for paid tiers
- [ ] Application generation service
- [ ] CV/Cover letter customization
- [ ] Career coaching chatbot
- [ ] Advanced analytics dashboard
- [ ] API access for Premium users

### Phase 4: Launch Preparation (Week 7-8)
**Goal**: Production readiness
- [ ] Payment flow end-to-end testing
- [ ] Performance optimization (caching, CDN)
- [ ] Security audit and penetration testing
- [ ] Beta user onboarding and feedback
- [ ] Marketing site and documentation
- [ ] Production deployment and monitoring

## Part 5: Success Metrics & KPIs

### User Metrics
- Monthly Active Users (MAU)
- Conversion rate (Free → Paid)
- User retention (30/60/90 day)
- Average session duration
- Job application rate

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate by tier
- Usage patterns by tier

### Product Metrics
- Job match accuracy (user ratings)
- Application success rate
- Time to first application
- Feature adoption rates
- Support ticket volume

## Part 6: Technical Considerations

### Scalability
- Serverless architecture for automatic scaling
- Database connection pooling via Supabase
- CDN for static assets
- Queue-based job processing

### Security
- Row Level Security (RLS) in Supabase
- API rate limiting per tier
- Secure file storage for CVs
- GDPR compliance for EU users
- Regular security audits

### Performance
- <3s page load time target
- Optimistic UI updates
- Background job processing
- Efficient vector search with pgvector
- Redis caching for hot data

### Monitoring
- Error tracking with Sentry
- Performance monitoring with Vercel Analytics
- Custom dashboards for business metrics
- Alerting for critical issues
- User feedback collection

---
*Last Updated: November 2024*

