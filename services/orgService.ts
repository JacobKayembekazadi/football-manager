/**
 * Org (Workspace) Service
 *
 * Multi-tenant foundation:
 * - Users belong to orgs via org_members
 * - Orgs can have many clubs
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import type { Org, OrgMemberRole, OrgMember } from '../types';

export const getMyOrgs = async (): Promise<Org[]> => {
  if (!supabase || !isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from(TABLES.ORGS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Org[];
};

export const createOrg = async (name: string): Promise<Org> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const { data: org, error } = await supabase
    .from(TABLES.ORGS)
    .insert({ name, created_by: user.id })
    .select('*')
    .single();

  if (error) throw error;

  // Bootstrap membership (policy allows owner insert only when org has no members)
  const { error: memberErr } = await supabase
    .from(TABLES.ORG_MEMBERS)
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner' as OrgMemberRole,
    });

  if (memberErr) throw memberErr;

  return org as Org;
};

export const getOrgMembers = async (orgId: string): Promise<OrgMember[]> => {
  if (!supabase || !isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from(TABLES.ORG_MEMBERS)
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as OrgMember[];
};




