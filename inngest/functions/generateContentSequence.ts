import { inngest } from '../client';
import { generateContent } from '../../services/geminiService';
import { createContentItem } from '../../services/contentService';
import { Club, Fixture, ContentType } from '../../types';

interface ContentSequenceEvent {
  name: 'content/sequence.generate';
  data: {
    clubId: string;
    fixtureId: string;
    sequenceType: ContentType;
    fixture: Fixture;
    club: Club;
  };
}

export const generateContentSequence = inngest.createFunction(
  { id: 'generate-content-sequence' },
  { event: 'content/sequence.generate' },
  async ({ event, step }) => {
    const { clubId, fixtureId, sequenceType, fixture, club } = event.data;
    
    // Generate content (with retries)
    const content = await step.run('generate-content', async () => {
      const contentText = await generateContent(club, fixture, sequenceType);
      return contentText;
    });
    
    // Save to database
    await step.run('save-content', async () => {
      await createContentItem(clubId, {
        club_id: clubId,
        fixture_id: fixtureId,
        type: sequenceType,
        platform: 'Twitter',
        body: content,
        status: 'DRAFT',
      });
    });
    
    return { success: true, contentId: fixtureId };
  }
);

