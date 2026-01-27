/**
 * D14 Ops - Activity Log Service
 * Audit trail for all operations
 * Records who did what, when
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { ActivityLogEntry, ActivityLogFilters, ActivityAction } from '../types';

// ============================================================================
// Log Activity
// ============================================================================

export interface LogActivityInput {
    org_id: string;
    club_id?: string;
    user_id: string;
    user_email?: string;
    user_name?: string;
    action: ActivityAction;
    entity_type: string;
    entity_id?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Write an entry to the activity log
 * This is the primary function - call it whenever an action occurs
 */
export const logActivity = async (input: LogActivityInput): Promise<ActivityLogEntry | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;

    try {
        const { data, error } = await supabase
            .from('activity_log')
            .insert({
                org_id: input.org_id,
                club_id: input.club_id,
                user_id: input.user_id,
                user_email: input.user_email,
                user_name: input.user_name,
                action: input.action,
                entity_type: input.entity_type,
                entity_id: input.entity_id,
                metadata: input.metadata || {},
            })
            .select()
            .single();

        if (error) {
            // Don't throw - activity logging should not break the main operation
            console.error('Error logging activity:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Activity log error:', err);
        return null;
    }
};

// ============================================================================
// Query Activity Log
// ============================================================================

/**
 * Get activity log entries with filtering and pagination
 */
export const getActivityLog = async (
    orgId: string,
    clubId?: string,
    filters?: ActivityLogFilters
): Promise<ActivityLogEntry[]> => {
    if (!supabase || !isSupabaseConfigured()) return [];

    let query = supabase
        .from('activity_log')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (clubId) {
        query = query.eq('club_id', clubId);
    }

    // Apply filters
    if (filters?.action) {
        const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
        query = query.in('action', actions);
    }
    if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
    }
    if (filters?.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
    }
    if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
    }
    if (filters?.after) {
        query = query.gte('created_at', filters.after);
    }
    if (filters?.before) {
        query = query.lte('created_at', filters.before);
    }
    if (filters?.limit) {
        query = query.limit(filters.limit);
    } else {
        query = query.limit(100); // Default limit
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching activity log:', error);
        return [];
    }

    return data || [];
};

/**
 * Get activity history for a specific entity
 * E.g., all activity for a specific task
 */
export const getActivityForEntity = async (
    entityType: string,
    entityId: string,
    limit?: number
): Promise<ActivityLogEntry[]> => {
    if (!supabase || !isSupabaseConfigured()) return [];

    let query = supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching entity activity:', error);
        return [];
    }

    return data || [];
};

/**
 * Get recent activity for a user (their actions)
 */
export const getUserActivity = async (
    userId: string,
    orgId: string,
    limit: number = 50
): Promise<ActivityLogEntry[]> => {
    if (!supabase || !isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching user activity:', error);
        return [];
    }

    return data || [];
};

// ============================================================================
// Activity Aggregation (for reports)
// ============================================================================

export interface ActivitySummary {
    total_actions: number;
    actions_by_type: Record<string, number>;
    actions_by_user: Record<string, number>;
    tasks_completed: number;
    tasks_missed: number;
}

/**
 * Get activity summary for a time period
 * Useful for weekly "What Broke" reports
 */
export const getActivitySummary = async (
    orgId: string,
    clubId: string,
    startDate: string,
    endDate: string
): Promise<ActivitySummary> => {
    const entries = await getActivityLog(orgId, clubId, {
        after: startDate,
        before: endDate,
        limit: 1000,
    });

    const summary: ActivitySummary = {
        total_actions: entries.length,
        actions_by_type: {},
        actions_by_user: {},
        tasks_completed: 0,
        tasks_missed: 0,
    };

    for (const entry of entries) {
        // Count by action type
        summary.actions_by_type[entry.action] = (summary.actions_by_type[entry.action] || 0) + 1;

        // Count by user
        const userKey = entry.user_name || entry.user_email || entry.user_id;
        summary.actions_by_user[userKey] = (summary.actions_by_user[userKey] || 0) + 1;

        // Track task outcomes
        if (entry.action === 'task_completed') {
            summary.tasks_completed++;
        }
        if (entry.action === 'task_missed') {
            summary.tasks_missed++;
        }
    }

    return summary;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format an activity entry for display
 */
export const formatActivityMessage = (entry: ActivityLogEntry): string => {
    const actor = entry.user_name || entry.user_email || 'Someone';
    const entityName = (entry.metadata as any)?.title || entry.entity_type;

    const actionMessages: Record<ActivityAction, string> = {
        task_created: `${actor} created task "${entityName}"`,
        task_started: `${actor} started working on "${entityName}"`,
        task_completed: `${actor} completed "${entityName}"`,
        task_blocked: `${actor} marked "${entityName}" as blocked`,
        task_missed: `Task "${entityName}" was marked as missed`,
        task_reassigned: `${actor} reassigned "${entityName}"`,
        runbook_created: `${actor} created runbook "${entityName}"`,
        runbook_activated: `${actor} activated runbook for a fixture`,
        runbook_completed: `Runbook "${entityName}" was completed`,
        fixture_created: `${actor} created a new fixture`,
        fixture_updated: `${actor} updated fixture details`,
        content_published: `${actor} published content`,
        escalation_triggered: `Escalation triggered for "${entityName}"`,
    };

    return actionMessages[entry.action] || `${actor} performed ${entry.action}`;
};

/**
 * Get action icon/emoji for display
 */
export const getActivityIcon = (action: ActivityAction): string => {
    const icons: Record<ActivityAction, string> = {
        task_created: '➕',
        task_started: '▶️',
        task_completed: '✅',
        task_blocked: '🚫',
        task_missed: '⚠️',
        task_reassigned: '👤',
        runbook_created: '📋',
        runbook_activated: '🚀',
        runbook_completed: '🏁',
        fixture_created: '⚽',
        fixture_updated: '📝',
        content_published: '📢',
        escalation_triggered: '🔔',
    };

    return icons[action] || '📌';
};
