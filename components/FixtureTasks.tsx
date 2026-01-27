/**
 * FixtureTasks Component
 *
 * Displays a checklist of tasks for a specific fixture with ability to:
 * - Check/uncheck tasks
 * - Add custom tasks
 * - View task completion progress
 * - Assign task owners (Phase 3: Task Ownership)
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  X,
  Loader2,
  ListTodo,
  Trash2,
  User,
  Hand,
} from 'lucide-react';
import { FixtureTask, Fixture, ClubUser } from '../types';
import {
  getFixtureTasks,
  toggleTaskCompletion,
  addFixtureTask,
  deleteFixtureTask,
  generateTasksFromTemplates,
  updateFixtureTask,
} from '../services/fixtureTaskService';
import { getClubUsers } from '../services/userService';
import UserAvatar from './UserAvatar';
import TaskOwnerSelector from './TaskOwnerSelector';
import ContinueButton from './ContinueButton';

interface FixtureTasksProps {
  fixture: Fixture;
  clubId: string;
  currentUserId?: string;
  showOwnership?: boolean;
  onTasksChange?: () => void;
  onNavigateToTask?: (fixtureId: string, taskId: string) => void;
  showContinueButton?: boolean;
}

const FixtureTasks: React.FC<FixtureTasksProps> = ({
  fixture,
  clubId,
  currentUserId,
  showOwnership = true,
  onTasksChange,
  onNavigateToTask,
  showContinueButton = false,
}) => {
  const [tasks, setTasks] = useState<FixtureTask[]>([]);
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, [fixture.id, clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, usersData] = await Promise.all([
        getFixtureTasks(fixture.id),
        showOwnership ? getClubUsers(clubId) : Promise.resolve([]),
      ]);
      setTasks(tasksData);
      setUsers(usersData.filter(u => u.status === 'active'));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get user by ID for avatar display
  const getUserById = (userId?: string): ClubUser | undefined => {
    if (!userId) return undefined;
    return users.find(u => u.id === userId);
  };

  const handleToggleTask = async (task: FixtureTask) => {
    setTogglingId(task.id);
    try {
      const updated = await toggleTaskCompletion(task.id, !task.is_completed);
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
      setRefreshTrigger(prev => prev + 1); // Trigger continue button refresh
      onTasksChange?.();
    } catch (error) {
      console.error('Error toggling task:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskLabel.trim()) return;

    try {
      const newTask = await addFixtureTask(clubId, fixture.id, newTaskLabel.trim());
      setTasks(prev => [...prev, newTask]);
      setNewTaskLabel('');
      setShowAddTask(false);
      onTasksChange?.();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteFixtureTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      onTasksChange?.();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Phase 3: Task Ownership handlers
  const handleClaimTask = async (task: FixtureTask) => {
    if (!currentUserId) return;
    setAssigningId(task.id);
    try {
      const updated = await updateFixtureTask(task.id, {
        owner_user_id: currentUserId,
      });
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
      onTasksChange?.();
    } catch (error) {
      console.error('Error claiming task:', error);
    } finally {
      setAssigningId(null);
    }
  };

  const handleAssignOwner = async (taskId: string, userId: string | null) => {
    setAssigningId(taskId);
    try {
      const updated = await updateFixtureTask(taskId, {
        owner_user_id: userId,
      });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      onTasksChange?.();
    } catch (error) {
      console.error('Error assigning task owner:', error);
    } finally {
      setAssigningId(null);
    }
  };

  const handleAssignBackup = async (taskId: string, userId: string | null) => {
    setAssigningId(taskId);
    try {
      const updated = await updateFixtureTask(taskId, {
        backup_user_id: userId,
      });
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
      onTasksChange?.();
    } catch (error) {
      console.error('Error assigning backup:', error);
    } finally {
      setAssigningId(null);
    }
  };

  const handleGenerateTasks = async () => {
    try {
      setLoading(true);
      // Phase 4: Pass kickoff_time for auto-assignment and due date calculation
      const generated = await generateTasksFromTemplates(
        clubId,
        fixture.id,
        fixture.venue,
        fixture.kickoff_time
      );
      setTasks(prev => [...prev, ...generated]);
      onTasksChange?.();
    } catch (error) {
      console.error('Error generating tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo size={16} className="text-green-500" />
          <span className="text-sm font-semibold text-white">Match Tasks</span>
          <span className="text-xs text-slate-500">
            {completedCount}/{totalCount}
          </span>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
          </div>
        )}
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map(task => {
            const owner = getUserById(task.owner_user_id);
            const backup = getUserById(task.backup_user_id);
            const isMyTask = currentUserId && task.owner_user_id === currentUserId;
            const isUnassigned = !task.owner_user_id;

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  task.is_completed
                    ? 'bg-green-500/5 border-green-500/20'
                    : isMyTask
                    ? 'bg-blue-500/5 border-blue-500/20'
                    : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(task)}
                  disabled={togglingId === task.id}
                  className="flex-shrink-0"
                >
                  {togglingId === task.id ? (
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  ) : task.is_completed ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : (
                    <Circle size={20} className="text-slate-500 hover:text-white" />
                  )}
                </button>

                {/* Task Label */}
                <span
                  className={`flex-1 text-sm ${
                    task.is_completed ? 'text-slate-400 line-through' : 'text-white'
                  }`}
                >
                  {task.label}
                </span>

                {/* Owner Display & Actions */}
                {showOwnership && (
                  <div className="flex items-center gap-2">
                    {assigningId === task.id ? (
                      <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : owner ? (
                      /* Show owner avatar with tooltip */
                      <div className="flex items-center gap-1">
                        <UserAvatar user={owner} size="sm" showStatus />
                        {backup && (
                          <div className="relative -ml-2">
                            <UserAvatar user={backup} size="sm" />
                            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] bg-slate-700 text-slate-300 px-0.5 rounded">
                              B
                            </span>
                          </div>
                        )}
                      </div>
                    ) : isUnassigned && currentUserId ? (
                      /* Claim button for unassigned tasks */
                      <button
                        onClick={() => handleClaimTask(task)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <Hand size={12} />
                        Claim
                      </button>
                    ) : (
                      /* Unassigned indicator */
                      <div className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500">
                        <User size={12} />
                        <span>Unassigned</span>
                      </div>
                    )}

                    {/* Owner selector (for admins or task assignment) */}
                    {owner && (
                      <TaskOwnerSelector
                        clubId={clubId}
                        currentOwnerId={task.owner_user_id}
                        currentBackupId={task.backup_user_id}
                        ownerRole={task.owner_role}
                        onOwnerChange={(userId) => handleAssignOwner(task.id, userId)}
                        onBackupChange={(userId) => handleAssignBackup(task.id, userId)}
                        size="sm"
                        showBackup={true}
                      />
                    )}
                  </div>
                )}

                {/* Delete button for custom tasks */}
                {!task.template_pack_id && (
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
          <p className="text-slate-500 text-sm mb-3">No tasks for this fixture</p>
          <button
            onClick={handleGenerateTasks}
            className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 text-xs rounded-lg transition-all"
          >
            Generate from Templates
          </button>
        </div>
      )}

      {/* Add Custom Task */}
      {showAddTask ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTaskLabel}
            onChange={e => setNewTaskLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            placeholder="New task..."
            className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-green-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskLabel.trim()}
            className="px-3 py-2 bg-green-500 text-black text-sm font-semibold rounded-lg hover:bg-green-400 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowAddTask(false);
              setNewTaskLabel('');
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddTask(true)}
          className="w-full py-2 border border-dashed border-white/10 rounded-lg text-slate-500 hover:text-white hover:border-white/20 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={14} /> Add Task
        </button>
      )}

      {/* Continue Button */}
      {showContinueButton && onNavigateToTask && (
        <ContinueButton
          clubId={clubId}
          currentFixtureId={fixture.id}
          onNavigate={onNavigateToTask}
          refreshTrigger={refreshTrigger}
          variant="default"
        />
      )}
    </div>
  );
};

export default FixtureTasks;
