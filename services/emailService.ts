/**
 * Email Service
 * 
 * Handles all inbox email-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { InboxEmail } from '../types';

/**
 * Get all emails for a club
 */
export const getEmails = async (clubId: string): Promise<InboxEmail[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .select('*')
    .eq('club_id', clubId)
    .order('received_at', { ascending: false });

  if (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }

  return (data || []).map(mapEmailFromDb);
};

/**
 * Get all emails for a specific connection (Master or My inbox)
 */
export const getEmailsForConnection = async (connectionId: string): Promise<InboxEmail[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .select('*')
    .eq('connection_id', connectionId)
    .order('received_at', { ascending: false });

  if (error) {
    console.error('Error fetching emails for connection:', error);
    throw error;
  }

  return (data || []).map(mapEmailFromDb);
};

/**
 * Get unread emails for a club
 */
export const getUnreadEmails = async (clubId: string): Promise<InboxEmail[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .select('*')
    .eq('club_id', clubId)
    .eq('is_read', false)
    .order('received_at', { ascending: false });

  if (error) {
    console.error('Error fetching unread emails:', error);
    throw error;
  }

  return (data || []).map(mapEmailFromDb);
};

/**
 * Get a single email by ID
 */
export const getEmail = async (emailId: string): Promise<InboxEmail | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .select('*')
    .eq('id', emailId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching email:', error);
    throw error;
  }

  return data ? mapEmailFromDb(data) : null;
};

/**
 * Create a new email
 */
export const createEmail = async (
  clubId: string,
  email: Omit<InboxEmail, 'id'>
): Promise<InboxEmail> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .insert({
      club_id: clubId,
      from_name: email.from,
      from_email: email.from_email,
      subject: email.subject,
      preview: email.preview,
      body: email.body,
      received_at: email.received_at,
      category: email.category,
      is_read: email.is_read || false,
      sentiment_score: null,
      sentiment_mood: null,
      reply_draft: null,
      sent_at: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating email:', error);
    throw error;
  }

  return mapEmailFromDb(data);
};

/**
 * Update an email
 */
export const updateEmail = async (
  emailId: string,
  updates: Partial<Omit<InboxEmail, 'id'>>
): Promise<InboxEmail> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updateData: any = {};

  if (updates.from !== undefined) updateData.from_name = updates.from;
  if (updates.from_email !== undefined) updateData.from_email = updates.from_email;
  if (updates.subject !== undefined) updateData.subject = updates.subject;
  if (updates.preview !== undefined) updateData.preview = updates.preview;
  if (updates.body !== undefined) updateData.body = updates.body;
  if (updates.received_at !== undefined) updateData.received_at = updates.received_at;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.is_read !== undefined) updateData.is_read = updates.is_read;

  // Handle sentiment (stored separately in DB)
  if ('sentiment_score' in updates) {
    updateData.sentiment_score = (updates as any).sentiment_score;
  }
  if ('sentiment_mood' in updates) {
    updateData.sentiment_mood = (updates as any).sentiment_mood;
  }
  if ('reply_draft' in updates) {
    updateData.reply_draft = (updates as any).reply_draft;
  }
  if ('sent_at' in updates) {
    updateData.sent_at = (updates as any).sent_at;
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .update(updateData)
    .eq('id', emailId)
    .select()
    .single();

  if (error) {
    console.error('Error updating email:', error);
    throw error;
  }

  return mapEmailFromDb(data);
};

/**
 * Mark email as read
 */
export const markEmailAsRead = async (emailId: string): Promise<InboxEmail> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  return updateEmail(emailId, { is_read: true });
};

/**
 * Save sentiment analysis for an email
 */
export const saveEmailSentiment = async (
  emailId: string,
  sentiment: { score: number; mood: string }
): Promise<InboxEmail> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .update({
      sentiment_score: sentiment.score,
      sentiment_mood: sentiment.mood,
    })
    .eq('id', emailId)
    .select()
    .single();

  if (error) {
    console.error('Error saving email sentiment:', error);
    throw error;
  }

  return mapEmailFromDb(data);
};

/**
 * Save reply draft for an email
 */
export const saveEmailReplyDraft = async (
  emailId: string,
  replyDraft: string
): Promise<InboxEmail> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .update({ reply_draft: replyDraft })
    .eq('id', emailId)
    .select()
    .single();

  if (error) {
    console.error('Error saving reply draft:', error);
    throw error;
  }

  return mapEmailFromDb(data);
};

/**
 * Mark email as sent
 */
export const markEmailAsSent = async (emailId: string): Promise<InboxEmail> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .update({ sent_at: new Date().toISOString() })
    .eq('id', emailId)
    .select()
    .single();

  if (error) {
    console.error('Error marking email as sent:', error);
    throw error;
  }

  return mapEmailFromDb(data);
};

/**
 * Delete an email
 */
export const deleteEmail = async (emailId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from(TABLES.INBOX_EMAILS)
    .delete()
    .eq('id', emailId);

  if (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for emails in a club
 */
export const subscribeToEmails = (
  clubId: string,
  callback: (emails: InboxEmail[]) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`emails:${clubId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.INBOX_EMAILS,
        filter: `club_id=eq.${clubId}`,
      },
      async () => {
        const emails = await getEmails(clubId);
        callback(emails);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map database row to InboxEmail type
 */
const mapEmailFromDb = (row: any): InboxEmail => ({
  id: row.id,
  from: row.from_name,
  from_email: row.from_email,
  subject: row.subject,
  preview: row.preview,
  body: row.body,
  received_at: row.received_at,
  category: row.category as 'League' | 'Sponsor' | 'Fan' | 'Media',
  is_read: row.is_read || false,
});
