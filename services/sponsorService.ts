/**
 * Sponsor Service
 * 
 * Handles all sponsor-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { Sponsor } from '../types';

/**
 * Get all sponsors for a club
 */
export const getSponsors = async (clubId: string): Promise<Sponsor[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.SPONSORS)
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sponsors:', error);
    throw error;
  }

  return (data || []).map(mapSponsorFromDb);
};

/**
 * Get a single sponsor by ID
 */
export const getSponsor = async (sponsorId: string): Promise<Sponsor | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.SPONSORS)
    .select('*')
    .eq('id', sponsorId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching sponsor:', error);
    throw error;
  }

  return data ? mapSponsorFromDb(data) : null;
};

/**
 * Create a new sponsor
 */
export const createSponsor = async (
  clubId: string,
  sponsor: Omit<Sponsor, 'id'>
): Promise<Sponsor> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.SPONSORS)
    .insert({
      club_id: clubId,
      name: sponsor.name,
      sector: sponsor.sector,
      tier: sponsor.tier,
      value: sponsor.value,
      contract_end: sponsor.contract_end,
      status: sponsor.status,
      logo_initials: sponsor.logo_initials,
      generated_content: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating sponsor:', error);
    throw error;
  }

  return mapSponsorFromDb(data);
};

/**
 * Update a sponsor
 */
export const updateSponsor = async (
  sponsorId: string,
  updates: Partial<Omit<Sponsor, 'id'>>
): Promise<Sponsor> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updateData: any = {
    name: updates.name,
    sector: updates.sector,
    tier: updates.tier,
    value: updates.value,
    contract_end: updates.contract_end,
    status: updates.status,
    logo_initials: updates.logo_initials,
  };

  // Handle generated_content if provided
  if (updates.generated_content !== undefined) {
    updateData.generated_content = updates.generated_content;
  }

  const { data, error } = await supabase
    .from(TABLES.SPONSORS)
    .update(updateData)
    .eq('id', sponsorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating sponsor:', error);
    throw error;
  }

  return mapSponsorFromDb(data);
};

/**
 * Save generated content for a sponsor
 */
export const saveSponsorContent = async (
  sponsorId: string,
  content: { type: string; content: string }
): Promise<Sponsor> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  // Get current sponsor to merge content
  const sponsor = await getSponsor(sponsorId);
  if (!sponsor) {
    throw new Error('Sponsor not found');
  }

  const existingContent = (sponsor as any).generated_content || {};
  const updatedContent = {
    ...existingContent,
    [content.type]: {
      content: content.content,
      saved_at: new Date().toISOString(),
    },
  };

  return updateSponsor(sponsorId, {
    generated_content: updatedContent as any,
  });
};

/**
 * Delete a sponsor
 */
export const deleteSponsor = async (sponsorId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from(TABLES.SPONSORS)
    .delete()
    .eq('id', sponsorId);

  if (error) {
    console.error('Error deleting sponsor:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for sponsors in a club
 */
export const subscribeToSponsors = (
  clubId: string,
  callback: (sponsors: Sponsor[]) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`sponsors:${clubId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.SPONSORS,
        filter: `club_id=eq.${clubId}`,
      },
      async () => {
        const sponsors = await getSponsors(clubId);
        callback(sponsors);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map database row to Sponsor type
 */
const mapSponsorFromDb = (row: any): Sponsor => ({
  id: row.id,
  name: row.name,
  sector: row.sector,
  tier: row.tier as 'Platinum' | 'Gold' | 'Silver',
  value: row.value,
  contract_end: row.contract_end,
  status: row.status as 'Active' | 'Expiring' | 'Negotiating',
  logo_initials: row.logo_initials,
});
