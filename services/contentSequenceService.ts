import { Club, Fixture, ContentType } from '../types';

// Inngest is server-side only - this will be called via Edge Function in production
export async function scheduleContentSequence(
  club: Club,
  fixture: Fixture
): Promise<{ jobId: string }> {
  if (fixture.status !== 'SCHEDULED') {
    throw new Error('Can only schedule content for scheduled fixtures');
  }
  
  // TODO: Call Edge Function that handles Inngest scheduling server-side
  // For now, return a mock jobId - actual implementation should be in Edge Function
  const jobId = `job-${fixture.id}-${Date.now()}`;
  
  // In production, this should call an Edge Function that uses Inngest
  // const { data } = await supabase.functions.invoke('schedule-content-sequence', {
  //   body: { club, fixture }
  // });
  
  return { jobId };
}

