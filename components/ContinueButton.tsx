/**
 * ContinueButton Component
 *
 * A persistent button that navigates to the next incomplete task.
 * Part of D14 - Final UX & Language Tweaks.
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { getNextIncompleteTask, NextTaskResult } from '../services/fixtureTaskService';

interface ContinueButtonProps {
  clubId: string;
  currentFixtureId?: string;
  onNavigate: (fixtureId: string, taskId: string) => void;
  refreshTrigger?: number; // Increment to trigger refresh
  variant?: 'default' | 'compact';
}

const ContinueButton: React.FC<ContinueButtonProps> = ({
  clubId,
  currentFixtureId,
  onNavigate,
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

  if (allDone) {
    return (
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent">
        <div className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl">
          <CheckCircle2 size={18} />
          <span className="font-semibold">All done!</span>
        </div>
      </div>
    );
  }

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
