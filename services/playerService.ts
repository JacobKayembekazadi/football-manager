/**
 * Player Service
 * 
 * Handles all player-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { Player, PlayerStats } from '../types';

/**
 * Get all players for a club
 */
export const getPlayers = async (clubId: string): Promise<Player[]> => {
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
    throw error;
  }

  return (data || []).map(mapPlayerFromDb);
};

/**
 * Get a single player by ID
 */
export const getPlayer = async (playerId: string): Promise<Player | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .select('*')
    .eq('id', playerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching player:', error);
    throw error;
  }

  return data ? mapPlayerFromDb(data) : null;
};

/**
 * Create a new player
 */
export const createPlayer = async (
  clubId: string,
  player: Omit<Player, 'id'>
): Promise<Player> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .insert({
      club_id: clubId,
      name: player.name,
      position: player.position,
      number: player.number,
      is_captain: player.is_captain || false,
      image_url: player.image_url,
      stats: player.stats,
      form: player.form,
      highlight_uri: player.highlight_uri,
      analysis: player.analysis,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating player:', error);
    throw error;
  }

  return mapPlayerFromDb(data);
};

/**
 * Update a player
 */
export const updatePlayer = async (
  playerId: string,
  updates: Partial<Omit<Player, 'id'>>
): Promise<Player> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.PLAYERS)
    .update({
      name: updates.name,
      position: updates.position,
      number: updates.number,
      is_captain: updates.is_captain,
      image_url: updates.image_url,
      stats: updates.stats,
      form: updates.form,
      highlight_uri: updates.highlight_uri,
      analysis: updates.analysis,
    })
    .eq('id', playerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating player:', error);
    throw error;
  }

  return mapPlayerFromDb(data);
};

/**
 * Delete a player
 */
export const deletePlayer = async (playerId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from(TABLES.PLAYERS)
    .delete()
    .eq('id', playerId);

  if (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for players in a club
 */
export const subscribeToPlayers = (
  clubId: string,
  callback: (players: Player[]) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`players:${clubId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.PLAYERS,
        filter: `club_id=eq.${clubId}`,
      },
      async () => {
        const players = await getPlayers(clubId);
        callback(players);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map database row to Player type
 */
const mapPlayerFromDb = (row: any): Player => ({
  id: row.id,
  name: row.name,
  position: row.position as 'GK' | 'DEF' | 'MID' | 'FWD',
  number: row.number,
  is_captain: row.is_captain || false,
  image_url: row.image_url,
  stats: row.stats as PlayerStats,
  form: row.form,
  highlight_uri: row.highlight_uri,
  analysis: row.analysis,
});
