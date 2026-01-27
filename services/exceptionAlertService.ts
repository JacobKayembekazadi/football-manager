/**
 * Exception Alert Service
 *
 * Handles risk assessment and exception alerts for at-risk tasks.
 * Part of Independence & Leverage feature set - Phase 7.
 */

import {
  FixtureTask,
  Fixture,
  RiskLevel,
  TaskRisk,
  RiskSummary,
  RISK_THRESHOLDS,
} from '../types';
import { getTasksForFixtures } from './fixtureTaskService';
import { getFixtures } from './fixtureService';

/**
 * Assess risk level for a single task
 */
export const assessTaskRisk = (
  task: FixtureTask,
  fixture?: Fixture
): TaskRisk => {
  const reasons: string[] = [];
  let level: RiskLevel = 'ok';

  // Skip completed tasks
  if (task.is_completed) {
    return { task, level: 'ok', reasons: [], fixture };
  }

  const now = new Date();

  // Check if overdue (due_at passed)
  if (task.due_at) {
    const dueDate = new Date(task.due_at);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue < RISK_THRESHOLDS.CRITICAL_HOURS) {
      level = 'critical';
      reasons.push('Overdue');
    } else if (hoursUntilDue < RISK_THRESHOLDS.WARNING_HOURS) {
      if (level !== 'critical') level = 'warning';
      reasons.push(`Due in ${Math.round(hoursUntilDue * 60)} minutes`);
    }
  }

  // Check if fixture is soon but task is unassigned
  if (fixture) {
    const kickoff = new Date(fixture.kickoff_time);
    const hoursUntilKickoff = (kickoff.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Critical: Kickoff within 2 hours and task is unassigned
    if (!task.owner_user_id) {
      if (hoursUntilKickoff < 2) {
        level = 'critical';
        reasons.push('Unassigned with kickoff soon');
      } else if (hoursUntilKickoff < 24) {
        if (level !== 'critical') level = 'warning';
        reasons.push('Unassigned');
      }
    }
  } else {
    // No fixture context, just check if unassigned
    if (!task.owner_user_id) {
      if (level !== 'critical') level = 'warning';
      reasons.push('Unassigned');
    }
  }

  return { task, level, reasons, fixture };
};

/**
 * Get risk summary for upcoming fixtures
 */
export const getRiskSummary = async (clubId: string): Promise<RiskSummary> => {
  try {
    // Get upcoming fixtures (next 7 days)
    const fixtures = await getFixtures(clubId);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingFixtures = fixtures.filter(f => {
      const kickoff = new Date(f.kickoff_time);
      return kickoff >= now && kickoff <= weekFromNow && f.status !== 'Cancelled';
    });

    if (upcomingFixtures.length === 0) {
      return {
        critical: 0,
        warning: 0,
        ok: 0,
        total: 0,
        criticalTasks: [],
        warningTasks: [],
      };
    }

    // Get all tasks for these fixtures
    const fixtureIds = upcomingFixtures.map(f => f.id);
    const allTasks = await getTasksForFixtures(fixtureIds);

    // Create fixture lookup
    const fixtureMap = new Map(upcomingFixtures.map(f => [f.id, f]));

    // Assess risk for each incomplete task
    const risks: TaskRisk[] = allTasks
      .filter(t => !t.is_completed)
      .map(task => assessTaskRisk(task, fixtureMap.get(task.fixture_id)));

    // Categorize
    const criticalTasks = risks.filter(r => r.level === 'critical');
    const warningTasks = risks.filter(r => r.level === 'warning');
    const okTasks = risks.filter(r => r.level === 'ok');

    return {
      critical: criticalTasks.length,
      warning: warningTasks.length,
      ok: okTasks.length,
      total: risks.length,
      criticalTasks,
      warningTasks,
    };
  } catch (error) {
    console.error('Error getting risk summary:', error);
    return {
      critical: 0,
      warning: 0,
      ok: 0,
      total: 0,
      criticalTasks: [],
      warningTasks: [],
    };
  }
};

/**
 * Get at-risk tasks for a specific fixture
 */
export const getFixtureRisks = async (
  clubId: string,
  fixtureId: string
): Promise<TaskRisk[]> => {
  try {
    const fixtures = await getFixtures(clubId);
    const fixture = fixtures.find(f => f.id === fixtureId);

    if (!fixture) {
      return [];
    }

    const tasks = await getTasksForFixtures([fixtureId]);

    return tasks
      .filter(t => !t.is_completed)
      .map(task => assessTaskRisk(task, fixture))
      .filter(r => r.level !== 'ok');
  } catch (error) {
    console.error('Error getting fixture risks:', error);
    return [];
  }
};

/**
 * Get count of at-risk items (for badge display)
 */
export const getAtRiskCount = async (clubId: string): Promise<{ critical: number; warning: number }> => {
  const summary = await getRiskSummary(clubId);
  return {
    critical: summary.critical,
    warning: summary.warning,
  };
};

/**
 * Format risk reason for display
 */
export const formatRiskReason = (risk: TaskRisk): string => {
  if (risk.reasons.length === 0) return 'At risk';
  return risk.reasons.join(', ');
};

/**
 * Get color class for risk level
 */
export const getRiskColorClass = (level: RiskLevel): string => {
  switch (level) {
    case 'critical':
      return 'text-red-500 bg-red-500/20';
    case 'warning':
      return 'text-amber-500 bg-amber-500/20';
    default:
      return 'text-green-500 bg-green-500/20';
  }
};

/**
 * Get badge color for risk level
 */
export const getRiskBadgeClass = (level: RiskLevel): string => {
  switch (level) {
    case 'critical':
      return 'bg-red-500 text-white';
    case 'warning':
      return 'bg-amber-500 text-black';
    default:
      return 'bg-green-500 text-black';
  }
};
