import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user data with limits
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if user has reached their limit
  if (userData.monthly_job_matches_used >= userData.monthly_job_matches_limit) {
    return NextResponse.json(
      {
        error: 'Monthly limit reached',
        limit: userData.monthly_job_matches_limit,
        used: userData.monthly_job_matches_used,
        subscription_tier: userData.subscription_tier
      },
      { status: 403 }
    );
  }

  try {
    // In a real implementation, this would call your Python API
    // For now, we'll create mock job matches
    const mockJobs = [
      {
        user_id: user.id,
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        salary_min: 140000,
        salary_max: 180000,
        job_type: 'Full-time',
        match_score: 92,
        key_matches: ['React', 'TypeScript', 'Node.js', 'Remote OK'],
        description: 'We are looking for a Senior Software Engineer to join our team...',
        url: 'https://example.com/job1',
        posted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: user.id,
        title: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        salary_min: 100000,
        salary_max: 140000,
        job_type: 'Full-time',
        match_score: 85,
        key_matches: ['Next.js', 'PostgreSQL', 'AWS', 'Startup Experience'],
        description: 'Join our fast-growing startup as a Full Stack Developer...',
        url: 'https://example.com/job2',
        posted_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Only add jobs up to the remaining limit
    const remainingLimit = userData.monthly_job_matches_limit - userData.monthly_job_matches_used;
    const jobsToAdd = mockJobs.slice(0, Math.min(remainingLimit, 2));

    // Insert the new job matches
    const { data: newJobs, error: jobError } = await supabase
      .from('jobs')
      .insert(jobsToAdd)
      .select();

    if (jobError) {
      throw jobError;
    }

    // Update user's usage count
    const { error: updateError } = await supabase
      .from('users')
      .update({
        monthly_job_matches_used: userData.monthly_job_matches_used + jobsToAdd.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      jobs: newJobs,
      usage: {
        used: userData.monthly_job_matches_used + jobsToAdd.length,
        limit: userData.monthly_job_matches_limit,
        remaining: userData.monthly_job_matches_limit - (userData.monthly_job_matches_used + jobsToAdd.length),
      },
    });
  } catch (error) {
    console.error('Error finding job matches:', error);
    return NextResponse.json(
      { error: 'Failed to find job matches' },
      { status: 500 }
    );
  }
}