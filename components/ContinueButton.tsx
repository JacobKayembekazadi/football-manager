/**
 * ContinueButton Component
 *
 * A persistent button that navigates to the next incomplete task.
 * Part of D14 - Final UX & Language Tweaks.
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Calendar, Users, FileText, TrendingUp, X, ChevronUp } from 'lucide-react';
import { getTaskStatus, NextTaskResult, TaskStatusResult } from '../services/fixtureTaskService';

interface ContinueButtonProps {
  clubId: string;
  currentFixtureId?: string;
  onNavigate: (fixtureId: string, taskId: string) => void;
  onSuggestedAction?: (action: string) => void; // For "Done for today" suggestions
  refreshTrigger?: number; // Increment to trigger refresh
  variant?: 'default' | 'compact' | 'global'; // Added 'global' variant for app-level use
}

const ContinueButton: React.FC<ContinueButtonProps> = ({
  clubId,
  currentFixtureId,
  onNavigate,
  onSuggestedAction,
  refreshTrigger = 0,
  variant = 'default',
}) => {
  const [nextTask, setNextTask] = useState<NextTaskResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskStatus, setTaskStatus] = useState<TaskStatusResult | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadNextTask();
  }, [clubId, currentFixtureId, refreshTrigger]);

  const loadNextTask = async () => {
    try {
      setLoading(true);
      const status = await getTaskStatus(clubId, currentFixtureId);
      setTaskStatus(status);
      setNextTask(status.nextTask);
    } catch (error) {
      console.error('Error loading next task:', error);
      setTaskStatus({ hasUpcomingFixtures: false, totalTasks: 0, completedTasks: 0, nextTask: null });
    } finally {
      setLoading(false);
    }
  };

  // Determine if all tasks are truly done (fixtures exist, tasks exist, all completed)
  const allDone = taskStatus?.hasUpcomingFixtures && taskStatus.totalTasks > 0 && taskStatus.completedTasks === taskStatus.totalTasks;

  // If no fixtures or no tasks, don't show anything for global variant (only after loading)
  const shouldHide = !loading && variant === 'global' && (!taskStatus?.hasUpcomingFixtures || taskStatus.totalTasks === 0);

  const handleClick = () => {
    if (nextTask) {
      onNavigate(nextTask.fixture.id, nextTask.task.id);
    }
  };

  // Format task label for display (truncate if too long)
  const formatTaskLabel = (label: string, maxLength: number = 30) => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  };

  // Compact variant for inline use
  if (variant === 'compact') {
    if (loading) {
      return (
        <button
          disabled
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-400 text-sm rounded-lg"
        >
          <Loader2 size={14} className="animate-spin" />
          <span>Loading...</span>
        </button>
      );
    }

    // No fixtures/tasks - show nothing for compact
    if (!taskStatus?.hasUpcomingFixtures || taskStatus.totalTasks === 0) {
      return null;
    }

    if (allDone) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 text-sm rounded-lg">
          <CheckCircle2 size={14} />
          <span>All done!</span>
        </div>
      );
    }

    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 text-sm rounded-lg transition-all"
      >
        <span>Continue</span>
        <ArrowRight size={14} />
      </button>
    );
  }

  // For global variant, hide completely if no fixtures or no tasks
  if (shouldHide) {
    return null;
  }

  // Default sticky footer variant
  if (loading) {
    return (
      <div className={variant === 'global' ? 'fixed bottom-20 md:bottom-6 right-4 md:right-24 z-30' : 'sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent'}>
        <button
          disabled
          className={variant === 'global'
            ? 'flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-400 rounded-xl shadow-lg'
            : 'w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-700/50 text-slate-400 rounded-xl'
          }
        >
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Finding tasks...</span>
        </button>
      </div>
    );
  }

  // Suggested actions for "Done for today" card
  const suggestedActions = [
    { id: 'schedule', icon: Calendar, label: 'Schedule a fixture', color: 'text-blue-400' },
    { id: 'squad', icon: Users, label: 'Check squad availability', color: 'text-purple-400' },
    { id: 'content', icon: FileText, label: 'Create some content', color: 'text-amber-400' },
    { id: 'dashboard', icon: TrendingUp, label: 'View dashboard', color: 'text-green-400' },
  ];

  // "Done for today" card - only show when tasks exist and all are completed
  if (allDone) {
    // Default/Global variant - full card with suggestions
    // If collapsed, show a small expand button instead
    if (isCollapsed && variant === 'global') {
      return (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-24 z-30">
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-500 rounded-xl transition-all shadow-lg"
          >
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">{taskStatus?.completedTasks}/{taskStatus?.totalTasks} done</span>
            <ChevronUp size={14} />
          </button>
        </div>
      );
    }

    return (
      <div className={`${variant === 'global' ? 'fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-24 md:w-80 z-30' : 'sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent'}`}>
        <div className={`bg-slate-900/95 backdrop-blur-xl border border-green-500/30 rounded-2xl overflow-hidden shadow-2xl ${variant === 'global' ? '' : ''}`}>
          {/* Header */}
          <div className="p-4 bg-green-500/10 border-b border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Done for today!</h3>
                  <p className="text-xs text-slate-400">{taskStatus?.completedTasks} of {taskStatus?.totalTasks} tasks completed</p>
                </div>
              </div>
              {variant === 'global' && (
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Collapse"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="p-3">
            <p className="text-xs text-slate-500 mb-2 px-1">What's next?</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => onSuggestedAction?.(action.id)}
                  className="flex items-center gap-2 p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all text-left"
                >
                  <action.icon size={14} className={action.color} />
                  <span className="text-xs text-slate-300">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Global variant - floating button
  if (variant === 'global') {
    const remaining = (taskStatus?.totalTasks || 0) - (taskStatus?.completedTasks || 0);
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-24 md:w-80 z-30">
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between gap-3 px-5 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-green-500/30"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-green-900/70 font-normal uppercase tracking-wide">
              {remaining} task{remaining !== 1 ? 's' : ''} remaining
            </span>
            <span className="text-sm">{formatTaskLabel(nextTask?.task.label || '', 25)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-green-900/60">vs {nextTask?.fixture.opponent}</span>
            </div>
            <ArrowRight size={18} />
          </div>
        </button>
      </div>
    );
  }

  // Default variant - sticky footer
  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between gap-3 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20"
      >
        <div className="flex flex-col items-start">
          <span className="text-xs text-green-900/70 font-normal">Next task</span>
          <span className="text-sm">{formatTaskLabel(nextTask?.task.label || '')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-900/70">
            vs {nextTask?.fixture.opponent}
          </span>
          <ArrowRight size={18} />
        </div>
      </button>
    </div>
  );
};

export default ContinueButton;
