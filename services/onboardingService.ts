/**
 * Onboarding Service
 * 
 * Manages user onboarding state per org:
 * - Welcome modal completion
 * - Tour completion
 * - Education module progress
 * 
 * Data is stored in Supabase user_onboarding_state table with RLS.
 */

import { supabase, isSupabaseConfigured, TABLES } from './supabaseClient';

export interface OnboardingState {
  id: string;
  org_id: string;
  user_id: string;
  welcome_completed: boolean;
  tour_completed: boolean;
  completed_modules: string[];
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get onboarding state for current user in a specific org.
 * Returns null if no state exists yet.
 */
export const getOnboardingState = async (orgId: string): Promise<OnboardingState | null> => {
  if (!supabase || !isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use maybeSingle() to avoid 406 error when no rows exist
  const { data, error } = await supabase
    .from(TABLES.USER_ONBOARDING_STATE)
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching onboarding state:', error);
  }

  return data as OnboardingState | null;
};

/**
 * Initialize onboarding state for a user in an org.
 * Called when user first enters a workspace.
 */
export const initOnboardingState = async (orgId: string): Promise<OnboardingState | null> => {
  if (!supabase || !isSupabaseConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if state already exists
  const existing = await getOnboardingState(orgId);
  if (existing) {
    // Update last_seen_at
    await supabase
      .from(TABLES.USER_ONBOARDING_STATE)
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', existing.id);
    return existing;
  }

  // Create new state
  const { data, error } = await supabase
    .from(TABLES.USER_ONBOARDING_STATE)
    .insert({
      org_id: orgId,
      user_id: user.id,
      welcome_completed: false,
      tour_completed: false,
      completed_modules: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating onboarding state:', error);
    return null;
  }

  return data as OnboardingState;
};

/**
 * Mark welcome modal as completed.
 */
export const completeWelcome = async (orgId: string): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from(TABLES.USER_ONBOARDING_STATE)
    .update({ welcome_completed: true })
    .eq('org_id', orgId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error completing welcome:', error);
    return false;
  }

  return true;
};

/**
 * Mark tour as completed.
 */
export const completeTour = async (orgId: string): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from(TABLES.USER_ONBOARDING_STATE)
    .update({ tour_completed: true, welcome_completed: true })
    .eq('org_id', orgId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error completing tour:', error);
    return false;
  }

  return true;
};

/**
 * Mark an education module as completed.
 */
export const completeModule = async (orgId: string, moduleId: string): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get current state
  const state = await getOnboardingState(orgId);
  if (!state) return false;

  // Add module if not already completed
  const modules = state.completed_modules || [];
  if (modules.includes(moduleId)) return true;

  const { error } = await supabase
    .from(TABLES.USER_ONBOARDING_STATE)
    .update({ completed_modules: [...modules, moduleId] })
    .eq('org_id', orgId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error completing module:', error);
    return false;
  }

  return true;
};

/**
 * Unmark an education module (toggle off).
 */
export const uncompleteModule = async (orgId: string, moduleId: string): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const state = await getOnboardingState(orgId);
  if (!state) return false;

  const modules = (state.completed_modules || []).filter(m => m !== moduleId);

  const { error } = await supabase
    .from(TABLES.USER_ONBOARDING_STATE)
    .update({ completed_modules: modules })
    .eq('org_id', orgId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error uncompleting module:', error);
    return false;
  }

  return true;
};

/**
 * Check if user needs onboarding (hasn't completed welcome + tour).
 */
export const needsOnboarding = async (orgId: string): Promise<boolean> => {
  const state = await getOnboardingState(orgId);
  if (!state) return true; // New user
  return !state.welcome_completed;
};

/**
 * Reset onboarding state (for testing or re-showing tour).
 */
export const resetOnboarding = async (orgId: string): Promise<boolean> => {
  if (!supabase || !isSupabaseConfigured()) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from(TABLES.USER_ONBOARDING_STATE)
    .update({
      welcome_completed: false,
      tour_completed: false,
      completed_modules: [],
    })
    .eq('org_id', orgId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error resetting onboarding:', error);
    return false;
  }

  return true;
};

