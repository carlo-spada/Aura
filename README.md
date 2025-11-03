# AURA — Autonomous Job Copilot

AURA helps users find, rate, and win better jobs with AI-powered job matching and application generation. Our mission is to democratize access to career opportunities through intelligent automation and personalized recommendations.

## 🎯 Value Proposition

- **AI-Powered Job Matching**: Advanced algorithms that understand your unique profile and preferences
- **Smart Application Generation**: Tailored CVs and cover letters for each opportunity
- **Continuous Learning**: Feedback loop from ratings and outcomes to improve recommendations
- **Career Growth Insights**: Proactive guidance on skills gaps and advancement opportunities

See the full product vision in `AURA_Specification.md`.

## 💳 Subscription Tiers

| Plan | Monthly Price | Annual Price | Features |
|------|--------------|--------------|----------|
| **Free** | $0 | $0 | • 2 personalized job matches/month<br>• Basic dashboard<br>• Manual application tracking |
| **Plus** | $5 USD | $48 USD ($4/mo) | • 6 personalized job matches/month<br>• AI-generated applications<br>• Priority ranking<br>• Application analytics |
| **Premium** | $10 USD | $96 USD ($8/mo) | • Unlimited job matches<br>• Advanced AI applications<br>• Career growth planning<br>• 1-on-1 AI coaching<br>• API access |

## 🏗 Architecture

### Production Stack
- **Frontend**: Next.js 14 (App Router) + shadcn/ui + Tailwind CSS → Deployed on **Vercel**
- **Authentication**: Supabase Auth (replacing Clerk for unified auth/database)
- **Database**: Supabase (PostgreSQL with pgvector for semantic search)
- **Payments**: Stripe (subscription management + usage-based billing)
- **AI Backend**: Python/FastAPI microservices → Deployed as serverless containers
- **Vector Search**: pgvector (Supabase) for production, FAISS for local development

### Deployment Strategy
- **Frontend**: Vercel (automatic deployments from GitHub)
- **Database & Auth**: Supabase Cloud (managed PostgreSQL + Auth)
- **AI Services**:
  - Option A: AWS Lambda or Google Cloud Run (serverless containers)
  - Option B: Small VPS with Docker Swarm/K3s for cost optimization
- **Monitoring**: Vercel Analytics + Supabase Dashboard + Custom metrics

## 🚀 Current Status

### Completed
- ✅ Next.js frontend scaffold with App Router
- ✅ Basic API structure (FastAPI)
- ✅ Authentication setup (migrating Clerk → Supabase)
- ✅ Initial job search endpoints

### In Progress
- 🔄 Supabase integration (auth + database)
- 🔄 Stripe payment integration
- 🔄 Production deployment configuration

### Next Steps
- ⏳ AI ranking algorithm implementation
- ⏳ Application generation service
- ⏳ User onboarding flow
- ⏳ Dashboard with job cards UI

## 🛠 Quickstart

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Supabase account (free tier works)
- Stripe account (test mode for development)

### Web App Setup (Supabase + Stripe)
1) **Environment Setup**
   ```bash
   cd web
   cp .env.local.example .env.local
   ```
   Configure `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk_test
   STRIPE_SECRET_KEY=your_stripe_sk_test
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # API
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2) **Install and Run**
   ```bash
   npm install
   npm run dev
   ```
   Access at http://localhost:3000

### Python API Service

**Local Development**
1) **Setup Virtual Environment**
   ```bash
   cd services/api
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2) **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Configure `.env`:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key

   # OpenAI/Anthropic for AI features
   OPENAI_API_KEY=your_api_key  # or ANTHROPIC_API_KEY

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

3) **Run the API**
   ```bash
   uvicorn api.main:app --reload --port 8000 --app-dir src
   ```

**Docker Development**
```bash
docker compose up -d api
```
Access at http://localhost:8000/docs

### API Endpoints

**Public Endpoints**
- `GET /healthz` - Health check
- `GET /jobs` - List available jobs
- `GET /jobs/search?q=frontend&limit=20` - Search jobs
- `GET /subscription/plans` - Get subscription tiers

**Authenticated Endpoints** (requires Supabase JWT)
- `POST /jobs/rank` - Get personalized job rankings
- `POST /applications/generate` - Generate tailored CV/cover letter
- `GET /me/profile` - User profile and preferences
- `GET /me/applications` - Track applications
- `GET /me/usage` - Check usage limits

