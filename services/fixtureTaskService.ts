/**
 * Fixture Task Service
 *
 * Handles fixture tasks and template packs for matchday checklists.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { FixtureTask, TemplatePack, TemplateTask, DEFAULT_TEMPLATE_PACKS, ClubRoleName, ClubUser } from '../types';
import {
  getDemoFixtureTasks,
  saveDemoFixtureTask,
  deleteDemoFixtureTask,
  generateDemoTasksFromTemplates,
  getDemoEnabledTemplatePacks,
  toggleDemoTemplatePack,
  generateDemoId,
} from './demoStorageService';
import { getClubUsers } from './userService';

// ============================================================================
// Template Packs
// ============================================================================

/**
 * Get all template packs for a club
 */
export const getTemplatePacks = async (clubId: string): Promise<TemplatePack[]> => {
  // Return demo data for demo mode
  const getDemoTemplatePacks = () => {
    const enabledIds = getDemoEnabledTemplatePacks();
    return DEFAULT_TEMPLATE_PACKS.map((pack, i) => ({
      ...pack,
      id: `demo-pack-${i}`,
      club_id: clubId,
      is_enabled: enabledIds.includes(`demo-pack-${i}`),
    }));
  };

  if (!supabase || !isSupabaseConfigured()) {
    return getDemoTemplatePacks();
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.TEMPLATE_PACKS)
      .select('*')
      .eq('club_id', clubId)
      .order('name');

    if (error) {
      console.error('Error fetching template packs, falling back to demo:', error);
      return getDemoTemplatePacks();
    }

    // If no data in Supabase, return demo packs
    if (!data || data.length === 0) {
      return getDemoTemplatePacks();
    }

    return data.map(mapTemplatePackFromDb);
  } catch (error) {
    console.error('Error fetching template packs, falling back to demo:', error);
    return getDemoTemplatePacks();
  }
};

/**
 * Initialize default template packs for a new club
 */
export const initializeDefaultPacks = async (clubId: string): Promise<TemplatePack[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const packs = DEFAULT_TEMPLATE_PACKS.map(pack => ({
    club_id: clubId,
    name: pack.name,
    description: pack.description,
    is_enabled: pack.is_enabled,
    tasks: pack.tasks,
  }));

  const { data, error } = await supabase
    .from(TABLES.TEMPLATE_PACKS)
    .insert(packs)
    .select();

  if (error) {
    console.error('Error initializing template packs:', error);
    throw error;
  }

  return (data || []).map(mapTemplatePackFromDb);
};

/**
 * Update a template pack (toggle enabled, update tasks)
 */
export const updateTemplatePack = async (
  packId: string,
  updates: Partial<Omit<TemplatePack, 'id' | 'club_id'>>
): Promise<TemplatePack> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: toggle enabled state in localStorage
    if (updates.is_enabled !== undefined) {
      toggleDemoTemplatePack(packId);
    }
    // Return updated pack
    const idx = parseInt(packId.replace('demo-pack-', ''));
    const enabledIds = getDemoEnabledTemplatePacks();
    return {
      ...DEFAULT_TEMPLATE_PACKS[idx],
      id: packId,
      club_id: 'demo',
      is_enabled: enabledIds.includes(packId),
    };
  }

  const { data, error } = await supabase
    .from(TABLES.TEMPLATE_PACKS)
    .update({
      name: updates.name,
      description: updates.description,
      is_enabled: updates.is_enabled,
      tasks: updates.tasks,
    })
    .eq('id', packId)
    .select()
    .single();

  if (error) {
    console.error('Error updating template pack:', error);
    throw error;
  }

  return mapTemplatePackFromDb(data);
};

/**
 * Create a custom template pack
 */
export const createTemplatePack = async (
  clubId: string,
  pack: Omit<TemplatePack, 'id' | 'club_id'>
): Promise<TemplatePack> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.TEMPLATE_PACKS)
    .insert({
      club_id: clubId,
      name: pack.name,
      description: pack.description,
      is_enabled: pack.is_enabled,
      tasks: pack.tasks,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating template pack:', error);
    throw error;
  }

  return mapTemplatePackFromDb(data);
};

/**
 * Delete a template pack
 */
export const deleteTemplatePack = async (packId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from(TABLES.TEMPLATE_PACKS)
    .delete()
    .eq('id', packId);

  if (error) {
    console.error('Error deleting template pack:', error);
    throw error;
  }
};

// ============================================================================
// Fixture Tasks
// ============================================================================

/**
 * Get all tasks for a fixture (for Dashboard - validates club ownership)
 */
export const getFixtureTasksForFixture = async (clubId: string, fixtureId: string): Promise<FixtureTask[]> => {
  const tasks = await getFixtureTasks(fixtureId);
  // Filter by club_id to ensure we only return tasks for this club
  return tasks.filter(t => t.club_id === clubId);
};

