/**
 * Notification Service
 *
 * Aggregates events from various sources into notifications for Dashboard and Inbox.
 * Supports cross-department alerts for the "domino effect" workflow.
 */

import { Club, Fixture, Player, AvailabilityStatus, FixtureTask, ClubRoleName } from '../types';
import { getDemoAvailability } from './demoStorageService';
import { getFixtureTasks } from './fixtureTaskService';
import { getLowStockItems, getActiveLaundry } from './equipmentService';
import { getAvailabilityForFixture } from './availabilityService';

export type NotificationType =
  | 'availability_update'
  | 'injury_reported'
  | 'task_due'
  | 'task_completed'
  | 'low_stock'
  | 'laundry_pending'
  | 'content_ready'
  | 'fixture_upcoming'
  | 'department_alert'
  | 'system';

export type NotificationPriority = 'high' | 'medium' | 'low';

// Department/source for cross-department notifications
export type Department = 'coach' | 'media' | 'ops' | 'kit' | 'finance' | 'admin';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  description: string;
  timestamp: Date;
  category: 'availability' | 'tasks' | 'equipment' | 'content' | 'fixtures' | 'system' | 'department';
  actionLabel?: string;
  actionTab?: string;
  metadata?: Record<string, any>;
  read?: boolean;
  // Cross-department alert fields
  sourceDepartment?: Department;
  targetRoles?: ClubRoleName[];
  createdBy?: string; // user ID who created the alert
}

// Department alert types for the "domino effect" workflow
export type DepartmentAlertType =
  | 'tactical_decision'      // Coach made formation/lineup decision
  | 'player_signing'         // New player signed
  | 'player_departure'       // Player leaving
  | 'injury_update'          // Player injury status changed
  | 'equipment_update'       // Kit/equipment changes
  | 'content_required'       // Content team needs to create something
  | 'finance_approval'       // Budget/payment needs attention
  | 'matchday_prep'          // Match day preparation update
  | 'schedule_change';       // Fixture time/date changed

export interface DepartmentAlert {
  type: DepartmentAlertType;
  title: string;
  description: string;
  sourceDepartment: Department;
  targetRoles: ClubRoleName[];
  priority: NotificationPriority;
  relatedFixtureId?: string;
  relatedPlayerId?: string;
  actionRequired?: boolean;
  actionLabel?: string;
  actionTab?: string;
}

// Storage key for department alerts
const DEPT_ALERTS_KEY = 'pitchside_department_alerts';

// Map department alert types to default target roles
const alertTargetRoles: Record<DepartmentAlertType, ClubRoleName[]> = {
  tactical_decision: ['Media', 'Ops', 'Kit'],
  player_signing: ['Media', 'Kit', 'Finance', 'Ops'],
  player_departure: ['Media', 'Kit', 'Finance'],
  injury_update: ['Coach', 'Media', 'Ops'],
  equipment_update: ['Ops', 'Kit'],
  content_required: ['Media'],
  finance_approval: ['Finance', 'Admin'],
  matchday_prep: ['Coach', 'Ops', 'Kit', 'Media'],
  schedule_change: ['Coach', 'Ops', 'Kit', 'Media', 'Finance'],
};

/**
 * Create a new department alert
 */
