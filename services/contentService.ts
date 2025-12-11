/**
 * Content Service
 * 
 * Handles all content item-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { ContentItem, ContentType, ContentStatus } from '../types';

/**
 * Get all content items for a club
 */
export const getContentItems = async (clubId: string): Promise<ContentItem[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.CONTENT_ITEMS)
    .select('*')
    .eq('club_id', clubId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching content items:', error);
    throw error;
  }

  return (data || []).map(mapContentItemFromDb);
};

/**
 * Get content items by fixture
 */
export const getContentItemsByFixture = async (
  fixtureId: string
): Promise<ContentItem[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.CONTENT_ITEMS)
    .select('*')
    .eq('fixture_id', fixtureId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching content items by fixture:', error);
    throw error;
  }

  return (data || []).map(mapContentItemFromDb);
};

/**
 * Get content items by status
 */
export const getContentItemsByStatus = async (
  clubId: string,
  status: ContentStatus
): Promise<ContentItem[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.CONTENT_ITEMS)
    .select('*')
    .eq('club_id', clubId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching content items by status:', error);
    throw error;
  }

  return (data || []).map(mapContentItemFromDb);
};

/**
 * Get a single content item by ID
 */
export const getContentItem = async (contentId: string): Promise<ContentItem | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.CONTENT_ITEMS)
    .select('*')
    .eq('id', contentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching content item:', error);
    throw error;
  }

  return data ? mapContentItemFromDb(data) : null;
};

/**
 * Create a new content item
 */
export const createContentItem = async (
  clubId: string,
  content: Omit<ContentItem, 'id' | 'created_at'>
): Promise<ContentItem> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const insertData: any = {
    club_id: clubId,
    fixture_id: content.fixture_id || null,
    type: content.type,
    platform: content.platform || null,
    body: content.body,
    status: content.status,
    title: content.title || null,
  };

  // If status is PUBLISHED, set published_at
  if (content.status === 'PUBLISHED') {
    insertData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(TABLES.CONTENT_ITEMS)
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating content item:', error);
    throw error;
  }

  return mapContentItemFromDb(data);
};

/**
 * Update a content item
 */
export const updateContentItem = async (
  contentId: string,
  updates: Partial<Omit<ContentItem, 'id' | 'created_at' | 'club_id'>>
): Promise<ContentItem> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updateData: any = {
    fixture_id: updates.fixture_id,
    type: updates.type,
    platform: updates.platform,
    body: updates.body,
    status: updates.status,
    title: updates.title,
  };

  // If status changed to PUBLISHED, set published_at
  if (updates.status === 'PUBLISHED') {
    updateData.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from(TABLES.CONTENT_ITEMS)
    .update(updateData)
    .eq('id', contentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating content item:', error);
    throw error;
  }

  return mapContentItemFromDb(data);
};

/**
 * Delete a content item
 */
export const deleteContentItem = async (contentId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from(TABLES.CONTENT_ITEMS)
    .delete()
    .eq('id', contentId);

  if (error) {
    console.error('Error deleting content item:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for content items in a club
 */
export const subscribeToContentItems = (
  clubId: string,
  callback: (items: ContentItem[]) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`content_items:${clubId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.CONTENT_ITEMS,
        filter: `club_id=eq.${clubId}`,
      },
      async () => {
        const items = await getContentItems(clubId);
        callback(items);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map database row to ContentItem type
 */
const mapContentItemFromDb = (row: any): ContentItem => ({
  id: row.id,
  club_id: row.club_id,
  fixture_id: row.fixture_id,
  type: row.type as ContentType,
  platform: row.platform as 'Twitter' | 'Instagram' | 'Website' | 'Email' | undefined,
  body: row.body,
  status: row.status as ContentStatus,
  created_at: row.created_at,
  title: row.title,
});
