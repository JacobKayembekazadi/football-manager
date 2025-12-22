/**
 * TaskFormModal
 * 
 * Modal for creating and editing admin tasks.
 * Used by AdminSentinel for Add/Edit operations.
 */

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { AdminTask } from '../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<AdminTask, 'id'>) => Promise<void>;
  editingTask?: AdminTask | null;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
}) => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [taskType, setTaskType] = useState<'League' | 'Finance' | 'Facilities' | 'Media'>('League');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDeadline(editingTask.deadline);
      setPriority(editingTask.priority);
      setTaskType(editingTask.type);
      setStatus(editingTask.status);
    } else {
      resetForm();
    }
  }, [editingTask, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDeadline('');
    setPriority('Medium');
    setTaskType('League');
    setStatus('Pending');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!deadline) {
      setError('Deadline is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        deadline,
        priority,
        type: taskType,
        status,
        action_plan: undefined,
        email_draft: undefined,
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'border-red-500 bg-red-500/10 text-red-400';
      case 'Medium': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
      case 'Low': return 'border-green-500 bg-green-500/10 text-green-400';
      default: return 'border-white/10 bg-white/5 text-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(239,68,68,0.1)] overflow-hidden animate-fade-in">
        {/* Header gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={20} />
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Submit player registration forms"
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:border-red-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Deadline *
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-red-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 px-3 rounded-lg font-display font-bold uppercase tracking-wider text-xs transition-all border ${
                      priority === p
                        ? getPriorityColor(p)
                        : 'border-white/10 bg-white/5 text-slate-500 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {p === 'High' && <AlertTriangle size={12} className="inline mr-1" />}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Category
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as 'League' | 'Finance' | 'Facilities' | 'Media')}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-red-500/50 focus:outline-none transition-colors"
                >
                  <option value="League">League</option>
                  <option value="Finance">Finance</option>
                  <option value="Facilities">Facilities</option>
                  <option value="Media">Media</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Pending' | 'In Progress' | 'Completed')}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-red-500/50 focus:outline-none transition-colors"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-lg transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : editingTask ? (
                'Update Task'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;



