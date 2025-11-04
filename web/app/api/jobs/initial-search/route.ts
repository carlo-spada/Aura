import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Update user's job search status
    await supabase
      .from('users')
      .update({
        job_search_status: 'processing',
        first_search_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // In a real implementation, this would trigger a background job
    // to search for jobs based on user's preferences and qualifications

    // For now, we'll create some initial mock job matches
    setTimeout(async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('preferences, qualifications, subscription_tier, monthly_job_matches_limit')
        .eq('id', user.id)
        .single();

      if (!userData) return;

      // Determine how many initial matches to create based on subscription
      const initialMatches = userData.subscription_tier === 'premium' ? 5 :
                            userData.subscription_tier === 'plus' ? 3 : 2;

      const mockJobs = [
        {
          user_id: user.id,
          title: 'Senior Software Engineer',
          company: 'TechCorp Solutions',
          location: userData.preferences?.location || 'San Francisco, CA',
          salary_min: 140000,
          salary_max: 180000,
          job_type: 'Full-time',
          match_score: 94,
          key_matches: ['Matches your skills', 'Great salary', 'Remote options'],
          description: 'Join our innovative team building next-generation solutions...',
          url: 'https://example.com/job/senior-engineer',
          posted_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: 'Full Stack Developer',
          company: 'StartupHub',
          location: 'Remote',
          salary_min: 100000,
          salary_max: 140000,
          job_type: 'Full-time',
          match_score: 88,
          key_matches: ['Startup environment', 'Growth opportunity', 'Flexible hours'],
          description: 'Be part of our growing startup revolutionizing the industry...',
          url: 'https://example.com/job/fullstack-dev',
          posted_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: 'Lead Developer',
          company: 'Enterprise Corp',
          location: userData.preferences?.location || 'New York, NY',
          salary_min: 150000,
          salary_max: 200000,
          job_type: 'Full-time',
          match_score: 91,
          key_matches: ['Leadership role', 'Enterprise scale', 'Great benefits'],
          description: 'Lead a team of talented developers in enterprise projects...',
          url: 'https://example.com/job/lead-dev',
          posted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: 'DevOps Engineer',
          company: 'CloudTech Inc',
          location: 'Hybrid',
          salary_min: 120000,
          salary_max: 160000,
          job_type: 'Full-time',
          match_score: 85,
          key_matches: ['Cloud expertise', 'Modern stack', 'Work-life balance'],
          description: 'Help us scale our cloud infrastructure to millions of users...',
          url: 'https://example.com/job/devops',
          posted_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          title: 'Software Architect',
          company: 'Innovation Labs',
          location: userData.preferences?.location || 'Austin, TX',
          salary_min: 160000,
          salary_max: 220000,
          job_type: 'Full-time',
          match_score: 92,
          key_matches: ['Architecture focus', 'Innovation driven', 'Tech leadership'],
          description: 'Design and architect cutting-edge software solutions...',
          url: 'https://example.com/job/architect',
          posted_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      // Insert initial job matches
      await supabase
        .from('jobs')
        .insert(mockJobs.slice(0, initialMatches));

      // Update user's usage and status
      await supabase
        .from('users')
        .update({
          monthly_job_matches_used: initialMatches,
          job_search_status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }, 5000); // Simulate processing delay

    return NextResponse.json({
      success: true,
      message: 'Job search initiated. You will be notified when matches are ready.'
    });
  } catch (error) {
    console.error('Error initiating job search:', error);
    return NextResponse.json(
      { error: 'Failed to initiate job search' },
      { status: 500 }
    );
  }
}