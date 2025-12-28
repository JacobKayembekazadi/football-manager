/**
 * Data Presence Service
 * 
 * Checks if a user has any real data in their database.
 * Used to determine if we should show mock/demo data.
 */

import { getFixtures } from './fixtureService';
import { getPlayers } from './playerService';
import { getContentItems } from './contentService';
import { getSponsors } from './sponsorService';
import { getClub } from './clubService';
import { isSupabaseConfigured } from './supabaseClient';

/**
 * Check if a club has any real data
 * Returns true if the club has at least one fixture, player, content item, or sponsor
 */
export const hasRealData = async (clubId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false; // No Supabase = no real data, use mocks
  }

  try {
    // Check if club exists and is not mock
    const club = await getClub(clubId);
    if (!club) {
      return false;
    }

    // Check if club has any real data
    const [fixtures, players, content, sponsors] = await Promise.all([
      getFixtures(clubId),
      getPlayers(clubId),
      getContentItems(clubId),
      getSponsors(clubId),
    ]);

    // If any category has data, user has real data
    return fixtures.length > 0 || players.length > 0 || content.length > 0 || sponsors.length > 0;
  } catch (error) {
    console.error('Error checking data presence:', error);
    return false; // On error, assume no data (will show mocks)
  }
};

/**
 * Check if a club has demo/mock data seeded
 * Demo data is identified by specific patterns (e.g., club name "Neon City FC")
 */
export const hasDemoData = async (clubId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false; // Can't have demo data if Supabase not configured
  }

  try {
    const club = await getClub(clubId);
    if (!club) {
      return false;
    }

    // Check for demo data markers
    // Demo club is "Neon City FC" with nickname "The Cyberpunks"
    const isDemoClub = club.name === 'Neon City FC' && club.nickname === 'The Cyberpunks';
    
    if (!isDemoClub) {
      return false;
    }

    // Further verify by checking if data matches mock patterns
    const [fixtures, players, content, sponsors] = await Promise.all([
      getFixtures(clubId),
      getPlayers(clubId),
      getContentItems(clubId),
      getSponsors(clubId),
    ]);

    // Check for demo data indicators
    const hasDemoFixtures = fixtures.some(f => 
      f.opponent === 'Phoenix Rising' || 
      f.opponent === 'Orbital United' ||
      f.opponent === 'NeoTextile Apparel'
    );

    const hasDemoPlayers = players.some(p => 
      p.name === 'Marcus Thorn' || 
      p.name === 'Viktor Volkov' ||
      p.name === 'Sam Miller'
    );

    const hasDemoSponsors = sponsors.some(s => 
      s.name === 'CyberDyne Systems' || 
      s.name === 'Orbital Energy Drinks'
    );

    return isDemoClub && (hasDemoFixtures || hasDemoPlayers || hasDemoSponsors);
  } catch (error) {
    console.error('Error checking demo data:', error);
    return false;
  }
};