export const createDepartmentAlert = (
  clubId: string,
  alert: DepartmentAlert,
  createdBy?: string
): Notification => {
  const id = `dept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const notification: Notification = {
    id,
    type: 'department_alert',
    priority: alert.priority,
    title: alert.title,
    description: alert.description,
    timestamp: new Date(),
    category: 'department',
    sourceDepartment: alert.sourceDepartment,
    targetRoles: alert.targetRoles,
    createdBy,
    actionLabel: alert.actionLabel,
    actionTab: alert.actionTab,
    metadata: {
      alertType: alert.type,
      relatedFixtureId: alert.relatedFixtureId,
      relatedPlayerId: alert.relatedPlayerId,
      actionRequired: alert.actionRequired,
    },
    read: false,
  };

  // Store in localStorage
  const stored = getDepartmentAlerts(clubId);
  stored.unshift(notification);
  // Keep only last 50 alerts
  const trimmed = stored.slice(0, 50);
  localStorage.setItem(`${DEPT_ALERTS_KEY}_${clubId}`, JSON.stringify(trimmed));

  return notification;
};

/**
 * Get stored department alerts
 */
export const getDepartmentAlerts = (clubId: string): Notification[] => {
  try {
    const stored = localStorage.getItem(`${DEPT_ALERTS_KEY}_${clubId}`);
    if (!stored) return [];
    const alerts = JSON.parse(stored);
    // Convert timestamps back to Date objects
    return alerts.map((a: any) => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
  } catch {
    return [];
  }
};

/**
 * Get department alerts filtered by user's role
 */
export const getDepartmentAlertsForRole = (
  clubId: string,
  userRole: ClubRoleName
): Notification[] => {
  const alerts = getDepartmentAlerts(clubId);
  return alerts.filter(
    (a) => !a.targetRoles || a.targetRoles.length === 0 || a.targetRoles.includes(userRole)
  );
};

/**
 * Mark a department alert as read
 */
export const markDepartmentAlertRead = (clubId: string, alertId: string): void => {
  const alerts = getDepartmentAlerts(clubId);
  const updated = alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a));
  localStorage.setItem(`${DEPT_ALERTS_KEY}_${clubId}`, JSON.stringify(updated));
};

/**
 * Helper to create common department alerts
 */
export const departmentAlerts = {
  // Coach made tactical decision (formation, lineup)
  tacticalDecision: (clubId: string, details: string, fixtureId?: string) =>
    createDepartmentAlert(clubId, {
      type: 'tactical_decision',
      title: 'Tactical Update',
      description: details,
      sourceDepartment: 'coach',
      targetRoles: alertTargetRoles.tactical_decision,
      priority: 'medium',
      relatedFixtureId: fixtureId,
      actionTab: 'formation',
    }),

  // New player signed
  playerSigning: (clubId: string, playerName: string, position: string) =>
    createDepartmentAlert(clubId, {
      type: 'player_signing',
      title: `New Signing: ${playerName}`,
      description: `${playerName} (${position}) has joined the club. Content, kit allocation, and admin tasks required.`,
      sourceDepartment: 'admin',
      targetRoles: alertTargetRoles.player_signing,
      priority: 'high',
      actionRequired: true,
      actionLabel: 'View Squad',
      actionTab: 'squad',
    }),

  // Injury update
  injuryUpdate: (clubId: string, playerName: string, status: string, fixtureId?: string) =>
    createDepartmentAlert(clubId, {
      type: 'injury_update',
      title: `Injury Update: ${playerName}`,
      description: `${playerName} - ${status}. Affects selection and may need media communication.`,
      sourceDepartment: 'coach',
      targetRoles: alertTargetRoles.injury_update,
      priority: 'high',
      relatedFixtureId: fixtureId,
      actionTab: 'availability',
    }),

  // Content required
  contentRequired: (clubId: string, contentType: string, details: string) =>
    createDepartmentAlert(clubId, {
      type: 'content_required',
      title: `Content Needed: ${contentType}`,
      description: details,
      sourceDepartment: 'ops',
      targetRoles: alertTargetRoles.content_required,
      priority: 'medium',
      actionRequired: true,
      actionLabel: 'Create Content',
      actionTab: 'content',
    }),

  // Match day prep update
  matchdayPrep: (clubId: string, update: string, fixtureId: string) =>
    createDepartmentAlert(clubId, {
      type: 'matchday_prep',
      title: 'Match Day Update',
      description: update,
      sourceDepartment: 'ops',
      targetRoles: alertTargetRoles.matchday_prep,
      priority: 'high',
      relatedFixtureId: fixtureId,
      actionTab: 'matchday',
    }),

  // Schedule change
  scheduleChange: (clubId: string, fixtureDetails: string, reason: string) =>
    createDepartmentAlert(clubId, {
      type: 'schedule_change',
      title: 'Fixture Change',
      description: `${fixtureDetails} - ${reason}. All departments please note.`,
      sourceDepartment: 'admin',
      targetRoles: alertTargetRoles.schedule_change,
      priority: 'high',
      actionRequired: true,
      actionLabel: 'View Fixtures',
      actionTab: 'matchday',
    }),
};

/**
 * Generate notifications from availability data
 */
export const getAvailabilityNotifications = async (
  clubId: string,
  fixtures: Fixture[],
  players: Player[]
): Promise<Notification[]> => {
  const notifications: Notification[] = [];
  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED').slice(0, 3);

  for (const fixture of upcomingFixtures) {
    try {
      const availability = await getAvailabilityForFixture(fixture.id);

      // Find injured players
      const injured = availability.filter(a => a.status === 'injured');
      for (const record of injured) {
        const player = players.find(p => p.id === record.player_id);
        if (player) {
          notifications.push({
            id: `injury-${record.player_id}-${fixture.id}`,
            type: 'injury_reported',
            priority: 'high',
            title: `${player.name} - Injured`,
            description: record.response_note || `Marked as injured for ${fixture.opponent} match`,
            timestamp: new Date(record.responded_at || record.created_at || Date.now()),
            category: 'availability',
            actionLabel: 'View Availability',
            actionTab: 'availability',
            metadata: { playerId: player.id, fixtureId: fixture.id },
          });
        }
      }

      // Find unavailable players
      const unavailable = availability.filter(a => a.status === 'unavailable');
      for (const record of unavailable) {
        const player = players.find(p => p.id === record.player_id);
        if (player) {
          notifications.push({
            id: `unavailable-${record.player_id}-${fixture.id}`,
            type: 'availability_update',
            priority: 'medium',
            title: `${player.name} - Unavailable`,
            description: record.response_note || `Cannot play vs ${fixture.opponent}`,
            timestamp: new Date(record.responded_at || record.created_at || Date.now()),
            category: 'availability',
            actionLabel: 'View Squad',
            actionTab: 'availability',
            metadata: { playerId: player.id, fixtureId: fixture.id },
          });
        }
      }

      // Count no-responses for upcoming matches
      const noResponse = availability.filter(a => a.status === 'no_response');
      if (noResponse.length > 0) {
        const daysUntil = Math.ceil(
          (new Date(fixture.kickoff_time).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil <= 7) {
          notifications.push({
            id: `no-response-${fixture.id}`,
            type: 'availability_update',
            priority: daysUntil <= 2 ? 'high' : 'medium',
            title: `${noResponse.length} players haven't responded`,
            description: `Awaiting availability for ${fixture.opponent} match`,
            timestamp: new Date(),
            category: 'availability',
            actionLabel: 'Chase Responses',
            actionTab: 'availability',
            metadata: { fixtureId: fixture.id, count: noResponse.length },
          });
        }
      }
    } catch (error) {
      console.error('Error getting availability notifications:', error);
    }
  }

  return notifications;
};

