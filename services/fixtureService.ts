/**
 * Fixture Service
 *
 * Handles all fixture/match-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { Fixture, FixtureStatus, MatchStats, INITIAL_FIXTURES } from '../types';

// Demo storage key
const DEMO_FIXTURES_KEY = 'pitchside_demo_created_fixtures';

/**
 * Generate a demo UUID
 */
const generateDemoId = (): string => {
  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get demo-created fixtures from localStorage
 */
const getDemoCreatedFixtures = (): Fixture[] => {
  try {
    const stored = localStorage.getItem(DEMO_FIXTURES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save a demo fixture to localStorage
 */
const saveDemoFixture = (fixture: Fixture): void => {
  const existing = getDemoCreatedFixtures();
  existing.push(fixture);
  localStorage.setItem(DEMO_FIXTURES_KEY, JSON.stringify(existing));
};

/**
 * Delete a demo fixture from localStorage
 */
const deleteDemoFixture = (fixtureId: string): void => {
  const existing = getDemoCreatedFixtures();
  const filtered = existing.filter(f => f.id !== fixtureId);
  localStorage.setItem(DEMO_FIXTURES_KEY, JSON.stringify(filtered));
};

/**
 * Get all fixtures for a club
 */
export const getFixtures = async (clubId: string): Promise<Fixture[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: merge initial fixtures with user-created demo fixtures
    const demoCreated = getDemoCreatedFixtures();
    return [...INITIAL_FIXTURES, ...demoCreated].sort(
      (a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    );
  }

  const { data, error } = await supabase
    .from(TABLES.FIXTURES)
    .select('*')
    .eq('club_id', clubId)
    .order('kickoff_time', { ascending: true });

  if (error) {
    console.error('Error fetching fixtures:', error);
    throw error;
  }

  return (data || []).map(mapFixtureFromDb);
};

/**
 * Get fixtures by status
 */
export const getFixturesByStatus = async (
  clubId: string,
  status: FixtureStatus
): Promise<Fixture[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: filter by status from combined fixtures
    const allFixtures = [...INITIAL_FIXTURES, ...getDemoCreatedFixtures()];
    return allFixtures.filter(f => f.status === status);
  }

  const { data, error } = await supabase
    .from(TABLES.FIXTURES)
    .select('*')
    .eq('club_id', clubId)
    .eq('status', status)
    .order('kickoff_time', { ascending: true });

  if (error) {
    console.error('Error fetching fixtures by status:', error);
    throw error;
  }

  return (data || []).map(mapFixtureFromDb);
};

/**
 * Get a single fixture by ID
 */
export const getFixture = async (fixtureId: string): Promise<Fixture | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: check both initial and created fixtures
    const allFixtures = [...INITIAL_FIXTURES, ...getDemoCreatedFixtures()];
    return allFixtures.find(f => f.id === fixtureId) || null;
  }

  const { data, error } = await supabase
    .from(TABLES.FIXTURES)
    .select('*')
    .eq('id', fixtureId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching fixture:', error);
    throw error;
  }

  return data ? mapFixtureFromDb(data) : null;
};

/**
 * Create a new fixture
 */
export const createFixture = async (
  clubId: string,
  fixture: Omit<Fixture, 'id'>
): Promise<Fixture> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: create fixture in localStorage
    const newFixture: Fixture = {
      ...fixture,
      id: generateDemoId(),
      club_id: clubId,
    };
    saveDemoFixture(newFixture);
    return newFixture;
  }

  const { data, error } = await supabase
    .from(TABLES.FIXTURES)
    .insert({
      club_id: clubId,
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
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating fixture:', error);
    throw error;
  }

  return mapFixtureFromDb(data);
};

/**
 * Update a fixture
 */
export const updateFixture = async (
  fixtureId: string,
  updates: Partial<Omit<Fixture, 'id' | 'club_id'>>
): Promise<Fixture> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.FIXTURES)
    .update({
      opponent: updates.opponent,
      kickoff_time: updates.kickoff_time,
      status: updates.status,
      result_home: updates.result_home,
      result_away: updates.result_away,
      key_events: updates.key_events,
      scorers: updates.scorers,
      man_of_the_match: updates.man_of_the_match,
      stats: updates.stats,
      venue: updates.venue,
      competition: updates.competition,
      attendance: updates.attendance,
    })
    .eq('id', fixtureId)
    .select()
    .single();

  if (error) {
    console.error('Error updating fixture:', error);
    throw error;
  }

  return mapFixtureFromDb(data);
};

/**
 * Delete a fixture
 */
export const deleteFixture = async (fixtureId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: delete from localStorage (only works for user-created fixtures)
    deleteDemoFixture(fixtureId);
    return;
  }

  const { error } = await supabase
    .from(TABLES.FIXTURES)
    .delete()
    .eq('id', fixtureId);

  if (error) {
    console.error('Error deleting fixture:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for fixtures in a club
 */
export const subscribeToFixtures = (
  clubId: string,
  callback: (fixtures: Fixture[]) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`fixtures:${clubId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.FIXTURES,
        filter: `club_id=eq.${clubId}`,
      },
      async () => {
        const fixtures = await getFixtures(clubId);
        callback(fixtures);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map database row to Fixture type
 */
const mapFixtureFromDb = (row: any): Fixture => ({
  id: row.id,
  club_id: row.club_id,
  opponent: row.opponent,
  kickoff_time: row.kickoff_time,
  status: row.status as FixtureStatus,
  result_home: row.result_home,
  result_away: row.result_away,
  key_events: row.key_events,
  scorers: row.scorers || [],
  man_of_the_match: row.man_of_the_match,
  stats: row.stats as MatchStats | undefined,
  venue: row.venue as 'Home' | 'Away',
  competition: row.competition,
  attendance: row.attendance,
});
