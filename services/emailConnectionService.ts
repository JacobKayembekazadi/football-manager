/**
 * Email Connection Service (client-side)
 *
 * Uses RLS; connections are private (owner-only) or shared (org members).
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { EmailConnection, EmailProvider } from '../types';

export const listEmailConnections = async (orgId: string, clubId?: string | null): Promise<EmailConnection[]> => {
  if (!supabase || !isSupabaseConfigured()) return [];

  let q = supabase.from('email_connections').select('*').eq('org_id', orgId);
  if (clubId !== undefined) {
    // include both org-level (null) and club-level (clubId) connections
    q = q.or(`club_id.is.null,club_id.eq.${clubId}`);
  }
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as EmailConnection[];
};

export const findMasterConnection = async (orgId: string, clubId: string, provider?: EmailProvider): Promise<EmailConnection | null> => {
  if (!supabase || !isSupabaseConfigured()) return null;

  // Club master first
  let q1 = supabase
    .from('email_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('visibility', 'shared')
    .eq('is_master', true)
    .eq('club_id', clubId)
    .limit(1)
    .maybeSingle();
  if (provider) q1 = q1.eq('provider', provider);
  const { data: clubMaster, error: err1 } = await q1;
  if (err1) throw err1;
  if (clubMaster) return clubMaster as EmailConnection;

  // Org master fallback
  let q2 = supabase
    .from('email_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('visibility', 'shared')
    .eq('is_master', true)
    .is('club_id', null)
    .limit(1)
    .maybeSingle();
  if (provider) q2 = q2.eq('provider', provider);
  const { data: orgMaster, error: err2 } = await q2;
  if (err2) throw err2;
  return (orgMaster as EmailConnection) ?? null;
};

export const findMyConnection = async (orgId: string, clubId: string, provider?: EmailProvider): Promise<EmailConnection | null> => {
  if (!supabase || !isSupabaseConfigured()) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  // Prefer club-scoped private
  let q1 = supabase
    .from('email_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('visibility', 'private')
    .eq('owner_user_id', userId)
    .eq('club_id', clubId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (provider) q1 = q1.eq('provider', provider);
  const { data: clubConn, error: err1 } = await q1;
  if (err1) throw err1;
  if (clubConn) return clubConn as EmailConnection;

  // Org-scoped private
  let q2 = supabase
    .from('email_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('visibility', 'private')
    .eq('owner_user_id', userId)
    .is('club_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (provider) q2 = q2.eq('provider', provider);
  const { data: orgConn, error: err2 } = await q2;
  if (err2) throw err2;
  return (orgConn as EmailConnection) ?? null;
};

export const startEmailOAuth = async (args: {
  provider: EmailProvider;
  orgId: string;
  clubId?: string | null;
  visibility: 'private' | 'shared';
  isMaster: boolean;
  returnTo?: string;
}): Promise<string> => {
  if (!supabase || !isSupabaseConfigured()) throw new Error('Supabase not configured');
  const redirectUri = `${window.location.origin}/`;
  const { data, error } = await supabase.functions.invoke('email-oauth-start', {
    body: { ...args, redirectUri },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.url as string;
};

export const syncEmailConnection = async (connectionId: string, clubId?: string | null): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase.functions.invoke('email-sync', {
    body: { connectionId, clubId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};

export const sendReplyForEmail = async (emailId: string, replyContent: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase.functions.invoke('email-send', {
    body: { emailId, replyContent },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};




