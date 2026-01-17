/**
 * Notification Service
 *
 * Aggregates events from various sources into notifications for Dashboard and Inbox.
 */

import { Club, Fixture, Player, AvailabilityStatus, FixtureTask } from '../types';
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
  | 'system';

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  description: string;
  timestamp: Date;
  category: 'availability' | 'tasks' | 'equipment' | 'content' | 'fixtures' | 'system';
  actionLabel?: string;
  actionTab?: string;
  metadata?: Record<string, any>;
  read?: boolean;
}

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

  let all = [
    ...availabilityNotifs,
    ...taskNotifs,
    ...equipmentNotifs,
    ...fixtureNotifs,
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
