/**
 * Auth Service (Supabase Auth)
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

export const getSession = async () => {
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};

export const signInWithEmailPassword = async (email: string, password: string) => {
  if (!supabase || !isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithEmailPassword = async (email: string, password: string) => {
  if (!supabase || !isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  if (!supabase || !isSupabaseConfigured()) return;
  await supabase.auth.signOut();
};