## 🚀 Deployment

### Frontend (Vercel)

1) **Connect GitHub Repository**
   - Import project in Vercel Dashboard
   - Select `web/` as root directory

2) **Environment Variables**
   ```env
   # Production Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # Production Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=

   # API URL
   NEXT_PUBLIC_API_URL=https://your-api-domain.com
   ```

3) **Deploy**
   - Automatic deployments on push to main
   - Preview deployments for PRs

### Backend (Microservices)

**Option A: Serverless (Recommended for scalability)**
- **Google Cloud Run**:
  ```bash
  gcloud run deploy aura-api \
    --image gcr.io/PROJECT_ID/aura-api \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
  ```

- **AWS Lambda** (via Serverless Framework):
  ```yaml
  # serverless.yml
  service: aura-api
  provider:
    name: aws
    runtime: python3.11
  functions:
    api:
      image: aura-api:latest
      events:
        - httpApi: '*'
  ```

**Option B: VPS (Cost-effective)**
- Deploy to DigitalOcean/Linode/Hetzner ($5-20/month)
- Use Docker Swarm or K3s for orchestration
- Example deployment script included in `/deploy/vps-setup.sh`

### Database (Supabase)

1) **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project (free tier includes 500MB database)

2) **Run Migrations**
   ```bash
   npx supabase db push
   ```

3) **Enable pgvector**
   ```sql
   CREATE EXTENSION vector;
   ```

### Payments (Stripe)

1) **Setup Products in Stripe Dashboard**
   - Create "Plus" and "Premium" products
   - Set up monthly and annual price points

2) **Configure Webhooks**
   - Endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`

3) **Test with Stripe CLI**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## 📁 Project Structure

```
aura/
├── web/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and hooks
│   └── public/           # Static assets
├── services/
│   └── api/              # Python FastAPI backend
│       ├── src/          # Source code
│       ├── tests/        # Test files
│       └── Dockerfile    # Container definition
├── supabase/             # Database migrations & functions
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge functions
├── deploy/               # Deployment scripts
└── docs/                 # Documentation

```

## 🗓 Launch Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Project setup and documentation
- [ ] Supabase auth integration
- [ ] Database schema and migrations
- [ ] Stripe subscription setup
- [ ] Basic user onboarding flow

### Phase 2: Core Features (Week 3-4)
- [ ] Job ingestion pipeline
- [ ] AI ranking algorithm
- [ ] Dashboard UI with job cards
- [ ] Rating system implementation
- [ ] Usage tracking and limits

### Phase 3: AI Services (Week 5-6)
- [ ] Application generation service
- [ ] CV/Cover letter customization
- [ ] Career growth recommendations
- [ ] Chatbot integration

### Phase 4: Polish & Launch (Week 7-8)
- [ ] Payment flow testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Beta user testing
- [ ] Production deployment

## 🔧 Development

### Code Quality
```bash
# Python
pip install -r requirements-dev.txt
black services/api/src
ruff check services/api/src

# TypeScript
cd web
npm run lint
npm run type-check
```

### Testing
```bash
# Frontend tests
cd web && npm test

# API tests
cd services/api
pytest tests/
```

### Database Migrations
```bash
# Create new migration
npx supabase migration new <name>

# Apply migrations
npx supabase db push

# Reset database
npx supabase db reset
```

## 🔐 Security Considerations

- **Authentication**: Supabase Row Level Security (RLS) policies
- **API Rate Limiting**: Implemented at edge (Vercel) and API level
- **Payment Security**: PCI compliance via Stripe
- **Data Privacy**: GDPR-compliant data handling
- **Secrets Management**: Environment variables, never committed

## 📊 Monitoring & Analytics

- **Frontend**: Vercel Analytics + Web Vitals
- **Backend**: Cloud Run/Lambda metrics
- **Database**: Supabase Dashboard
- **Errors**: Sentry integration
- **Business Metrics**: Custom dashboard for MRR, churn, usage

## 🤝 Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - see `LICENSE` file for details.

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@aura-jobs.com
- **Discord**: [Join our community](https://discord.gg/aura-jobs)

---
Built with ❤️ to democratize career opportunities
