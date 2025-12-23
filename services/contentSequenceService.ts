import { inngest } from '../inngest/client';
import { Club, Fixture, ContentType } from '../types';

export async function scheduleContentSequence(
  club: Club,
  fixture: Fixture
): Promise<{ jobId: string }> {
  if (fixture.status !== 'SCHEDULED') {
    throw new Error('Can only schedule content for scheduled fixtures');
  }
  
  const kickoff = new Date(fixture.kickoff_time);
  const now = Date.now();
  const hoursUntilKickoff = (kickoff.getTime() - now) / (1000 * 60 * 60);
  
  // Generate all 3 assets immediately (background job)
  const eventId = await inngest.send({
    name: 'content/sequence.generate',
    data: {
      clubId: club.id,
      fixtureId: fixture.id,
      sequenceType: 'SOCIAL' as ContentType, // Countdown
      fixture,
      club,
    },
  });
  
  // Schedule T-24h countdown
  if (hoursUntilKickoff > 24) {
    const countdownTime = new Date(kickoff.getTime() - 24 * 60 * 60 * 1000);
    await inngest.send({
      name: 'content/sequence.generate',
      data: { 
        clubId: club.id, 
        fixtureId: fixture.id, 
        sequenceType: 'SOCIAL' as ContentType, 
        fixture, 
        club 
      },
      ts: Math.floor(countdownTime.getTime() / 1000),
    });
  }
  
  // Schedule T-1h lineup
  if (hoursUntilKickoff > 1) {
    const lineupTime = new Date(kickoff.getTime() - 60 * 60 * 1000);
    await inngest.send({
      name: 'content/sequence.generate',
      data: { 
        clubId: club.id, 
        fixtureId: fixture.id, 
        sequenceType: 'GRAPHIC_COPY' as ContentType, 
        fixture, 
        club 
      },
      ts: Math.floor(lineupTime.getTime() / 1000),
    });
  }
  
  return { jobId: eventId.ids[0] };
}

