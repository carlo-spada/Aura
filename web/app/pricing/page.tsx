'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { createClient } from '@/lib/supabase/client'
import { SUBSCRIPTION_TIERS } from '@/lib/stripe/config'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubscribe = async (tier: 'plus' | 'premium') => {
    setLoading(tier)
    setError(null)

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to signup with the selected plan
        router.push(`/auth/signup?plan=${tier}&interval=${billingInterval}`)
        return
      }

      // Get the price ID based on tier and interval
      const priceId = SUBSCRIPTION_TIERS[tier].priceIds[billingInterval]

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      })

      const { sessionId, url, error: checkoutError } = await response.json()

      if (checkoutError) {
        throw new Error(checkoutError)
      }

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        // Fallback to client-side redirect
        const stripe = await stripePromise
        if (stripe) {
          const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
          if (stripeError) {
            throw stripeError
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that fits your job search needs
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className={billingInterval === 'monthly' ? 'text-gray-900' : 'text-gray-500'}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={billingInterval === 'yearly' ? 'text-gray-900' : 'text-gray-500'}>
              Yearly
              <span className="ml-1 text-green-600 font-semibold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Free Tier */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-900">
                {SUBSCRIPTION_TIERS.free.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Perfect for getting started
              </p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="mb-8 space-y-3">
              {SUBSCRIPTION_TIERS.free.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => router.push('/auth/signup')}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Get Started
            </button>
          </div>

          {/* Plus Tier */}
          <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-sm">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-900">
                {SUBSCRIPTION_TIERS.plus.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                For active job seekers
              </p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${billingInterval === 'monthly'
                  ? SUBSCRIPTION_TIERS.plus.monthlyPrice
                  : Math.round(SUBSCRIPTION_TIERS.plus.yearlyPrice / 12)}
              </span>
              <span className="text-gray-500">/month</span>
              {billingInterval === 'yearly' && (
                <p className="mt-1 text-sm text-green-600">
                  ${SUBSCRIPTION_TIERS.plus.yearlyPrice} billed annually
                </p>
              )}
            </div>

            <ul className="mb-8 space-y-3">
              {SUBSCRIPTION_TIERS.plus.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('plus')}
              disabled={loading === 'plus'}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading === 'plus' ? 'Processing...' : 'Subscribe to Plus'}
            </button>
          </div>

          {/* Premium Tier */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-900">
                {SUBSCRIPTION_TIERS.premium.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Maximum career acceleration
              </p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                ${billingInterval === 'monthly'
                  ? SUBSCRIPTION_TIERS.premium.monthlyPrice
                  : Math.round(SUBSCRIPTION_TIERS.premium.yearlyPrice / 12)}
              </span>
              <span className="text-gray-500">/month</span>
              {billingInterval === 'yearly' && (
                <p className="mt-1 text-sm text-green-600">
                  ${SUBSCRIPTION_TIERS.premium.yearlyPrice} billed annually
                </p>
              )}
            </div>

            <ul className="mb-8 space-y-3">
              {SUBSCRIPTION_TIERS.premium.features.map((feature) => (
                <li key={feature} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="ml-3 text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loading === 'premium'}
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading === 'premium' ? 'Processing...' : 'Subscribe to Premium'}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="font-semibold text-gray-900">
                Can I change plans anytime?
              </h3>
              <p className="mt-2 text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                What happens when I reach my monthly limit?
              </h3>
              <p className="mt-2 text-gray-600">
                For Free and Plus plans, you'll need to wait until the next month or upgrade to continue getting new job matches. Premium users have unlimited matches.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Do you offer refunds?
              </h3>
              <p className="mt-2 text-gray-600">
                We offer a 14-day money-back guarantee for new subscriptions. If you're not satisfied, contact support for a full refund.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Is my payment information secure?
              </h3>
              <p className="mt-2 text-gray-600">
                Absolutely! We use Stripe for payment processing, which is PCI-compliant and uses industry-standard encryption. We never store your credit card details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}