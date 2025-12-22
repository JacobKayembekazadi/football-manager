/**
 * Conversation Service
 * 
 * Handles all AI conversation-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';

export interface Conversation {
  id: string;
  org_id?: string;
  club_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * Get all conversations for a club
 */
export const getConversations = async (clubId: string): Promise<Conversation[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.AI_CONVERSATIONS)
    .select('*')
    .eq('club_id', clubId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return (data || []).map(mapConversationFromDb);
};

/**
 * Get or create the latest conversation for a club
 */
export const getOrCreateLatestConversation = async (
  clubId: string
): Promise<Conversation | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  // Try to get the most recent conversation (use maybeSingle to avoid 406 on empty)
  const { data: existing, error: fetchError } = await supabase
    .from(TABLES.AI_CONVERSATIONS)
    .select('*')
    .eq('club_id', clubId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && !fetchError) {
    return mapConversationFromDb(existing);
  }

  // Create a new conversation if none exists
  return createConversation(clubId);
};

/**
 * Create a new conversation
 */
export const createConversation = async (clubId: string): Promise<Conversation | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.AI_CONVERSATIONS)
    .insert({
      club_id: clubId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return mapConversationFromDb(data);
};

/**
 * Get all messages for a conversation
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.AI_MESSAGES)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return (data || []).map(mapMessageFromDb);
};

/**
 * Add a message to a conversation
 */
export const addMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.AI_MESSAGES)
    .insert({
      conversation_id: conversationId,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding message:', error);
    throw error;
  }

  // Update conversation's updated_at timestamp
  await supabase
    .from(TABLES.AI_CONVERSATIONS)
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return mapMessageFromDb(data);
};

/**
 * Delete a conversation and all its messages
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    return;
  }

  const { error } = await supabase
    .from(TABLES.AI_CONVERSATIONS)
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for messages in a conversation
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.AI_MESSAGES,
        filter: `conversation_id=eq.${conversationId}`,
      },
      async () => {
        const messages = await getMessages(conversationId);
        callback(messages);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map database row to Conversation type
 */
const mapConversationFromDb = (row: any): Conversation => ({
  id: row.id,
  org_id: row.org_id,
  club_id: row.club_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/**
 * Map database row to Message type
 */
const mapMessageFromDb = (row: any): Message => ({
  id: row.id,
  conversation_id: row.conversation_id,
  role: row.role as 'user' | 'assistant',
  content: row.content,
  created_at: row.created_at,
});