/**
 * Generate notifications from fixture tasks
 */
export const getTaskNotifications = async (
  clubId: string,
  fixtures: Fixture[]
): Promise<Notification[]> => {
  const notifications: Notification[] = [];
  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED').slice(0, 3);

  for (const fixture of upcomingFixtures) {
    try {
      const tasks = await getFixtureTasks(fixture.id);

      // Find overdue tasks
      const now = new Date();
      const overdueTasks = tasks.filter(t =>
        t.status !== 'done' &&
        t.due_date &&
        new Date(t.due_date) < now
      );

      for (const task of overdueTasks) {
        notifications.push({
          id: `task-overdue-${task.id}`,
          type: 'task_due',
          priority: 'high',
          title: `Overdue: ${task.label}`,
          description: `Task for ${fixture.opponent} match is past due`,
          timestamp: new Date(task.due_date!),
          category: 'tasks',
          actionLabel: 'Complete Task',
          actionTab: 'matchday',
          metadata: { taskId: task.id, fixtureId: fixture.id },
        });
      }

      // Find tasks due soon (within 24 hours)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const dueSoon = tasks.filter(t =>
        t.status !== 'done' &&
        t.due_date &&
        new Date(t.due_date) >= now &&
        new Date(t.due_date) <= tomorrow
      );

      for (const task of dueSoon) {
        notifications.push({
          id: `task-due-${task.id}`,
          type: 'task_due',
          priority: 'medium',
          title: task.label,
          description: `Due soon for ${fixture.opponent} match`,
          timestamp: new Date(task.due_date!),
          category: 'tasks',
          actionLabel: 'View Tasks',
          actionTab: 'matchday',
          metadata: { taskId: task.id, fixtureId: fixture.id },
        });
      }

      // Recently completed tasks
      const recentlyCompleted = tasks.filter(t =>
        t.status === 'done' &&
        t.updated_at &&
        new Date(t.updated_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      );

      for (const task of recentlyCompleted) {
        notifications.push({
          id: `task-done-${task.id}`,
          type: 'task_completed',
          priority: 'low',
          title: `Completed: ${task.label}`,
          description: `Task for ${fixture.opponent} match done`,
          timestamp: new Date(task.updated_at!),
          category: 'tasks',
          actionLabel: 'View Tasks',
          actionTab: 'matchday',
          metadata: { taskId: task.id, fixtureId: fixture.id },
        });
      }
    } catch (error) {
      console.error('Error getting task notifications:', error);
    }
  }

  return notifications;
};

