# AURA - AI-Powered Job Copilot

Your intelligent companion for finding and applying to perfect job matches.

🔗 **Live at:** [aura.carlospada.me](https://aura.carlospada.me)

## 🚀 Overview

AURA is an AI-powered job search and application assistant that helps job seekers find perfect matches and generate tailored applications. The platform uses advanced AI to match candidates with opportunities based on their skills, experience, and preferences.

## ✨ Features

### Core Functionality
- **AI-Powered Job Matching**: Advanced algorithms match you with relevant opportunities
- **Smart Application Generation**: Tailored CVs and cover letters for each job
- **Application Tracking**: Keep track of all your job applications in one place
- **Usage-Based Limits**: Fair usage system based on subscription tier

### Subscription Tiers

| Plan | Monthly | Annual | Job Matches/Month | Features |
|------|---------|--------|-------------------|----------|
| **Free** | $0 | $0 | 2 | Basic dashboard, Manual tracking |
| **Plus** | $5 | $48 ($4/mo) | 6 | AI applications, Priority ranking |
| **Premium** | $10 | $96 ($8/mo) | Unlimited | Career planning, AI coaching, API access |

## 🏗 Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Authentication & Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe (subscriptions + billing portal)
- **Hosting**: Vercel (frontend) + Supabase Cloud (backend)
- **AI Integration**: Ready for OpenAI/Anthropic integration

### Key Integrations
- **Supabase Foreign Data Wrapper**: Direct Stripe-Supabase sync for real-time subscription data
- **Row Level Security**: Secure, user-scoped data access
- **Edge Functions**: Serverless API endpoints

## 🚀 Current Status

### ✅ Completed
- Full authentication system with Supabase Auth
- Complete onboarding flow with preferences and CV upload
- Dashboard with job matching interface
- Stripe subscription integration with checkout and billing portal
- Usage tracking and limits based on subscription tier
- Application tracking system
- Deployed to production at aura.carlospada.me

### 🔄 Next Steps
1. **AI Integration**: Connect OpenAI/Anthropic for job matching
2. **Job Data Pipeline**: Integrate job boards APIs
3. **Application Generation**: AI-powered CV/cover letter creation
4. **Analytics Dashboard**: User insights and success metrics
5. **Mobile App**: React Native companion app

## 🛠 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/carlo-spada/Aura.git
   cd Aura/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Configure your `.env.local`:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # App
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Run database migrations**
   ```bash
   npx supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Aura/
├── web/                      # Next.js application
│   ├── app/                  # App router pages
│   │   ├── (auth)/          # Authentication pages
│   │   ├── dashboard/       # User dashboard
│   │   ├── onboarding/      # Onboarding flow
│   │   └── api/             # API routes
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   └── supabase/           # Database migrations
├── .github/                 # GitHub workflows
└── docs/                   # Documentation
```

## 🚀 Deployment

### Vercel Deployment

1. **Import to Vercel**
   - Connect your GitHub repository
   - Set root directory to `web/`

2. **Configure Environment Variables**
   Add all variables from `.env.local` to Vercel dashboard

3. **Deploy**
   - Automatic deployments on push to `main`
   - Preview deployments for pull requests

### Database Setup (Supabase)

1. Create a new Supabase project
2. Enable the "wrappers" extension for Stripe integration
3. Run migrations from `web/supabase/migrations/`
4. Configure Row Level Security policies

### Payment Setup (Stripe)

1. Create products in Stripe Dashboard:
   - Free tier (metadata: `tier=free`)
   - Plus tier (metadata: `tier=plus`)
   - Premium tier (metadata: `tier=premium`)

2. Set up webhooks:
   - Endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`

## 🔐 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row Level Security (RLS) policies
- **Payment Security**: PCI compliance via Stripe
- **API Protection**: Rate limiting and CORS configuration
- **Data Privacy**: User data isolation and encryption

## 📊 Monitoring

- **Application Monitoring**: Vercel Analytics
- **Database Monitoring**: Supabase Dashboard
- **Payment Monitoring**: Stripe Dashboard
- **Error Tracking**: Browser console + Vercel logs

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/carlo-spada/Aura/issues)
- **Email**: carlo.spada22@gmail.com
- **Documentation**: See `/docs` folder

---

Built with ❤️ to democratize career opportunities