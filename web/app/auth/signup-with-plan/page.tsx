'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'pricing-table-id': string;
          'publishable-key': string;
        },
        HTMLElement
      >;
    }
  }
}

export default function SignupWithPlanPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'account' | 'plan'>('account');
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Listen for Stripe checkout completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'stripe-pricing-table:checkout-complete') {
        // User has selected a plan and completed checkout
        router.push('/onboarding');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setUserId(data.user.id);
        // Move to plan selection step
        setStep('plan');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSkipPlan = async () => {
    // User wants to continue with free plan
    router.push('/onboarding');
  };

  if (step === 'plan') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="mt-2 text-lg text-gray-600">
              Start with our free tier or unlock more features with a paid plan
            </p>
          </div>

          {/* Stripe Pricing Table */}
          <div className="mb-8">
            <Script
              async
              src="https://js.stripe.com/v3/pricing-table.js"
              strategy="lazyOnload"
            />
            <stripe-pricing-table
              pricing-table-id="prctbl_1SPb4rHbK5QokVUIlLsXbPhu"
              publishable-key="pk_live_51SPYmVHbK5QokVUIQb09x5sDWU4aNGHEFPGJiNKJI1H5xIXuvOj7cebWLZZPG9LvhHfEcGg7Qr2dONT1lHQYxYm600SstGOhWy"
            ></stripe-pricing-table>
          </div>

          {/* Skip option */}
          <div className="text-center">
            <button
              onClick={handleSkipPlan}
              className="text-gray-600 hover:text-gray-800 underline text-sm"
            >
              Continue with free plan (2 job matches/month)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your AURA account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Step 1: Create your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleCreateAccount}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Continue to Plan Selection'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}