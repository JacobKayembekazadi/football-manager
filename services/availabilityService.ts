/**
 * Player Availability Service
 *
 * Handles player availability tracking per fixture.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { PlayerAvailability, AvailabilityStatus, Player } from '../types';
import {
  getDemoAvailability,
  initializeDemoAvailability,
  setDemoPlayerAvailability,
} from './demoStorageService';

// Extended type with player info
export interface PlayerAvailabilityWithPlayer extends PlayerAvailability {
  player?: Player;
}

/**
 * Get availability for a fixture
 */
export const getAvailabilityForFixture = async (
  fixtureId: string
): Promise<PlayerAvailability[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return getDemoAvailability(fixtureId);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .select('*')
      .eq('fixture_id', fixtureId);

    if (error) {
      console.error('Error fetching availability, falling back to demo:', error);
      return getDemoAvailability(fixtureId);
    }

    return (data || []).map(mapAvailabilityFromDb);
  } catch (error) {
    console.error('Error fetching availability, falling back to demo:', error);
    return getDemoAvailability(fixtureId);
  }
};

/**
 * Get availability for a fixture with player details
 */
export const getAvailabilityWithPlayers = async (
  fixtureId: string
): Promise<PlayerAvailabilityWithPlayer[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return getDemoAvailability(fixtureId);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .select(`
        *,
        player:players(*)
      `)
      .eq('fixture_id', fixtureId);

    if (error) {
      console.error('Error fetching availability with players, falling back to demo:', error);
      return getDemoAvailability(fixtureId);
    }

    return (data || []).map(row => ({
      ...mapAvailabilityFromDb(row),
      player: row.player,
    }));
  } catch (error) {
    console.error('Error fetching availability with players, falling back to demo:', error);
    return getDemoAvailability(fixtureId);
  }
};

/**
 * Get availability summary for a fixture
 */
export const getAvailabilitySummary = async (
  fixtureId: string
): Promise<{
  available: number;
  unavailable: number;
  maybe: number;
  injured: number;
  no_response: number;
  total: number;
}> => {
  const availability = await getAvailabilityForFixture(fixtureId);

  return {
    available: availability.filter(a => a.status === 'available').length,
    unavailable: availability.filter(a => a.status === 'unavailable').length,
    maybe: availability.filter(a => a.status === 'maybe').length,
    injured: availability.filter(a => a.status === 'injured').length,
    no_response: availability.filter(a => a.status === 'no_response').length,
    total: availability.length,
  };
};

/**
 * Initialize availability records for all players in a fixture
 */
export const initializeAvailability = async (
  clubId: string,
  fixtureId: string,
  playerIds: string[]
): Promise<PlayerAvailability[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return initializeDemoAvailability(clubId, fixtureId, playerIds);
  }

  if (playerIds.length === 0) {
    return [];
  }

  try {
    // Check for existing records
    const { data: existing, error: checkError } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .select('player_id')
      .eq('fixture_id', fixtureId);

    if (checkError) {
      console.error('Error checking existing availability, falling back to demo:', checkError);
      return initializeDemoAvailability(clubId, fixtureId, playerIds);
    }

    const existingPlayerIds = new Set((existing || []).map(e => e.player_id));
    const newPlayerIds = playerIds.filter(id => !existingPlayerIds.has(id));

    if (newPlayerIds.length === 0) {
      return getAvailabilityForFixture(fixtureId);
    }

    const records = newPlayerIds.map(playerId => ({
      club_id: clubId,
      fixture_id: fixtureId,
      player_id: playerId,
      status: 'no_response' as AvailabilityStatus,
    }));

    const { data, error } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .insert(records)
      .select();

    if (error) {
      console.error('Error initializing availability, falling back to demo:', error);
      return initializeDemoAvailability(clubId, fixtureId, playerIds);
    }

    return (data || []).map(mapAvailabilityFromDb);
  } catch (error) {
    console.error('Error initializing availability, falling back to demo:', error);
    return initializeDemoAvailability(clubId, fixtureId, playerIds);
  }
};

/**
 * Set player availability status
 */
