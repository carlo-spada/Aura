Part 1: Product & UX Vision

  1.1. Core Mission & Target User
   * Core Problem: To find users the best possible job tailored to their unique needs and wants at any point in their career.
   * Primary Outcome: To help users find and secure a better job position than their current one in less than a year.
   * MVP Target User: Recent graduates and junior professionals looking for their first job or a career upgrade.

  1.2. The User Journey Map
   1. Landing & Auth: A single landing page with an integrated, modal-based sign-up/sign-in flow.
   2. Onboarding: A guided, multi-step wizard to capture the user's Preferences (what they want).
   3. Profile Creation: The user can either upload an existing CV or create one from scratch via a guided conversation with the AI chatbot. This populates their Qualifications profile
      (what they have).
   4. Dashboard & Rating: The user is presented with a batch of 2-6 highly relevant, ranked job cards. They rate each job from 1-5 stars, providing the core feedback signal.
   5. Application Generation: For jobs rated 4-5 stars, the user can click "Generate Application." The system creates a tailored CV and Cover Letter for that specific role.
   6. Application Tracking: The job is moved to an ApplicationsPage where the user can track its status (Applied, Interviewing, Offer, etc.), providing a secondary feedback loop for the
       AI.

  1.3. UI/UX Principles & App Personality
   * Frictionless Experience: The UI will be designed to be fast, intuitive, and "dopaminergic," especially the job card rating process.
   * Proactive Guidance: The app will act as an intelligent co-pilot, proactively offering advice rather than waiting to be asked.
   * App Personality: The voice of the app, especially the chatbot, will be a unique blend: witty, data-driven, authoritative, friendly, and motivational.

  Part 2: Application Architecture & Structure

  2.1. Technology Stack
   * Frontend: Next.js with Shadcn/ui and Tailwind CSS, hosted on Vercel.
   * Authentication: Clerk.
   * Primary/Real-time Backend: Convex (for user data, preferences, application state).
   * Heavy AI Backend: Python/FastAPI services hosted as serverless functions (e.g., on AWS Lambda or Google Cloud Run).
   * Payments: Stripe.
   * Database: PostgreSQL with the pgvector extension (for AI services needing it).

  2.2. Frontend Pages & Components
   * LandingPage: With integrated Auth modal.
   * OnboardingWizard: Multi-step flow for preferences and profile creation.
   * DashboardPage: Main view with the stack of job cards.
   * ApplicationsPage: To track application status.
   * CareerPlanPage: For AI-generated growth advice.
   * SettingsPage: For managing preferences and account details.
   * Chatbot: Persistent, site-wide conversational interface.

  2.3. Backend Services (Microservices)
   * `UserService` (on Convex): Manages user accounts, Preferences, and Qualifications.
   * `ApplicationService` (on Convex): Manages application tracking data.
   * `JobService` (Python/FastAPI): Implements the "Asynchronous Search & Cache" model for sourcing jobs.
   * `RankingService` (Python/FastAPI): Contains the AI logic for scoring and ranking jobs for a user.
   * `GenerationService` (Python/FastAPI): Generates tailored CVs and Cover Letters.
   * `ChatService` (Python/FastAPI & Convex): Powers the conversational AI, guidance logic, and chat history.

  2.4. Core Data Schemas
   * `User`: Contains auth info, personal details, and account settings.
   * `Preferences`: What the user wants (roles, industries, location weights, salary range, etc.).
   * `Qualifications`: What the user has (AI-parsed structured_cv_data, including work history, skills with experience levels, and AI-scored importance/highlights).
   * `Job`: The normalized "job card" with details, salary (with is_estimated flag), and AI analysis (summary, pros, cons).
   * `Application`: Links a User to a Job and tracks user_rating, current_status, status_history, and links to generated_documents.

  Part 3: The AI Engine - Step-by-Step Processes

   * Phase 1: User Profile Creation: An LLM parses an uploaded CV or a chat conversation into the structured Qualifications JSON object.
   * Phase 2: Job Ingestion (Asynchronous Search & Cache): When a user requests jobs, a background process performs a targeted search on external sources, normalizes the data via LLM,
     and saves new jobs to a cache (our Jobs database), ensuring costs are variable and data is fresh.
   * Phase 3: Matching & Ranking: A weighted algorithm scores jobs based on Semantic Fit (40%), Preference Score (30%), Experience Score (20%), and Feedback Score (10%).
   * Phase 4: Guidance & Generation:
       * Guidance (Proactive): The system automatically analyzes a user's profile to find skill gaps and career path opportunities, presenting them on the CareerPlanPage and via the
         chatbot.
       * Generation: An LLM rewrites the user's Qualifications data to create a tailored CV/CL for a specific job description.

  Part 4: MVP Development Roadmap

   * Milestone 1: Foundation & User Onboarding
       * Goal: A user can sign up, log in, and complete the onboarding process to save their Preferences.
       * Tech: Next.js, Clerk, Convex.

   * Milestone 2: The Core Job Pipeline
       * Goal: The backend can, when triggered, execute the "Asynchronous Search & Cache" process for one job source and rank the results.
       * Tech: Convex trigger, Python/FastAPI services.

   * Milestone 3: The Dashboard & Feedback Loop
       * Goal: A user can see their first batch of jobs and provide 1-5 star ratings.
       * Tech: Next.js DashboardPage, connecting Convex to the AI backend.

   * Milestone 4: Application Generation & Tracking
       * Goal: A user can generate a tailored CV for a top-rated job and track it on a basic ApplicationsPage.
       * Tech: Python GenerationService, Next.js UI.