/**
 * Get all tasks for a fixture
 */
export const getFixtureTasks = async (fixtureId: string): Promise<FixtureTask[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return getDemoFixtureTasks(fixtureId);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.FIXTURE_TASKS)
      .select('*')
      .eq('fixture_id', fixtureId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching fixture tasks, falling back to demo:', error);
      return getDemoFixtureTasks(fixtureId);
    }

    return (data || []).map(mapFixtureTaskFromDb);
  } catch (error) {
    console.error('Error fetching fixture tasks, falling back to demo:', error);
    return getDemoFixtureTasks(fixtureId);
  }
};

/**
 * Get all tasks for multiple fixtures
 */
export const getTasksForFixtures = async (fixtureIds: string[]): Promise<FixtureTask[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return fixtureIds.flatMap(id => getDemoFixtureTasks(id));
  }

  if (fixtureIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.FIXTURE_TASKS)
      .select('*')
      .in('fixture_id', fixtureIds)
      .order('sort_order');

    if (error) {
      console.error('Error fetching fixture tasks, falling back to demo:', error);
      return fixtureIds.flatMap(id => getDemoFixtureTasks(id));
    }

    return (data || []).map(mapFixtureTaskFromDb);
  } catch (error) {
    console.error('Error fetching fixture tasks, falling back to demo:', error);
    return fixtureIds.flatMap(id => getDemoFixtureTasks(id));
  }
};

/**
 * Phase 4: Find first available user with a specific primary role
 */
const findUserByRole = (users: ClubUser[], roleName: ClubRoleName): ClubUser | undefined => {
  return users.find(u =>
    u.status === 'active' &&
    u.primary_role?.name === roleName
  );
};

/**
 * Phase 4: Calculate due date based on offset hours from kickoff
 */
const calculateDueDate = (kickoffTime: string, offsetHours?: number): string | undefined => {
  if (offsetHours === undefined) return undefined;
  const kickoff = new Date(kickoffTime);
  kickoff.setHours(kickoff.getHours() + offsetHours);
  return kickoff.toISOString();
};

/**
 * Generate tasks for a fixture from enabled templates
 * Phase 4: Now supports auto-assignment based on default roles
 */
export const generateTasksFromTemplates = async (
  clubId: string,
  fixtureId: string,
  venue: 'Home' | 'Away',
  kickoffTime?: string
): Promise<FixtureTask[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return generateDemoTasksFromTemplates(clubId, fixtureId, venue, kickoffTime);
  }

  // Get enabled template packs
  const packs = await getTemplatePacks(clubId);
  const enabledPacks = packs.filter(p => p.is_enabled);

  // Phase 4: Filter packs based on auto_apply setting and venue
  const relevantPacks = enabledPacks.filter(p => {
    // Check auto_apply setting first
    if (p.auto_apply === 'never') return false;
    if (p.auto_apply === 'home' && venue !== 'Home') return false;
    if (p.auto_apply === 'away' && venue !== 'Away') return false;
    // 'always' applies to both

    // Legacy: Also check name for backwards compatibility
    const nameLower = p.name.toLowerCase();
    if (nameLower.includes('(home)') && venue !== 'Home' && !p.auto_apply) return false;
    if (nameLower.includes('(away)') && venue !== 'Away' && !p.auto_apply) return false;
    return true;
  });

  // Phase 4: Get club users for auto-assignment
  const users = await getClubUsers(clubId);

  // Collect all tasks from relevant packs with auto-assignment
  const tasksToCreate: Array<{
    club_id: string;
    fixture_id: string;
    template_pack_id: string;
    label: string;
    is_completed: boolean;
    sort_order: number;
    owner_user_id?: string;
    owner_role?: string;
    due_at?: string;
  }> = [];

  let sortOrder = 0;
  for (const pack of relevantPacks) {
    for (const task of pack.tasks) {
      // Phase 4: Determine owner role (task-level overrides pack-level)
      const ownerRole = task.default_owner_role || pack.default_owner_role;

      // Phase 4: Find user with matching primary role for auto-assignment
      const assignedUser = ownerRole ? findUserByRole(users, ownerRole) : undefined;

      // Phase 4: Calculate due date if kickoff time and offset provided
      const dueAt = kickoffTime ? calculateDueDate(kickoffTime, task.offset_hours) : undefined;

      tasksToCreate.push({
        club_id: clubId,
        fixture_id: fixtureId,
        template_pack_id: pack.id,
        label: task.label,
        is_completed: false,
        sort_order: sortOrder++,
        owner_user_id: assignedUser?.id,
        owner_role: ownerRole,
        due_at: dueAt,
      });
    }
  }

  if (tasksToCreate.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.FIXTURE_TASKS)
    .insert(tasksToCreate)
    .select();

  if (error) {
    console.error('Error generating fixture tasks:', error);
    throw error;
  }

  return (data || []).map(mapFixtureTaskFromDb);
};

/**
 * Add a custom task to a fixture
 */
export const addFixtureTask = async (
  clubId: string,
  fixtureId: string,
  label: string
): Promise<FixtureTask> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode
    const existing = getDemoFixtureTasks(fixtureId);
    const nextOrder = existing.length > 0
      ? Math.max(...existing.map(t => t.sort_order)) + 1
      : 0;

    const task: FixtureTask = {
      id: generateDemoId(),
      club_id: clubId,
      fixture_id: fixtureId,
      label,
      is_completed: false,
      sort_order: nextOrder,
      created_at: new Date().toISOString(),
    };

    return saveDemoFixtureTask(task);
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from(TABLES.FIXTURE_TASKS)
    .select('sort_order')
    .eq('fixture_id', fixtureId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from(TABLES.FIXTURE_TASKS)
    .insert({
      club_id: clubId,
      fixture_id: fixtureId,
      label,
      is_completed: false,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding fixture task:', error);
    throw error;
  }

  return mapFixtureTaskFromDb(data);
};

/**
 * Toggle task completion
 */
export const toggleTaskCompletion = async (
  taskId: string,
  isCompleted: boolean,
  userId?: string
): Promise<FixtureTask> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: find and update the task
    // We need to search all fixtures for this task
    const allTasksKey = 'pitchside_demo_fixture_tasks';
    const allTasks: FixtureTask[] = JSON.parse(localStorage.getItem(allTasksKey) || '[]');
    const taskIndex = allTasks.findIndex(t => t.id === taskId);

    if (taskIndex >= 0) {
      allTasks[taskIndex] = {
        ...allTasks[taskIndex],
        is_completed: isCompleted,
        completed_by: isCompleted ? userId : undefined,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(allTasksKey, JSON.stringify(allTasks));
      return allTasks[taskIndex];
    }

    throw new Error('Task not found');
  }

  const { data, error } = await supabase
    .from(TABLES.FIXTURE_TASKS)
    .update({
      is_completed: isCompleted,
      completed_by: isCompleted ? userId : null,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling task:', error);
    throw error;
  }

  return mapFixtureTaskFromDb(data);
};

/**
 * Delete a fixture task
 */
export const deleteFixtureTask = async (taskId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    deleteDemoFixtureTask(taskId);
    return;
  }

  const { error } = await supabase
    .from(TABLES.FIXTURE_TASKS)
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Update a fixture task (label, status, sort order)
 */
export const updateFixtureTask = async (
  taskId: string,
  updates: {
    label?: string;
    sort_order?: number;
    status?: 'pending' | 'in_progress' | 'done';
    // Phase 3: Task ownership fields
    owner_user_id?: string | null;
    backup_user_id?: string | null;
    owner_role?: string | null;
    due_at?: string | null;
  }
): Promise<FixtureTask> => {
  // Demo mode function
  const updateDemoTask = () => {
    const allTasksKey = 'pitchside_demo_fixture_tasks';
    const allTasks: FixtureTask[] = JSON.parse(localStorage.getItem(allTasksKey) || '[]');
    const taskIndex = allTasks.findIndex(t => t.id === taskId);

    if (taskIndex >= 0) {
      allTasks[taskIndex] = {
        ...allTasks[taskIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(allTasksKey, JSON.stringify(allTasks));
      return allTasks[taskIndex];
    }

    throw new Error('Task not found');
  };

  if (!supabase || !isSupabaseConfigured()) {
    return updateDemoTask();
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.FIXTURE_TASKS)
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task, falling back to demo:', error);
      return updateDemoTask();
    }

    return mapFixtureTaskFromDb(data);
  } catch (error) {
    console.error('Error updating task, falling back to demo:', error);
    return updateDemoTask();
  }
};

// ============================================================================
// Mappers
// ============================================================================

const mapTemplatePackFromDb = (row: any): TemplatePack => ({
  id: row.id,
  club_id: row.club_id,
  name: row.name,
  description: row.description,
  is_enabled: row.is_enabled,
  // Phase 4: Volunteer-proof Templates fields
  auto_apply: row.auto_apply,
  default_owner_role: row.default_owner_role,
  tasks: (row.tasks || []) as TemplateTask[],
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapFixtureTaskFromDb = (row: any): FixtureTask => ({
  id: row.id,
  club_id: row.club_id,
  fixture_id: row.fixture_id,
  template_pack_id: row.template_pack_id,
  label: row.label,
  is_completed: row.is_completed,
  completed_by: row.completed_by,
  completed_at: row.completed_at,
  sort_order: row.sort_order,
  // Phase 3: Task Ownership fields
  owner_user_id: row.owner_user_id,
  backup_user_id: row.backup_user_id,
  owner_role: row.owner_role,
  due_at: row.due_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});