export const setPlayerAvailability = async (
  clubId: string,
  fixtureId: string,
  playerId: string,
  status: AvailabilityStatus,
  note?: string,
  markedBy?: string
): Promise<PlayerAvailability> => {
  if (!supabase || !isSupabaseConfigured()) {
    return setDemoPlayerAvailability(clubId, fixtureId, playerId, status, note);
  }

  try {
    // Upsert - create or update
    const { data, error } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .upsert({
        club_id: clubId,
        fixture_id: fixtureId,
        player_id: playerId,
        status,
        response_note: note,
        responded_at: new Date().toISOString(),
        marked_by: markedBy,
      }, {
        onConflict: 'player_id,fixture_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error setting availability, falling back to demo:', error);
      return setDemoPlayerAvailability(clubId, fixtureId, playerId, status, note);
    }

    return mapAvailabilityFromDb(data);
  } catch (error) {
    console.error('Error setting availability, falling back to demo:', error);
    return setDemoPlayerAvailability(clubId, fixtureId, playerId, status, note);
  }
};

/**
 * Bulk update availability for multiple players
 */
export const bulkSetAvailability = async (
  clubId: string,
  fixtureId: string,
  updates: Array<{ playerId: string; status: AvailabilityStatus; note?: string }>,
  markedBy?: string
): Promise<PlayerAvailability[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: update each player individually
    return Promise.all(
      updates.map(u =>
        setDemoPlayerAvailability(clubId, fixtureId, u.playerId, u.status, u.note)
      )
    );
  }

  if (updates.length === 0) {
    return [];
  }

  try {
    const records = updates.map(u => ({
      club_id: clubId,
      fixture_id: fixtureId,
      player_id: u.playerId,
      status: u.status,
      response_note: u.note,
      responded_at: new Date().toISOString(),
      marked_by: markedBy,
    }));

    const { data, error } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .upsert(records, {
        onConflict: 'player_id,fixture_id',
      })
      .select();

    if (error) {
      console.error('Error bulk setting availability, falling back to demo:', error);
      return Promise.all(
        updates.map(u =>
          setDemoPlayerAvailability(clubId, fixtureId, u.playerId, u.status, u.note)
        )
      );
    }

    return (data || []).map(mapAvailabilityFromDb);
  } catch (error) {
    console.error('Error bulk setting availability, falling back to demo:', error);
    return Promise.all(
      updates.map(u =>
        setDemoPlayerAvailability(clubId, fixtureId, u.playerId, u.status, u.note)
      )
    );
  }
};

/**
 * Clear availability for a fixture (for re-initialization)
 */
export const clearAvailability = async (fixtureId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: remove all availability for this fixture
    const allKey = 'pitchside_demo_availability';
    try {
      const all: PlayerAvailability[] = JSON.parse(localStorage.getItem(allKey) || '[]');
      const filtered = all.filter(a => a.fixture_id !== fixtureId);
      localStorage.setItem(allKey, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
    return;
  }

  try {
    const { error } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .delete()
      .eq('fixture_id', fixtureId);

    if (error) {
      console.error('Error clearing availability:', error);
      // Fall back to demo mode clearing
      const allKey = 'pitchside_demo_availability';
      try {
        const all: PlayerAvailability[] = JSON.parse(localStorage.getItem(allKey) || '[]');
        const filtered = all.filter(a => a.fixture_id !== fixtureId);
        localStorage.setItem(allKey, JSON.stringify(filtered));
      } catch {
        // Ignore
      }
    }
  } catch (error) {
    console.error('Error clearing availability:', error);
  }
};

/**
 * Get players who haven't responded for a fixture
 */
export const getNonResponders = async (fixtureId: string): Promise<PlayerAvailability[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    const all = getDemoAvailability(fixtureId);
    return all.filter(a => a.status === 'no_response');
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PLAYER_AVAILABILITY)
      .select('*')
      .eq('fixture_id', fixtureId)
      .eq('status', 'no_response');

    if (error) {
      console.error('Error fetching non-responders, falling back to demo:', error);
      const all = getDemoAvailability(fixtureId);
      return all.filter(a => a.status === 'no_response');
    }

    return (data || []).map(mapAvailabilityFromDb);
  } catch (error) {
    console.error('Error fetching non-responders, falling back to demo:', error);
    const all = getDemoAvailability(fixtureId);
    return all.filter(a => a.status === 'no_response');
  }
};

// ============================================================================
// Mapper
// ============================================================================

const mapAvailabilityFromDb = (row: any): PlayerAvailability => ({
  id: row.id,
  club_id: row.club_id,
  player_id: row.player_id,
  fixture_id: row.fixture_id,
  status: row.status as AvailabilityStatus,
  response_note: row.response_note,
  responded_at: row.responded_at,
  marked_by: row.marked_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});