/**
 * Generate notifications from equipment data
 */
export const getEquipmentNotifications = async (
  clubId: string
): Promise<Notification[]> => {
  const notifications: Notification[] = [];

  try {
    // Low stock items
    const lowStock = await getLowStockItems(clubId);
    for (const item of lowStock) {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: 'low_stock',
        priority: item.quantity_available === 0 ? 'high' : 'medium',
        title: `Low Stock: ${item.name}`,
        description: `Only ${item.quantity_available} remaining (min: ${item.min_stock})`,
        timestamp: new Date(item.updated_at || Date.now()),
        category: 'equipment',
        actionLabel: 'Manage Stock',
        actionTab: 'equipment',
        metadata: { itemId: item.id },
      });
    }

    // Active laundry
    const laundry = await getActiveLaundry(clubId);
    for (const batch of laundry) {
      const totalItems = batch.items.reduce((sum, i) => sum + i.quantity, 0);
      const daysSent = Math.floor(
        (Date.now() - new Date(batch.sent_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSent >= 2) {
        notifications.push({
          id: `laundry-${batch.id}`,
          type: 'laundry_pending',
          priority: daysSent >= 5 ? 'high' : 'medium',
          title: `Laundry pending ${daysSent} days`,
          description: `${totalItems} items sent for washing`,
          timestamp: new Date(batch.sent_at),
          category: 'equipment',
          actionLabel: 'Mark Returned',
          actionTab: 'equipment',
          metadata: { laundryId: batch.id },
        });
      }
    }
  } catch (error) {
    console.error('Error getting equipment notifications:', error);
  }

  return notifications;
};

/**
 * Generate fixture-related notifications
 */
