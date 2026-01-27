/**
 * ContinueButton Component
 *
 * Persistent button that navigates to the next incomplete task.
 * Stays visible as a sticky footer across task views.
 *
 * Routing logic: next task = lowest index task where status != completed
 */

import React from 'react';
import { ArrowRight, CheckCircle2, PartyPopper } from 'lucide-react';

interface Task {
  id: string;
  label: string;
  is_completed: boolean;
  sort_order?: number;
  fixture_id?: string;
}

interface ContinueButtonProps {
  tasks: Task[];
  onContinue: (nextTask: Task) => void;
  onAllComplete?: () => void;
  currentTaskId?: string;
  className?: string;
}

const ContinueButton: React.FC<ContinueButtonProps> = ({
  tasks,
  onContinue,
  onAllComplete,
  currentTaskId,
  className = '',
}) => {
  // Find next incomplete task (lowest index where is_completed = false)
  const sortedTasks = [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const getNextTask = (): Task | null => {
    // If we have a current task, find the next incomplete after it
    if (currentTaskId) {
      const currentIndex = sortedTasks.findIndex(t => t.id === currentTaskId);
      if (currentIndex !== -1) {
        // Look for next incomplete task after current
        for (let i = currentIndex + 1; i < sortedTasks.length; i++) {
          if (!sortedTasks[i].is_completed) {
            return sortedTasks[i];
          }
        }
      }
    }

    // Default: find first incomplete task
    return sortedTasks.find(t => !t.is_completed) || null;
  };

  const nextTask = getNextTask();
  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const allComplete = completedCount === totalCount && totalCount > 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleClick = () => {
    if (allComplete && onAllComplete) {
      onAllComplete();
    } else if (nextTask) {
      onContinue(nextTask);
    }
  };

  // Don't render if no tasks
  if (totalCount === 0) return null;

  return (
    <div className={`sticky bottom-0 left-0 right-0 z-40 ${className}`}>
      {/* Progress bar */}
      <div className="h-1 bg-slate-800 w-full">
        <div
          className="h-full bg-green-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Button area */}
      <div className="bg-slate-900/95 backdrop-blur-lg border-t border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Progress info */}
          <div className="flex items-center gap-3 text-sm">
            {allComplete ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 size={18} />
                <span className="font-medium">All tasks complete!</span>
              </div>
            ) : (
              <>
                <span className="text-slate-400">
                  {completedCount}/{totalCount} done
                </span>
                {nextTask && (
                  <span className="text-slate-500 hidden sm:inline truncate max-w-[200px]">
                    Next: {nextTask.label}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Continue button */}
          <button
            onClick={handleClick}
            disabled={!nextTask && !allComplete}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm
              transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
              ${allComplete
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                : 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            `}
          >
            {allComplete ? (
              <>
                <PartyPopper size={18} />
                Done for Today
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContinueButton;
