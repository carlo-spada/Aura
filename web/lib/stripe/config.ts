import Stripe from 'stripe'

// Initialize Stripe lazily to avoid build-time errors
let stripeInstance: Stripe | null = null

export const getStripe = () => {
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  }
  return stripeInstance!
}

// Export for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    const instance = getStripe()
    return instance[prop as keyof Stripe]
  }
})

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    monthlyJobMatches: 2,
    features: [
      '2 personalized job matches per month',
      'Basic dashboard',
      'Manual application tracking',
      'Community support',
    ],
  },
  plus: {
    name: 'Plus',
    monthlyPrice: 5,
    yearlyPrice: 48,
    monthlyJobMatches: 6,
    features: [
      '6 personalized job matches per month',
      'AI-generated applications',
      'Priority job ranking',
      'Application analytics',
      'Email support',
    ],
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ID_PLUS_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_ID_PLUS_YEARLY!,
    },
  },
  premium: {
    name: 'Premium',
    monthlyPrice: 10,
    yearlyPrice: 96,
    monthlyJobMatches: 999, // Unlimited
    features: [
      'Unlimited job matches',
      'Advanced AI applications',
      'Career growth planning',
      '1-on-1 AI coaching',
      'API access',
      'Priority support',
    ],
    priceIds: {
      monthly: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY!,
    },
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS