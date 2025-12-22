/**
 * Task Service
 * 
 * Handles all admin task-related database operations.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { AdminTask } from '../types';

/**
 * Get all tasks for a club
 */
export const getTasks = async (clubId: string): Promise<AdminTask[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.ADMIN_TASKS)
    .select('*')
    .eq('club_id', clubId)
    .order('deadline', { ascending: true });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return (data || []).map(mapTaskFromDb);
};

/**
 * Get tasks by status
 */
export const getTasksByStatus = async (
  clubId: string,
  status: AdminTask['status']
): Promise<AdminTask[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.ADMIN_TASKS)
    .select('*')
    .eq('club_id', clubId)
    .eq('status', status)
    .order('deadline', { ascending: true });

  if (error) {
    console.error('Error fetching tasks by status:', error);
    throw error;
  }

  return (data || []).map(mapTaskFromDb);
};

/**
 * Get a single task by ID
 */
export const getTask = async (taskId: string): Promise<AdminTask | null> => {
  if (!supabase || !isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLES.ADMIN_TASKS)
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching task:', error);
    throw error;
  }

  return data ? mapTaskFromDb(data) : null;
};

/**
 * Create a new task
 */
export const createTask = async (
  clubId: string,
  task: Omit<AdminTask, 'id'>
): Promise<AdminTask> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from(TABLES.ADMIN_TASKS)
    .insert({
      club_id: clubId,
      title: task.title,
      deadline: task.deadline,
      priority: task.priority,
      type: task.type,
      status: task.status,
      action_plan: null,
      email_draft: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return mapTaskFromDb(data);
};

/**
 * Update a task
 */
export const updateTask = async (
  taskId: string,
  updates: Partial<Omit<AdminTask, 'id'>>
): Promise<AdminTask> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updateData: any = {
    title: updates.title,
    deadline: updates.deadline,
    priority: updates.priority,
    type: updates.type,
    status: updates.status,
  };

  // Handle optional fields
  if ('action_plan' in updates) {
    updateData.action_plan = updates.action_plan || null;
  }
  if ('email_draft' in updates) {
    updateData.email_draft = updates.email_draft || null;
  }

  const { data, error } = await supabase
    .from(TABLES.ADMIN_TASKS)
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return mapTaskFromDb(data);
};

/**
 * Save action plan for a task
 */
export const saveTaskActionPlan = async (
  taskId: string,
  actionPlan: string
): Promise<AdminTask> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  return updateTask(taskId, { action_plan: actionPlan as any });
};

/**
 * Save email draft for a task
 */
export const saveTaskEmailDraft = async (
  taskId: string,
  emailDraft: string
): Promise<AdminTask> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  return updateTask(taskId, { email_draft: emailDraft as any });
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from(TABLES.ADMIN_TASKS)
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for tasks in a club
 */
export const subscribeToTasks = (
  clubId: string,
  callback: (tasks: AdminTask[]) => void
) => {
  if (!supabase || !isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel(`tasks:${clubId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.ADMIN_TASKS,
        filter: `club_id=eq.${clubId}`,
      },
      async () => {
        const tasks = await getTasks(clubId);
        callback(tasks);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map database row to AdminTask type
 */
const mapTaskFromDb = (row: any): AdminTask => ({
  id: row.id,
  title: row.title,
  deadline: row.deadline,
  priority: row.priority as 'High' | 'Medium' | 'Low',
  type: row.type as 'League' | 'Finance' | 'Facilities' | 'Media',
  status: row.status as 'Pending' | 'In Progress' | 'Completed',
  action_plan: row.action_plan ?? undefined,
  email_draft: row.email_draft ?? undefined,
});
