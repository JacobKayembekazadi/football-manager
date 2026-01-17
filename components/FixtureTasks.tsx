/**
 * FixtureTasks Component
 *
 * Displays a checklist of tasks for a specific fixture with ability to:
 * - Check/uncheck tasks
 * - Add custom tasks
 * - View task completion progress
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
} from 'lucide-react';
import { FixtureTask, Fixture } from '../types';
import {
  getFixtureTasks,
  toggleTaskCompletion,
  addFixtureTask,
  deleteFixtureTask,
  generateTasksFromTemplates,
} from '../services/fixtureTaskService';

interface FixtureTasksProps {
  fixture: Fixture;
  clubId: string;
  onTasksChange?: () => void;
}

const FixtureTasks: React.FC<FixtureTasksProps> = ({
  fixture,
  clubId,
  onTasksChange,
}) => {
  const [tasks, setTasks] = useState<FixtureTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [fixture.id]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getFixtureTasks(fixture.id);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: FixtureTask) => {
    setTogglingId(task.id);
    try {
      const updated = await toggleTaskCompletion(task.id, !task.is_completed);
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
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

  const handleGenerateTasks = async () => {
    try {
      setLoading(true);
      const generated = await generateTasksFromTemplates(
        clubId,
        fixture.id,
        fixture.venue
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
          {tasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                task.is_completed
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-slate-800/50 border-white/10 hover:border-white/20'
              }`}
            >
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
              <span
                className={`flex-1 text-sm ${
                  task.is_completed ? 'text-slate-400 line-through' : 'text-white'
                }`}
              >
                {task.label}
              </span>
              {!task.template_pack_id && (
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
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
    </div>
  );
};

export default FixtureTasks;
