/**
 * Mock Data Service
 * 
 * Handles seeding and clearing demo/mock data for new users.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { 
  MOCK_CLUB, 
  INITIAL_PLAYERS, 
  INITIAL_FIXTURES, 
  INITIAL_CONTENT, 
  INITIAL_SPONSORS 
} from '../types';
import { createPlayer } from './playerService';
import { createFixture } from './fixtureService';
import { createContentItem } from './contentService';
import { createSponsor } from './sponsorService';
import { createClub, getClub } from './clubService';
import { hasRealData, hasDemoData } from './dataPresenceService';

/**
 * Seed demo data for a new user
 * Creates a demo club with all mock data if the user has no real data
 */
export const seedDemoData = async (orgId: string): Promise<{ clubId: string; isNew: boolean }> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Check if org already has a demo club
    const { data: existingClubs } = await supabase
      .from(TABLES.CLUBS)
      .select('id, name, nickname')
      .eq('org_id', orgId);

    const demoClub = existingClubs?.find(
      c => c.name === MOCK_CLUB.name && c.nickname === MOCK_CLUB.nickname
    );

    let clubId: string;
    let isNew = false;

    if (demoClub) {
      // Use existing demo club
      clubId = demoClub.id;
    } else {
      // Create new demo club
      const newClub = await createClub(orgId, {
        name: MOCK_CLUB.name,
        nickname: MOCK_CLUB.nickname,
        slug: `${MOCK_CLUB.slug}-${orgId.slice(0, 8)}`,
        tone_context: MOCK_CLUB.tone_context,
        primary_color: MOCK_CLUB.primary_color,
        secondary_color: MOCK_CLUB.secondary_color,
      });
      clubId = newClub.id;
      isNew = true;
    }

    // Get the club to verify it exists
    const club = await getClub(clubId);
    if (!club) {
      throw new Error('Failed to create/retrieve demo club');
    }

    // Seed players
    const existingPlayers = await supabase
      .from(TABLES.PLAYERS)
      .select('id')
      .eq('club_id', clubId);
    
    if (!existingPlayers.data || existingPlayers.data.length === 0) {
      for (const player of INITIAL_PLAYERS) {
        await createPlayer(clubId, {
          name: player.name,
          position: player.position,
          number: player.number,
          is_captain: player.is_captain,
          stats: player.stats,
          form: player.form,
          analysis: player.analysis,
          narrative_tags: player.narrative_tags,
        });
      }
    }

    // Seed fixtures and track their IDs for content item mapping
    const existingFixtures = await supabase
      .from(TABLES.FIXTURES)
      .select('id, opponent, kickoff_time')
      .eq('club_id', clubId);
    
    const fixtureIdMap = new Map<string, string>(); // Maps mock fixture ID to real fixture ID
    
    if (!existingFixtures.data || existingFixtures.data.length === 0) {
      for (const fixture of INITIAL_FIXTURES) {
        const createdFixture = await createFixture(clubId, {
          opponent: fixture.opponent,
          kickoff_time: fixture.kickoff_time,
          status: fixture.status,
          result_home: fixture.result_home,
          result_away: fixture.result_away,
          key_events: fixture.key_events,
          scorers: fixture.scorers,
          man_of_the_match: fixture.man_of_the_match,
          stats: fixture.stats,
          venue: fixture.venue,
          competition: fixture.competition,
          attendance: fixture.attendance,
        });
        // Map by opponent + kickoff_time since mock IDs won't match
        const key = `${fixture.opponent}-${fixture.kickoff_time}`;
        fixtureIdMap.set(key, createdFixture.id);
      }
    } else {
      // Map existing fixtures
      for (const fixture of INITIAL_FIXTURES) {
        const existing = existingFixtures.data.find(
          f => f.opponent === fixture.opponent && 
          f.kickoff_time === fixture.kickoff_time
        );
        if (existing) {
          const key = `${fixture.opponent}-${fixture.kickoff_time}`;
          fixtureIdMap.set(key, existing.id);
        }
      }
    }

    // Seed content items with mapped fixture IDs
    const existingContent = await supabase
      .from(TABLES.CONTENT_ITEMS)
      .select('id')
      .eq('club_id', clubId);
    
    if (!existingContent.data || existingContent.data.length === 0) {
      for (const content of INITIAL_CONTENT) {
        // Find matching fixture ID by looking up the original fixture from INITIAL_FIXTURES
        let mappedFixtureId: string | undefined = undefined;
        if (content.fixture_id) {
          const originalFixture = INITIAL_FIXTURES.find(f => f.id === content.fixture_id);
          if (originalFixture) {
            const key = `${originalFixture.opponent}-${originalFixture.kickoff_time}`;
            mappedFixtureId = fixtureIdMap.get(key);
          }
        }
        
        await createContentItem(clubId, {
          fixture_id: mappedFixtureId,
          type: content.type,
          platform: content.platform,
          body: content.body,
          status: content.status,
          title: content.title,
        });
      }
    }

    // Seed sponsors
    const existingSponsors = await supabase
      .from(TABLES.SPONSORS)
      .select('id')
      .eq('club_id', clubId);
    
    if (!existingSponsors.data || existingSponsors.data.length === 0) {
      for (const sponsor of INITIAL_SPONSORS) {
        await createSponsor(clubId, {
          name: sponsor.name,
          sector: sponsor.sector,
          tier: sponsor.tier,
          value: sponsor.value,
          contract_end: sponsor.contract_end,
          status: sponsor.status,
          logo_initials: sponsor.logo_initials,
        });
      }
    }

    return { clubId, isNew };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
};

/**
 * Clear all demo data for a club
 * Deletes all fixtures, players, content items, and sponsors
 * Optionally deletes the club itself
 */
export const clearDemoData = async (
  clubId: string, 
  deleteClub: boolean = false
): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Verify it's demo data before clearing
    const isDemo = await hasDemoData(clubId);
    if (!isDemo) {
      throw new Error('Cannot clear non-demo data. This appears to be real user data.');
    }

    // Delete in order (respecting foreign key constraints)
    // Content items first (may reference fixtures)
    await supabase
      .from(TABLES.CONTENT_ITEMS)
      .delete()
      .eq('club_id', clubId);

    // Then fixtures
    await supabase
      .from(TABLES.FIXTURES)
      .delete()
      .eq('club_id', clubId);

    // Then players
    await supabase
      .from(TABLES.PLAYERS)
      .delete()
      .eq('club_id', clubId);

    // Then sponsors
    await supabase
      .from(TABLES.SPONSORS)
      .delete()
      .eq('club_id', clubId);

    // Optionally delete the club itself
    if (deleteClub) {
      await supabase
        .from(TABLES.CLUBS)
        .delete()
        .eq('id', clubId);
    }
  } catch (error) {
    console.error('Error clearing demo data:', error);
    throw error;
  }
};
