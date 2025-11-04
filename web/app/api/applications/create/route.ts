import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await request.json();

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  // Check if already applied
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .single();

  if (existingApplication) {
    return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 });
  }

  // Create application
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      job_id: jobId,
      status: 'pending',
      applied_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}