/**
 * ContinueButton Component
 *
 * A persistent button that navigates to the next incomplete task.
 * Part of D14 - Final UX & Language Tweaks.
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Loader2, Calendar, Users, FileText, TrendingUp } from 'lucide-react';
import { getNextIncompleteTask, NextTaskResult } from '../services/fixtureTaskService';

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
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    loadNextTask();
  }, [clubId, currentFixtureId, refreshTrigger]);

  const loadNextTask = async () => {
    try {
      setLoading(true);
      const result = await getNextIncompleteTask(clubId, currentFixtureId);
      setNextTask(result);
      setAllDone(result === null);
    } catch (error) {
      console.error('Error loading next task:', error);
      setAllDone(true);
    } finally {
      setLoading(false);
    }
  };

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

  // Default sticky footer variant
  if (loading) {
    return (
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-700/50 text-slate-400 rounded-xl"
        >
          <Loader2 size={18} className="animate-spin" />
          <span>Finding next task...</span>
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

  // "Done for today" card
  if (allDone) {
    // Compact variant - simple inline message
    if (variant === 'compact') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 text-sm rounded-lg">
          <CheckCircle2 size={14} />
          <span>All done!</span>
        </div>
      );
    }

    // Default/Global variant - full card with suggestions
    return (
      <div className={`${variant === 'global' ? 'fixed bottom-20 md:bottom-24 left-4 right-4 md:left-6 md:right-auto md:w-80 z-30' : 'sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent'}`}>
        <div className={`bg-slate-900/95 backdrop-blur-xl border border-green-500/30 rounded-2xl overflow-hidden shadow-2xl ${variant === 'global' ? '' : ''}`}>
          {/* Header */}
          <div className="p-4 bg-green-500/10 border-b border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Done for today!</h3>
                <p className="text-xs text-slate-400">All tasks completed</p>
              </div>
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

  // Global variant - floating button (positioned on left to avoid AI assistant on right)
  if (variant === 'global') {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:w-80 z-30">
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between gap-3 px-5 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-green-500/30"
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-green-900/70 font-normal uppercase tracking-wide">Continue</span>
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
