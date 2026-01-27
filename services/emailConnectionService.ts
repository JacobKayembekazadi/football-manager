/**
 * Email Connection Service
 *
 * Handles email OAuth connection management for Gmail/Outlook integration.
 * Supports both org-level (shared) and user-level (private) connections.
 */

import { supabase, isSupabaseConfigured, TABLES } from './supabaseClient';

export interface EmailConnection {
  id: string;
  org_id: string;
  club_id: string | null;
  owner_user_id: string;
  provider: 'gmail' | 'outlook';
  email_address: string;
  visibility: 'shared' | 'private';
  is_master: boolean;
  status: 'active' | 'expired' | 'error';
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * List all email connections for an organization
 *
 * @param orgId - Organization ID
 * @param clubId - Optional club ID to filter by
 * @returns Array of email connections visible to the user
 */
export const listEmailConnections = async (
  orgId: string,
  clubId?: string
): Promise<EmailConnection[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    let query = supabase
      .from(TABLES.EMAIL_CONNECTIONS)
      .select('*')
      .eq('org_id', orgId);

    if (clubId) {
      // Include club-specific and org-level (null club_id) connections
      query = query.or(`club_id.eq.${clubId},club_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing email connections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error listing email connections:', error);
    return [];
  }
};

/**
 * Find the master email connection for sending
 *
 * Precedence:
 * 1. Club-level master connection (club_id = provided)
 * 2. Org-level master connection (club_id = null)
 *
 * @param orgId - Organization ID
 * @param clubId - Optional club ID
 * @returns Master connection or null if none found
 */
export const findMasterConnection = async (
  orgId: string,
  clubId?: string
): Promise<EmailConnection | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // First, try to find club-level master
    if (clubId) {
      const { data: clubMaster, error: clubError } = await supabase
        .from(TABLES.EMAIL_CONNECTIONS)
        .select('*')
        .eq('org_id', orgId)
        .eq('club_id', clubId)
        .eq('is_master', true)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (clubError) {
        console.error('Error finding club master connection:', clubError);
      }

      if (clubMaster) {
        return clubMaster;
      }
    }

    // Fall back to org-level master
    const { data: orgMaster, error: orgError } = await supabase
      .from(TABLES.EMAIL_CONNECTIONS)
      .select('*')
      .eq('org_id', orgId)
      .is('club_id', null)
      .eq('is_master', true)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (orgError) {
      console.error('Error finding org master connection:', orgError);
      return null;
    }

    return orgMaster;
  } catch (error) {
    console.error('Error finding master connection:', error);
    return null;
  }
};

/**
 * Find the current user's email connection
 *
 * @param orgId - Organization ID
 * @param clubId - Optional club ID
 * @returns User's connection or null if none found
 */
export const findMyConnection = async (
  orgId: string,
  clubId?: string
): Promise<EmailConnection | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    let query = supabase
      .from(TABLES.EMAIL_CONNECTIONS)
      .select('*')
      .eq('org_id', orgId)
      .eq('owner_user_id', user.id);

    if (clubId) {
      query = query.eq('club_id', clubId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error finding user connection:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error finding user connection:', error);
    return null;
  }
};

/**
 * Create a new email connection
 *
 * @param connection - Connection data
 * @returns Created connection or null on error
 */
export const createEmailConnection = async (
  connection: Omit<EmailConnection, 'id' | 'created_at' | 'updated_at'>
): Promise<EmailConnection | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.EMAIL_CONNECTIONS)
      .insert(connection)
      .select()
      .single();

    if (error) {
      console.error('Error creating email connection:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating email connection:', error);
    return null;
  }
};

/**
 * Update an email connection
 *
 * @param connectionId - Connection ID
 * @param updates - Fields to update
 * @returns Updated connection or null on error
 */
export const updateEmailConnection = async (
  connectionId: string,
  updates: Partial<Pick<EmailConnection, 'is_master' | 'status' | 'last_synced_at'>>
): Promise<EmailConnection | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.EMAIL_CONNECTIONS)
      .update(updates)
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating email connection:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating email connection:', error);
    return null;
  }
};

/**
 * Delete an email connection
 *
 * @param connectionId - Connection ID
 * @returns True if deleted, false on error
 */
export const deleteEmailConnection = async (
  connectionId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from(TABLES.EMAIL_CONNECTIONS)
      .delete()
      .eq('id', connectionId);

    if (error) {
      console.error('Error deleting email connection:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting email connection:', error);
    return false;
  }
};
