/**
 * Handover Service
 *
 * Handles bulk task reassignment for quick handovers.
 * Part of Independence & Leverage feature set - Phase 6.
 */

import { HandoverRequest, HandoverResult, FixtureTask, ClubUser, ClubRoleName } from '../types';
import { getTasksForFixtures, updateFixtureTask } from './fixtureTaskService';
import { getClubUsers } from './userService';
import { getFixtures } from './fixtureService';
import { logAuditEvent } from './auditService';

/**
 * Execute a handover - bulk reassign tasks from one user to another
 */
export const executeHandover = async (
  clubId: string,
  actorUserId: string,
  request: HandoverRequest
): Promise<HandoverResult> => {
  const errors: string[] = [];
  let tasksAffected = 0;

  try {
    // Get upcoming fixtures
    const fixtures = await getFixtures(clubId);
    const now = new Date();
    const upcomingFixtures = fixtures.filter(
      f => new Date(f.kickoff_time) >= now && f.status !== 'Cancelled'
    );

    if (upcomingFixtures.length === 0) {
      return { success: true, tasksAffected: 0 };
    }

    // Determine which fixture IDs to process based on scope
    let fixtureIds: string[] = [];
    if (request.scope === 'all') {
      fixtureIds = upcomingFixtures.map(f => f.id);
    } else if (request.scope === 'fixture' && request.fixtureId) {
      fixtureIds = [request.fixtureId];
    } else if (request.scope === 'pack') {
      // All fixtures - we'll filter tasks by pack later
      fixtureIds = upcomingFixtures.map(f => f.id);
    }

    // Get all tasks for these fixtures
    const allTasks = await getTasksForFixtures(fixtureIds);

    // Filter tasks by owner
    let tasksToReassign = allTasks.filter(t => t.owner_user_id === request.fromUserId);

    // Further filter by pack if applicable
    if (request.scope === 'pack' && request.templatePackId) {
      tasksToReassign = tasksToReassign.filter(t => t.template_pack_id === request.templatePackId);
    }

    // Only reassign incomplete tasks
    tasksToReassign = tasksToReassign.filter(t => !t.is_completed);

    if (tasksToReassign.length === 0) {
      return { success: true, tasksAffected: 0 };
    }

    // Determine the target user
    let targetUserId: string | null = null;

    if (request.target === 'user' && request.toUserId) {
      targetUserId = request.toUserId;
    } else if (request.target === 'backup') {
      // Use each task's backup user
      // This is handled per-task below
    } else if (request.target === 'role' && request.toRole) {
      // Find first available user with this role
      const users = await getClubUsers(clubId);
      const targetUser = users.find(
        u => u.status === 'active' && u.primary_role?.name === request.toRole
      );
      if (targetUser) {
        targetUserId = targetUser.id;
      } else {
        errors.push(`No active user found with role: ${request.toRole}`);
      }
    }

    // Reassign each task
    for (const task of tasksToReassign) {
      try {
        let newOwnerId: string | null = targetUserId;

        // For backup target, use task's backup user
        if (request.target === 'backup') {
          if (task.backup_user_id) {
            newOwnerId = task.backup_user_id;
          } else {
            // Skip tasks without backup
            continue;
          }
        }

        if (!newOwnerId) {
          continue;
        }

        await updateFixtureTask(task.id, {
          owner_user_id: newOwnerId,
        });

        tasksAffected++;
      } catch (err) {
        errors.push(`Failed to reassign task: ${task.label}`);
      }
    }

    // Log the handover event
    await logAuditEvent(
      clubId,
      actorUserId,
      'handover.executed',
      {
        from_user_id: request.fromUserId,
        to_user_id: targetUserId,
        target_type: request.target,
        scope: request.scope,
        fixture_id: request.fixtureId,
        pack_id: request.templatePackId,
        tasks_affected: tasksAffected,
      }
    );

    return {
      success: errors.length === 0,
      tasksAffected,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Handover error:', error);
    return {
      success: false,
      tasksAffected,
      errors: ['An unexpected error occurred during handover'],
    };
  }
};

/**
 * Preview a handover - see how many tasks would be affected without executing
 */
export const previewHandover = async (
  clubId: string,
  request: HandoverRequest
): Promise<{ tasksAffected: number; tasks: FixtureTask[] }> => {
  try {
    // Get upcoming fixtures
    const fixtures = await getFixtures(clubId);
    const now = new Date();
    const upcomingFixtures = fixtures.filter(
      f => new Date(f.kickoff_time) >= now && f.status !== 'Cancelled'
    );

    if (upcomingFixtures.length === 0) {
      return { tasksAffected: 0, tasks: [] };
    }

    // Determine which fixture IDs to process based on scope
    let fixtureIds: string[] = [];
    if (request.scope === 'all') {
      fixtureIds = upcomingFixtures.map(f => f.id);
    } else if (request.scope === 'fixture' && request.fixtureId) {
      fixtureIds = [request.fixtureId];
    } else if (request.scope === 'pack') {
      fixtureIds = upcomingFixtures.map(f => f.id);
    }

    // Get all tasks for these fixtures
    const allTasks = await getTasksForFixtures(fixtureIds);

    // Filter tasks by owner
    let tasksToReassign = allTasks.filter(t => t.owner_user_id === request.fromUserId);

    // Further filter by pack if applicable
    if (request.scope === 'pack' && request.templatePackId) {
      tasksToReassign = tasksToReassign.filter(t => t.template_pack_id === request.templatePackId);
    }

    // Only incomplete tasks
    tasksToReassign = tasksToReassign.filter(t => !t.is_completed);

    // For backup target, only count tasks with backup users
    if (request.target === 'backup') {
      tasksToReassign = tasksToReassign.filter(t => t.backup_user_id);
    }

    return {
      tasksAffected: tasksToReassign.length,
      tasks: tasksToReassign,
    };
  } catch (error) {
    console.error('Preview handover error:', error);
    return { tasksAffected: 0, tasks: [] };
  }
};

/**
 * Get users who have tasks assigned (for the "from" dropdown)
 */
export const getUsersWithTasks = async (
  clubId: string,
  fixtureId?: string
): Promise<ClubUser[]> => {
  try {
    // Get upcoming fixtures
    const fixtures = await getFixtures(clubId);
    const now = new Date();
    const upcomingFixtures = fixtures.filter(
      f => new Date(f.kickoff_time) >= now && f.status !== 'Cancelled'
    );

    const fixtureIds = fixtureId
      ? [fixtureId]
      : upcomingFixtures.map(f => f.id);

    if (fixtureIds.length === 0) {
      return [];
    }

    // Get all tasks
    const allTasks = await getTasksForFixtures(fixtureIds);

    // Get unique owner IDs from incomplete tasks
    const ownerIds = new Set<string>();
    allTasks.forEach(t => {
      if (t.owner_user_id && !t.is_completed) {
        ownerIds.add(t.owner_user_id);
      }
    });

    // Get user details
    const users = await getClubUsers(clubId);
    return users.filter(u => ownerIds.has(u.id));
  } catch (error) {
    console.error('Error getting users with tasks:', error);
    return [];
  }
};
