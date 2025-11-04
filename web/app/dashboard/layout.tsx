import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  // Fetch user data including subscription info
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">AURA</h1>
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/dashboard" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                <a href="/dashboard/applications" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Applications
                </a>
                <a href="/dashboard/settings" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Settings
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Usage Indicator */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">{userData?.monthly_job_matches_used || 0}</span>
                <span className="text-gray-400"> / </span>
                <span>{userData?.monthly_job_matches_limit || 2} matches</span>
              </div>

              {/* Subscription Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                userData?.subscription_tier === 'premium'
                  ? 'bg-purple-100 text-purple-800'
                  : userData?.subscription_tier === 'plus'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {userData?.subscription_tier?.toUpperCase() || 'FREE'}
              </div>

              {/* User Menu */}
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-3">{user.email}</span>
                <form action="/api/auth/signout" method="post">
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}