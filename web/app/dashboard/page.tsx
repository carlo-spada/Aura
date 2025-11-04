import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JobCard from '@/components/JobCard';
import UsageAlert from '@/components/UsageAlert';
import EmptyState from '@/components/EmptyState';
import FindMatchesButton from '@/components/FindMatchesButton';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user data with subscription info
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get user's job matches
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      applications!left (
        id,
        status,
        applied_at
      )
    `)
    .eq('user_id', user.id)
    .order('match_score', { ascending: false })
    .limit(20);

  const hasReachedLimit = userData?.monthly_job_matches_used >= userData?.monthly_job_matches_limit;
  const isFreeTier = userData?.subscription_tier === 'free';

  return (
    <div>
      {/* Header */}
      <div className="px-4 sm:px-0 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Your Job Matches</h2>
        <p className="mt-1 text-sm text-gray-600">
          AI-curated opportunities based on your profile and preferences
        </p>
      </div>

      {/* Usage Alert for Free Users */}
      {isFreeTier && hasReachedLimit && (
        <UsageAlert
          message="You've reached your monthly limit of 2 job matches."
          actionText="Upgrade to Plus"
          actionHref="/pricing"
        />
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <FindMatchesButton
          hasReachedLimit={hasReachedLimit}
          userId={user.id}
        />

        <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
          ⚙️ Update Preferences
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Total Matches</div>
          <div className="text-2xl font-bold text-gray-900">{jobs?.length || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Applied</div>
          <div className="text-2xl font-bold text-green-600">
            {jobs?.filter(j => j.applications?.length > 0).length || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {jobs?.filter(j => j.applications?.some((a: any) => a.status === 'pending')).length || 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-600">Match Rate</div>
          <div className="text-2xl font-bold text-indigo-600">
            {jobs && jobs.length > 0 ? Math.round((jobs.filter(j => j.match_score >= 80).length / jobs.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Job Cards Grid */}
      {jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              hasApplied={job.applications?.length > 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}