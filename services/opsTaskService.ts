/**
 * D14 Ops - Task Service
 * Core CRUD operations for ops_tasks table
 * Handles task ownership, status transitions, and "Continue" button logic
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { OpsTask, OpsTaskFilters, TaskStatus, TaskPriority, TaskCategory } from '../types';
import { logActivity } from './activityLogService';

// ============================================================================
// Task CRUD
// ============================================================================

/**
 * Get all tasks for a club with optional filtering
 */
export const getOpsTasks = async (
    orgId: string,
    clubId: string,
    filters?: OpsTaskFilters
): Promise<OpsTask[]> => {
    if (!supabase || !isSupabaseConfigured()) return [];

    let query = supabase
        .from('ops_tasks')
        .select('*')
        .eq('org_id', orgId)
        .eq('club_id', clubId)
        .order('due_at', { ascending: true });

    // Apply filters
    if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statuses);
    }
    if (filters?.priority) {
        const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
        query = query.in('priority', priorities);
    }
    if (filters?.category) {
        const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
        query = query.in('category', categories);
    }
    if (filters?.owner_user_id) {
        query = query.eq('owner_user_id', filters.owner_user_id);
    }
    if (filters?.fixture_id) {
        query = query.eq('fixture_id', filters.fixture_id);
    }
    if (filters?.due_before) {
        query = query.lte('due_at', filters.due_before);
    }
    if (filters?.due_after) {
        query = query.gte('due_at', filters.due_after);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching ops tasks:', error);
        throw error;
    }

    return data || [];
};

/**
 * Get a single task by ID
 */
export const getOpsTask = async (taskId: string): Promise<OpsTask | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('ops_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) {
        console.error('Error fetching ops task:', error);
        return null;
    }

    return data;
};

/**
 * Get the next critical task (for "Continue" button)
 * Priority order: 1) Overdue critical, 2) Overdue high, 3) Due soon critical, 4) In progress
 */
export const getNextCriticalTask = async (
    orgId: string,
    clubId: string,
    userId?: string
): Promise<OpsTask | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;

    const now = new Date().toISOString();

    // First, check for overdue tasks by priority
    let query = supabase
        .from('ops_tasks')
        .select('*')
        .eq('org_id', orgId)
        .eq('club_id', clubId)
        .in('status', ['pending', 'in_progress', 'blocked'])
        .lt('due_at', now)
        .order('priority', { ascending: true }) // critical < high < medium < low
        .order('due_at', { ascending: true })
        .limit(1);

    if (userId) {
        query = query.eq('owner_user_id', userId);
    }

    const { data: overdueTask } = await query;

    if (overdueTask && overdueTask.length > 0) {
        return overdueTask[0];
    }

    // If no overdue, get next upcoming task
    query = supabase
        .from('ops_tasks')
        .select('*')
        .eq('org_id', orgId)
        .eq('club_id', clubId)
        .in('status', ['pending', 'in_progress'])
        .gte('due_at', now)
        .order('priority', { ascending: true })
        .order('due_at', { ascending: true })
        .limit(1);

    if (userId) {
        query = query.eq('owner_user_id', userId);
    }

    const { data: upcomingTask } = await query;

    return upcomingTask && upcomingTask.length > 0 ? upcomingTask[0] : null;
};

/**
 * Get overdue tasks (for escalation checking)
 */
export const getOverdueTasks = async (
    orgId: string,
    clubId?: string
): Promise<OpsTask[]> => {
    if (!supabase || !isSupabaseConfigured()) return [];

    const now = new Date().toISOString();

    let query = supabase
        .from('ops_tasks')
        .select('*')
        .eq('org_id', orgId)
        .in('status', ['pending', 'in_progress'])
        .lt('due_at', now);

    if (clubId) {
        query = query.eq('club_id', clubId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching overdue tasks:', error);
        return [];
    }

    return data || [];
};

// ============================================================================
// Task Creation
// ============================================================================

export interface CreateOpsTaskInput {
    club_id: string;
    fixture_id?: string;
    runbook_id?: string;
    title: string;
    description?: string;
    owner_user_id: string;
    due_at: string;
    priority?: TaskPriority;
    category?: TaskCategory;
    depends_on_task_id?: string;
}

/**
 * Create a new task
 */
export const createOpsTask = async (
    input: CreateOpsTaskInput,
    createdByUserId: string
): Promise<OpsTask | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('ops_tasks')
        .insert({
            ...input,
            created_by_user_id: createdByUserId,
            status: 'pending',
            priority: input.priority || 'medium',
            category: input.category || 'admin',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating ops task:', error);
        throw error;
    }

    // Log activity
    if (data) {
        await logActivity({
            org_id: data.org_id,
            club_id: data.club_id,
            user_id: createdByUserId,
            action: 'task_created',
            entity_type: 'ops_task',
            entity_id: data.id,
            metadata: { title: data.title, owner_user_id: data.owner_user_id },
        });
    }

    return data;
};

// ============================================================================
// Task Status Transitions
// ============================================================================

/**
 * Update task status with validation and audit logging
 */
export const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus,
    userId: string
): Promise<OpsTask | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;

    // Get current task to validate transition
    const task = await getOpsTask(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    // Validate status transition
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
        pending: ['in_progress', 'blocked', 'missed'],
        in_progress: ['completed', 'blocked', 'missed'],
        blocked: ['pending', 'in_progress', 'missed'],
        completed: [], // Terminal state
        missed: ['pending', 'in_progress'], // Can re-open missed tasks
    };

    if (!validTransitions[task.status].includes(newStatus)) {
        throw new Error(`Invalid transition from ${task.status} to ${newStatus}`);
    }

    // Check dependency for completion
    if (newStatus === 'completed' && task.depends_on_task_id) {
        const dependency = await getOpsTask(task.depends_on_task_id);
        if (dependency && dependency.status !== 'completed') {
            throw new Error('Cannot complete task: dependency not completed');
        }
    }

    // Build update object
    const updates: Partial<OpsTask> = { status: newStatus };

    if (newStatus === 'in_progress' && !task.started_at) {
        updates.started_at = new Date().toISOString();
    }
    if (newStatus === 'completed') {
        updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from('ops_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Error updating task status:', error);
        throw error;
    }

    // Log activity
    const actionMap: Record<TaskStatus, string> = {
        pending: 'task_created',
        in_progress: 'task_started',
        completed: 'task_completed',
        blocked: 'task_blocked',
        missed: 'task_missed',
    };

    await logActivity({
        org_id: task.org_id,
        club_id: task.club_id,
        user_id: userId,
        action: actionMap[newStatus] as any,
        entity_type: 'ops_task',
        entity_id: taskId,
        metadata: { previous_status: task.status, new_status: newStatus },
    });

    return data;
};

