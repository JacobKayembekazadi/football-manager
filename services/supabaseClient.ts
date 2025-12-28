/**
 * Supabase Client Configuration
 * 
 * Initializes and exports the Supabase client for database operations.
 * This client is used throughout the application for all database interactions.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Helper function to check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Only warn once if credentials are missing
if (!isSupabaseConfigured()) {
  console.warn(
    'Supabase credentials not found. Running with mock data. To enable database persistence, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

/**
 * Supabase client instance
 * 
 * This client is configured to work with the PitchSide AI database schema.
 * Make sure to set up your Supabase project and run the schema.sql migration
 * before using this client.
 * 
 * @example
 * ```typescript
 * import { supabase } from './services/supabaseClient';
 * const { data, error } = await supabase.from('players').select('*');
 * ```
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Multi-tenant requires Supabase Auth + RLS, so we persist sessions.
        // (If you want a pure demo mode, simply omit env vars and supabase will be null.)
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Database table names
 * 
 * Centralized reference for all table names to avoid typos
 */
export const TABLES = {
  ORGS: 'orgs',
  ORG_MEMBERS: 'org_members',
  CLUBS: 'clubs',
  PLAYERS: 'players',
  FIXTURES: 'fixtures',
  CONTENT_ITEMS: 'content_items',
  SPONSORS: 'sponsors',
  ADMIN_TASKS: 'admin_tasks',
  EMAIL_CONNECTIONS: 'email_connections',
  INBOX_EMAILS: 'inbox_emails',
  AI_CONVERSATIONS: 'ai_conversations',
  AI_MESSAGES: 'ai_messages',
  ORG_AI_SETTINGS: 'org_ai_settings',
  CLUB_AI_SETTINGS: 'club_ai_settings',
  AI_USAGE_EVENTS: 'ai_usage_events',
  USER_ONBOARDING_STATE: 'user_onboarding_state',
  FAN_SENTIMENT_SNAPSHOTS: 'fan_sentiment_snapshots',
} as const;

