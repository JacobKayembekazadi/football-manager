/**
 * Fan Sentiment Service
 * 
 * Handles fan sentiment analysis data from Twitter via Apify.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { FanSentiment } from '../types';

/**
 * Get the latest fan sentiment snapshot for a club
 */
export const getLatestFanSentiment = async (clubId: string): Promise<FanSentiment | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Mock fallback - return current hardcoded value
    return {
      id: 'mock-sentiment',
      org_id: 'mock-org',
      club_id: clubId,
      sentiment_score: 92,
      sentiment_mood: 'euphoric',
      positive_count: 85,
      negative_count: 5,
      neutral_count: 10,
      total_mentions: 100,
      keywords_analyzed: [],
      data_source: 'mock',
      snapshot_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from(TABLES.FAN_SENTIMENT_SNAPSHOTS)
    .select('*')
    .eq('club_id', clubId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching fan sentiment:', error);
    throw error;
  }

  return data as FanSentiment | null;
};

/**
 * Refresh fan sentiment by triggering Edge Function
 * This calls the Apify integration to fetch new Twitter data
 */
export const refreshFanSentiment = async (
  clubId: string,
  clubName: string,
  orgId: string
): Promise<FanSentiment> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.functions.invoke('fan-sentiment', {
    body: { clubId, clubName, orgId },
  });

  if (error) {
    console.error('Error refreshing fan sentiment:', error);
    throw error;
  }

  return data as FanSentiment;
};

/**
 * Get sentiment history for a club (last N days)
 */
export const getSentimentHistory = async (
  clubId: string,
  days: number = 30
): Promise<FanSentiment[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from(TABLES.FAN_SENTIMENT_SNAPSHOTS)
    .select('*')
    .eq('club_id', clubId)
    .gte('snapshot_date', cutoffDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: false });

  if (error) {
    console.error('Error fetching sentiment history:', error);
    throw error;
  }

  return (data || []) as FanSentiment[];
};