/**
 * Start a task (convenience method)
 */
export const startTask = async (taskId: string, userId: string): Promise<OpsTask | null> => {
    return updateTaskStatus(taskId, 'in_progress', userId);
};

/**
 * Complete a task (convenience method)
 */
export const completeTask = async (taskId: string, userId: string): Promise<OpsTask | null> => {
    return updateTaskStatus(taskId, 'completed', userId);
};

/**
 * Block a task (convenience method)
 */
export const blockTask = async (taskId: string, userId: string): Promise<OpsTask | null> => {
    return updateTaskStatus(taskId, 'blocked', userId);
};

// ============================================================================
// Task Assignment
// ============================================================================

/**
 * Reassign a task to a new owner
 */
export const reassignTask = async (
    taskId: string,
    newOwnerId: string,
    reassignedByUserId: string
): Promise<OpsTask | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;

    const task = await getOpsTask(taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    const previousOwnerId = task.owner_user_id;

    const { data, error } = await supabase
        .from('ops_tasks')
        .update({ owner_user_id: newOwnerId })
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Error reassigning task:', error);
        throw error;
    }

    // Log activity
    await logActivity({
        org_id: task.org_id,
        club_id: task.club_id,
        user_id: reassignedByUserId,
        action: 'task_reassigned',
        entity_type: 'ops_task',
        entity_id: taskId,
        metadata: { previous_owner: previousOwnerId, new_owner: newOwnerId },
    });

    return data;
};

// ============================================================================
// Task Updates
// ============================================================================

export interface UpdateOpsTaskInput {
    title?: string;
    description?: string;
    due_at?: string;
    priority?: TaskPriority;
    category?: TaskCategory;
    fixture_id?: string;
    depends_on_task_id?: string;
}

/**
 * Update task details (not status - use updateTaskStatus for that)
 */
export const updateOpsTask = async (
    taskId: string,
    updates: UpdateOpsTaskInput
): Promise<OpsTask | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('ops_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Error updating ops task:', error);
        throw error;
    }

    return data;
};

/**
 * Delete a task
 */
export const deleteOpsTask = async (taskId: string): Promise<boolean> => {
    if (!supabase || !isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('ops_tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting ops task:', error);
        throw error;
    }

    return true;
};

// ============================================================================
// Task Statistics
// ============================================================================

export interface TaskStats {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    blocked: number;
    missed: number;
    overdue: number;
}

/**
 * Get task statistics for a club
 */
export const getTaskStats = async (
    orgId: string,
    clubId: string
): Promise<TaskStats> => {
    if (!supabase || !isSupabaseConfigured()) {
        return { total: 0, pending: 0, in_progress: 0, completed: 0, blocked: 0, missed: 0, overdue: 0 };
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('ops_tasks')
        .select('status, due_at')
        .eq('org_id', orgId)
        .eq('club_id', clubId);

    if (error) {
        console.error('Error fetching task stats:', error);
        return { total: 0, pending: 0, in_progress: 0, completed: 0, blocked: 0, missed: 0, overdue: 0 };
    }

    const tasks = data || [];
    const stats: TaskStats = {
        total: tasks.length,
        pending: 0,
        in_progress: 0,
        completed: 0,
        blocked: 0,
        missed: 0,
        overdue: 0,
    };

    for (const task of tasks) {
        stats[task.status as keyof Omit<TaskStats, 'total' | 'overdue'>]++;

        if (['pending', 'in_progress'].includes(task.status) && task.due_at < now) {
            stats.overdue++;
        }
    }

    return stats;
};
