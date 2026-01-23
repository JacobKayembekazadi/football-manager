/**
 * MyTasks Component
 *
 * Shows all tasks assigned to the current user across upcoming fixtures.
 * Part of Independence & Leverage feature set - Phase 3.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Calendar,
  MapPin,
  AlertCircle,
  ListTodo,
} from 'lucide-react';
import { FixtureTask, Fixture, ClubUser } from '../types';
import { getTasksForFixtures, toggleTaskCompletion } from '../services/fixtureTaskService';
import { getFixtures } from '../services/fixtureService';
import ContinueButton from './ContinueButton';

interface MyTasksProps {
  clubId: string;
  currentUser: ClubUser;
  onTaskComplete?: () => void;
  onNavigateToTask?: (fixtureId: string, taskId: string) => void;
}

interface TaskWithFixture extends FixtureTask {
  fixture?: Fixture;
}

const MyTasks: React.FC<MyTasksProps> = ({
  clubId,
  currentUser,
  onTaskComplete,
  onNavigateToTask,
}) => {
  const [tasks, setTasks] = useState<TaskWithFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadMyTasks();
  }, [clubId, currentUser.id]);

  const loadMyTasks = async () => {
    try {
      setLoading(true);
      // Get upcoming fixtures
      const fixtures = await getFixtures(clubId);
      const now = new Date();
      const upcomingFixtures = fixtures.filter(
        f => new Date(f.kickoff_time) >= now && f.status !== 'Cancelled'
      );

      if (upcomingFixtures.length === 0) {
        setTasks([]);
        return;
      }

      // Get all tasks for upcoming fixtures
      const fixtureIds = upcomingFixtures.map(f => f.id);
      const allTasks = await getTasksForFixtures(fixtureIds);

      // Filter to my tasks (owner or backup)
      const myTasks = allTasks.filter(
        t => t.owner_user_id === currentUser.id || t.backup_user_id === currentUser.id
      );

      // Attach fixture info
      const tasksWithFixtures: TaskWithFixture[] = myTasks.map(task => ({
        ...task,
        fixture: upcomingFixtures.find(f => f.id === task.fixture_id),
      }));

      // Sort by fixture date, then by incomplete first
      tasksWithFixtures.sort((a, b) => {
        // Incomplete tasks first
        if (a.is_completed !== b.is_completed) {
          return a.is_completed ? 1 : -1;
        }
        // Then by fixture date
        const dateA = a.fixture ? new Date(a.fixture.kickoff_time).getTime() : 0;
        const dateB = b.fixture ? new Date(b.fixture.kickoff_time).getTime() : 0;
        return dateA - dateB;
      });

      setTasks(tasksWithFixtures);
    } catch (error) {
      console.error('Error loading my tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: TaskWithFixture) => {
    setTogglingId(task.id);
    try {
      const updated = await toggleTaskCompletion(task.id, !task.is_completed, currentUser.id);
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? { ...updated, fixture: task.fixture } : t))
      );
      setRefreshTrigger(prev => prev + 1); // Trigger continue button refresh
      onTaskComplete?.();
    } catch (error) {
      console.error('Error toggling task:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return `Today, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    if (isTomorrow) return `Tomorrow, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const isBackup = (task: TaskWithFixture) => task.backup_user_id === currentUser.id && task.owner_user_id !== currentUser.id;

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListTodo size={18} className="text-blue-500" />
          <h3 className="text-white font-semibold">My Tasks</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-green-500" />
          </div>
          <p className="text-slate-400 text-sm">No tasks assigned to you</p>
          <p className="text-slate-500 text-xs mt-1">Claim tasks from upcoming fixtures</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-blue-500" />
          <h3 className="text-white font-semibold">My Tasks</h3>
          <span className="text-xs text-slate-500">
            {completedCount}/{totalCount} done
          </span>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`p-3 rounded-lg border transition-all ${
              task.is_completed
                ? 'bg-green-500/5 border-green-500/20'
                : isBackup(task)
                ? 'bg-amber-500/5 border-amber-500/20'
                : 'bg-slate-800/50 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <button
                onClick={() => handleToggleTask(task)}
                disabled={togglingId === task.id}
                className="flex-shrink-0 mt-0.5"
              >
                {togglingId === task.id ? (
                  <Loader2 size={18} className="animate-spin text-slate-400" />
                ) : task.is_completed ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <Circle size={18} className="text-slate-500 hover:text-white" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      task.is_completed ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {task.label}
                  </span>
                  {isBackup(task) && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                      Backup
                    </span>
                  )}
                </div>

                {/* Fixture Info */}
                {task.fixture && (
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="font-medium">{task.fixture.opponent}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDateTime(task.fixture.kickoff_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {task.fixture.venue}
                    </span>
                  </div>
                )}

                {/* Due date warning */}
                {task.due_at && !task.is_completed && new Date(task.due_at) < new Date() && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                    <AlertCircle size={10} />
                    Overdue
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      {onNavigateToTask && (
        <div className="mt-4">
          <ContinueButton
            clubId={clubId}
            onNavigate={onNavigateToTask}
            refreshTrigger={refreshTrigger}
            variant="default"
          />
        </div>
      )}
    </div>
  );
};

export default MyTasks;
