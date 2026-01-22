/**
 * Audit Service
 *
 * Handles logging and querying audit events for accountability.
 * Part of Independence & Leverage feature set - Phase 5.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import { AuditEvent, AuditEventType } from '../types';

// ============================================================================
// Demo Mode Storage
// ============================================================================

const STORAGE_KEY = 'pitchside_demo_audit_events';

function getDemoAuditEvents(): AuditEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDemoAuditEvent(event: AuditEvent): void {
  const events = getDemoAuditEvents();
  events.unshift(event); // Add to front for chronological order (newest first)
  // Keep only last 500 events to prevent localStorage bloat
  const trimmed = events.slice(0, 500);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function generateDemoId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Log Events
// ============================================================================

/**
 * Log an audit event
 */
export const logAuditEvent = async (
  clubId: string,
  actorUserId: string,
  eventType: AuditEventType,
  payload: Record<string, any> = {},
  options?: {
    fixtureId?: string;
    taskId?: string;
  }
): Promise<AuditEvent | null> => {
  const event: AuditEvent = {
    id: generateDemoId(),
    club_id: clubId,
    fixture_id: options?.fixtureId,
    task_id: options?.taskId,
    actor_user_id: actorUserId,
    event_type: eventType,
    payload,
    created_at: new Date().toISOString(),
  };

  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode
    saveDemoAuditEvent(event);
    return event;
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.AUDIT_EVENTS || 'audit_events')
      .insert({
        club_id: clubId,
        fixture_id: options?.fixtureId,
        task_id: options?.taskId,
        actor_user_id: actorUserId,
        event_type: eventType,
        payload,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging audit event:', error);
      // Fall back to demo storage
      saveDemoAuditEvent(event);
      return event;
    }

    return mapAuditEventFromDb(data);
  } catch (error) {
    console.error('Error logging audit event:', error);
    saveDemoAuditEvent(event);
    return event;
  }
};

// ============================================================================
// Query Events
// ============================================================================

/**
 * Get audit events for a club
 */
export const getAuditEvents = async (
  clubId: string,
  options?: {
    fixtureId?: string;
    taskId?: string;
    eventTypes?: AuditEventType[];
    limit?: number;
    offset?: number;
  }
): Promise<AuditEvent[]> => {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode
    let events = getDemoAuditEvents().filter(e => e.club_id === clubId);

    if (options?.fixtureId) {
      events = events.filter(e => e.fixture_id === options.fixtureId);
    }
    if (options?.taskId) {
      events = events.filter(e => e.task_id === options.taskId);
    }
    if (options?.eventTypes && options.eventTypes.length > 0) {
      events = events.filter(e => options.eventTypes!.includes(e.event_type));
    }

    return events.slice(offset, offset + limit);
  }

  try {
    let query = supabase
      .from(TABLES.AUDIT_EVENTS || 'audit_events')
      .select('*')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.fixtureId) {
      query = query.eq('fixture_id', options.fixtureId);
    }
    if (options?.taskId) {
      query = query.eq('task_id', options.taskId);
    }
    if (options?.eventTypes && options.eventTypes.length > 0) {
      query = query.in('event_type', options.eventTypes);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit events:', error);
      return getDemoAuditEvents().filter(e => e.club_id === clubId).slice(0, limit);
    }

    return (data || []).map(mapAuditEventFromDb);
  } catch (error) {
    console.error('Error fetching audit events:', error);
    return getDemoAuditEvents().filter(e => e.club_id === clubId).slice(0, limit);
  }
};

/**
 * Get audit events for a specific fixture
 */
export const getFixtureAuditEvents = async (
  clubId: string,
  fixtureId: string,
  limit = 50
): Promise<AuditEvent[]> => {
  return getAuditEvents(clubId, { fixtureId, limit });
};

/**
 * Get recent activity for a user (their actions)
 */
export const getUserActivity = async (
  clubId: string,
  userId: string,
  limit = 20
): Promise<AuditEvent[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode
    return getDemoAuditEvents()
      .filter(e => e.club_id === clubId && e.actor_user_id === userId)
      .slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.AUDIT_EVENTS || 'audit_events')
      .select('*')
      .eq('club_id', clubId)
      .eq('actor_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }

    return (data || []).map(mapAuditEventFromDb);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
};

// ============================================================================
// Convenience Loggers
// ============================================================================

/** Log task claimed event */
export const logTaskClaimed = (
  clubId: string,
  actorUserId: string,
  taskId: string,
  fixtureId: string,
  taskLabel: string
) => logAuditEvent(clubId, actorUserId, 'task.claimed', { task_label: taskLabel }, { taskId, fixtureId });

/** Log task completed event */
export const logTaskCompleted = (
  clubId: string,
  actorUserId: string,
  taskId: string,
  fixtureId: string,
  taskLabel: string
) => logAuditEvent(clubId, actorUserId, 'task.completed', { task_label: taskLabel }, { taskId, fixtureId });

/** Log task reopened event */
export const logTaskReopened = (
  clubId: string,
  actorUserId: string,
  taskId: string,
  fixtureId: string,
  taskLabel: string
) => logAuditEvent(clubId, actorUserId, 'task.reopened', { task_label: taskLabel }, { taskId, fixtureId });

/** Log task reassigned event */
export const logTaskReassigned = (
  clubId: string,
  actorUserId: string,
  taskId: string,
  fixtureId: string,
  taskLabel: string,
  fromUserId?: string,
  toUserId?: string
) => logAuditEvent(
  clubId,
  actorUserId,
  'task.reassigned',
  { task_label: taskLabel, from_user_id: fromUserId, to_user_id: toUserId },
  { taskId, fixtureId }
);

/** Log fixture created event */
export const logFixtureCreated = (
  clubId: string,
  actorUserId: string,
  fixtureId: string,
  opponent: string,
  venue: string
) => logAuditEvent(clubId, actorUserId, 'fixture.created', { opponent, venue }, { fixtureId });

// ============================================================================
// Mapper
// ============================================================================

const mapAuditEventFromDb = (row: any): AuditEvent => ({
  id: row.id,
  club_id: row.club_id,
  fixture_id: row.fixture_id,
  task_id: row.task_id,
  actor_user_id: row.actor_user_id,
  event_type: row.event_type,
  payload: row.payload || {},
  created_at: row.created_at,
});
