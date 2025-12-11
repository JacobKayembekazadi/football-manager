/**
 * Club Service
 * 
 * Handles all club-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { Club } from '../types';

/**
 * Get a club by ID
 */
export const getClub = async (clubId: string): Promise<Club | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null; // Will use mock data
  }

  const { data, error } = await supabase
    .from(TABLES.CLUBS)
    .select('*')
    .eq('id', clubId)
    .single();

  if (error) {
    console.error('Error fetching club:', error);
    throw error;
  }

  if (!data) return null;

  // Fetch players for this club
  const players = await getPlayersForClub(clubId);

  return {
    id: data.id,
    name: data.name,
    nickname: data.nickname,
    slug: data.slug,
    tone_context: data.tone_context,
    primary_color: data.primary_color,
    secondary_color: data.secondary_color,
    players,
  };
};

/**
 * Get all clubs
 */
export const getClubs = async (): Promise<Club[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.CLUBS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clubs:', error);
    throw error;
  }

  // Fetch players for each club
  const clubsWithPlayers = await Promise.all(
    (data || []).map(async (club) => {
      const players = await getPlayersForClub(club.id);
      return {
        id: club.id,
        name: club.name,
        nickname: club.nickname,
        slug: club.slug,
        tone_context: club.tone_context,
        primary_color: club.primary_color,
        secondary_color: club.secondary_color,
        players,
      };
    })
  );

  return clubsWithPlayers;
};

/**
 * Create a new club
 */
export const createClub = async (club: Omit<Club, 'id' | 'players'>): Promise<Club> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.CLUBS)
    .insert({
      name: club.name,
      nickname: club.nickname,
      slug: club.slug,
      tone_context: club.tone_context,
      primary_color: club.primary_color,
      secondary_color: club.secondary_color,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating club:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    nickname: data.nickname,
    slug: data.slug,
    tone_context: data.tone_context,
    primary_color: data.primary_color,
    secondary_color: data.secondary_color,
    players: [],
  };
};

/**
 * Update a club
 */
export const updateClub = async (
  clubId: string,
  updates: Partial<Omit<Club, 'id' | 'players'>>
): Promise<Club> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.CLUBS)
    .update(updates)
    .eq('id', clubId)
    .select()
    .single();

  if (error) {
    console.error('Error updating club:', error);
    throw error;
  }

  const players = await getPlayersForClub(clubId);

  return {
    id: data.id,
    name: data.name,
    nickname: data.nickname,
    slug: data.slug,
    tone_context: data.tone_context,
    primary_color: data.primary_color,
    secondary_color: data.secondary_color,
    players,
  };
};

/**
 * Delete a club (cascades to all related data)
 */
export const deleteClub = async (clubId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from(TABLES.CLUBS)
    .delete()
    .eq('id', clubId);

  if (error) {
    console.error('Error deleting club:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for a club
 */
export const subscribeToClub = (
  clubId: string,
  callback: (club: Club | null) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {}; // Return empty unsubscribe function
  }

  const channel = supabase
    .channel(`club:${clubId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.CLUBS,
        filter: `id=eq.${clubId}`,
      },
      async () => {
        const club = await getClub(clubId);
        callback(club);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Helper function to get players for a club
const getPlayersForClub = async (clubId: string) => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .select('*')
    .eq('club_id', clubId)
    .order('number', { ascending: true });

  if (error) {
    console.error('Error fetching players:', error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position as 'GK' | 'DEF' | 'MID' | 'FWD',
    number: p.number,
    is_captain: p.is_captain || false,
    image_url: p.image_url,
    stats: p.stats,
    form: p.form,
    highlight_uri: p.highlight_uri,
    analysis: p.analysis,
  }));
};

