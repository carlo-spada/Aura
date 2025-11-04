import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default async function SettingsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user data with subscription info
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const tierFeatures = {
    free: {
      name: 'Free',
      price: '$0/month',
      features: ['2 job matches per month', 'Basic AI matching', 'Standard support'],
    },
    plus: {
      name: 'Plus',
      price: '$5/month',
      features: ['6 job matches per month', 'Advanced AI matching', 'Priority support', 'Resume optimization'],
    },
    premium: {
      name: 'Premium',
      price: '$10/month',
      features: ['Unlimited job matches', 'Premium AI matching', 'Dedicated support', 'Resume optimization', 'Interview preparation', 'Salary negotiation tips'],
    },
  };

  const currentTier = userData?.subscription_tier || 'free';
  const currentTierInfo = tierFeatures[currentTier as keyof typeof tierFeatures];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h2>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="mt-1 text-sm text-gray-900">{userData?.full_name || 'Not set'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="mt-1 text-sm text-gray-900">
              {userData?.created_at
                ? formatDistanceToNow(new Date(userData.created_at), { addSuffix: true })
                : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-gray-900">{currentTierInfo.name}</span>
              <span className="ml-3 text-gray-500">{currentTierInfo.price}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentTier === 'premium'
                ? 'bg-purple-100 text-purple-800'
                : currentTier === 'plus'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {userData?.subscription_status || 'Active'}
            </span>
          </div>

          <div className="space-y-2 mb-6">
            {currentTierInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {feature}
              </div>
            ))}
          </div>

          {currentTier !== 'premium' ? (
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Upgrade Plan
            </Link>
          ) : (
            <form action="/api/stripe/portal" method="post">
              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Manage Subscription
              </button>
            </form>
          )}
        </div>

        {/* Usage Stats */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Usage This Month</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Job Matches</span>
                <span className="font-medium">
                  {userData?.monthly_job_matches_used || 0} / {userData?.monthly_job_matches_limit || 2}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    (userData?.monthly_job_matches_used || 0) >= (userData?.monthly_job_matches_limit || 2)
                      ? 'bg-red-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{
                    width: `${Math.min(
                      ((userData?.monthly_job_matches_used || 0) / (userData?.monthly_job_matches_limit || 2)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {userData?.monthly_reset_date && (
              <p className="text-xs text-gray-500">
                Resets {formatDistanceToNow(new Date(userData.monthly_reset_date), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}