export const getFixtureNotifications = (fixtures: Fixture[]): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date();

  const upcoming = fixtures
    .filter(f => f.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

  for (const fixture of upcoming.slice(0, 3)) {
    const kickoff = new Date(fixture.kickoff_time);
    const hoursUntil = (kickoff.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntil = Math.ceil(hoursUntil / 24);

    if (hoursUntil <= 24 && hoursUntil > 0) {
      notifications.push({
        id: `fixture-soon-${fixture.id}`,
        type: 'fixture_upcoming',
        priority: 'high',
        title: `Match Tomorrow: vs ${fixture.opponent}`,
        description: `Kickoff at ${kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${fixture.venue}`,
        timestamp: kickoff,
        category: 'fixtures',
        actionLabel: 'Match Hub',
        actionTab: 'matchday',
        metadata: { fixtureId: fixture.id },
      });
    } else if (daysUntil <= 3 && daysUntil > 1) {
      notifications.push({
        id: `fixture-upcoming-${fixture.id}`,
        type: 'fixture_upcoming',
        priority: 'medium',
        title: `${daysUntil} days until ${fixture.opponent}`,
        description: `${fixture.venue} • ${fixture.competition}`,
        timestamp: kickoff,
        category: 'fixtures',
        actionLabel: 'Prepare',
        actionTab: 'matchday',
        metadata: { fixtureId: fixture.id },
      });
    }
  }

  return notifications;
};

/**
 * Get all notifications aggregated and sorted
 */
export const getAllNotifications = async (
  clubId: string,
  fixtures: Fixture[],
  players: Player[],
  options?: {
    limit?: number;
    categories?: Notification['category'][];
    userRole?: ClubRoleName; // Filter department alerts by user's role
  }
): Promise<Notification[]> => {
  const [
    availabilityNotifs,
    taskNotifs,
    equipmentNotifs,
  ] = await Promise.all([
    getAvailabilityNotifications(clubId, fixtures, players),
    getTaskNotifications(clubId, fixtures),
    getEquipmentNotifications(clubId),
  ]);

  const fixtureNotifs = getFixtureNotifications(fixtures);

  // Get department alerts (filtered by role if specified)
  let deptNotifs = getDepartmentAlerts(clubId);
  if (options?.userRole) {
    deptNotifs = deptNotifs.filter(
      (n) => !n.targetRoles || n.targetRoles.length === 0 || n.targetRoles.includes(options.userRole!)
    );
  }

  let all = [
    ...availabilityNotifs,
    ...taskNotifs,
    ...equipmentNotifs,
    ...fixtureNotifs,
    ...deptNotifs,
  ];

  // Filter by categories if specified
  if (options?.categories && options.categories.length > 0) {
    all = all.filter(n => options.categories!.includes(n.category));
  }

  // Sort by priority (high first) then by timestamp (newest first)
  const priorityOrder: Record<NotificationPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  all.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Apply limit
  if (options?.limit) {
    all = all.slice(0, options.limit);
  }

  return all;
};

/**
 * Get dashboard alerts (high priority notifications for immediate attention)
 */
export const getDashboardAlerts = async (
  clubId: string,
  fixtures: Fixture[],
  players: Player[]
): Promise<Notification[]> => {
  const notifications = await getAllNotifications(clubId, fixtures, players, {
    limit: 5,
  });

  // Filter to only show high/medium priority alerts
  return notifications.filter(n => n.priority === 'high' || n.priority === 'medium');
};

/**
 * Get quick stats for dashboard
 */
export const getQuickStats = async (
  clubId: string,
  fixtures: Fixture[]
): Promise<{
  pendingTasks: number;
  lowStockItems: number;
  upcomingMatches: number;
}> => {
  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED');

  let pendingTasks = 0;
  for (const fixture of upcomingFixtures.slice(0, 3)) {
    try {
      const tasks = await getFixtureTasks(fixture.id);
      pendingTasks += tasks.filter(t => t.status !== 'done').length;
    } catch (error) {
      // Ignore errors
    }
  }

  let lowStockItems = 0;
  try {
    const lowStock = await getLowStockItems(clubId);
    lowStockItems = lowStock.length;
  } catch (error) {
    // Ignore errors
  }

  return {
    pendingTasks,
    lowStockItems,
    upcomingMatches: upcomingFixtures.length,
  };
};
