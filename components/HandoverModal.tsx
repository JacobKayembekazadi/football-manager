/**
 * HandoverModal Component
 *
 * Quick handover modal for bulk task reassignment.
 * Part of Independence & Leverage feature set - Phase 6.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  Users,
  Calendar,
  Package,
} from 'lucide-react';
import {
  ClubUser,
  ClubRole,
  HandoverScope,
  HandoverTarget,
  HandoverRequest,
  Fixture,
  TemplatePack,
  INITIAL_ROLES,
} from '../types';
import { getClubUsers } from '../services/userService';
import { executeHandover, previewHandover, getUsersWithTasks } from '../services/handoverService';
import { getTemplatePacks } from '../services/fixtureTaskService';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';

interface HandoverModalProps {
  clubId: string;
  actorUserId: string;
  fixture?: Fixture;  // If provided, defaults to this fixture scope
  onClose: () => void;
  onComplete?: (tasksAffected: number) => void;
}

const HandoverModal: React.FC<HandoverModalProps> = ({
  clubId,
  actorUserId,
  fixture,
  onClose,
  onComplete,
}) => {
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [usersWithTasks, setUsersWithTasks] = useState<ClubUser[]>([]);
  const [packs, setPacks] = useState<TemplatePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  // Form state
  const [fromUserId, setFromUserId] = useState('');
  const [scope, setScope] = useState<HandoverScope>(fixture ? 'fixture' : 'all');
  const [selectedPackId, setSelectedPackId] = useState('');
  const [target, setTarget] = useState<HandoverTarget>('user');
  const [toUserId, setToUserId] = useState('');
  const [toRole, setToRole] = useState('');

  // Preview state
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Result state
  const [result, setResult] = useState<{ success: boolean; count: number; errors?: string[] } | null>(null);

  useEffect(() => {
    loadData();
  }, [clubId]);

  useEffect(() => {
    updatePreview();
  }, [fromUserId, scope, selectedPackId, target, toUserId, toRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, usersWithTasksData, packsData] = await Promise.all([
        getClubUsers(clubId),
        getUsersWithTasks(clubId, fixture?.id),
        getTemplatePacks(clubId),
      ]);
      setUsers(usersData.filter(u => u.status === 'active'));
      setUsersWithTasks(usersWithTasksData);
      setPacks(packsData);

      // Default to first user with tasks
      if (usersWithTasksData.length > 0) {
        setFromUserId(usersWithTasksData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async () => {
    if (!fromUserId || !isFormValid()) {
      setPreviewCount(null);
      return;
    }

    setPreviewLoading(true);
    try {
      const request = buildRequest();
      if (request) {
        const preview = await previewHandover(clubId, request);
        setPreviewCount(preview.tasksAffected);
      }
    } catch (error) {
      setPreviewCount(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const buildRequest = (): HandoverRequest | null => {
    if (!fromUserId) return null;

    return {
      fromUserId,
      scope,
      fixtureId: scope === 'fixture' ? fixture?.id : undefined,
      templatePackId: scope === 'pack' ? selectedPackId : undefined,
      target,
      toUserId: target === 'user' ? toUserId : undefined,
      toRole: target === 'role' ? toRole as any : undefined,
    };
  };

  const isFormValid = (): boolean => {
    if (!fromUserId) return false;
    if (scope === 'pack' && !selectedPackId) return false;
    if (target === 'user' && !toUserId) return false;
    if (target === 'role' && !toRole) return false;
    // Backup doesn't need additional selection
    return true;
  };

  const handleSubmit = async () => {
    const request = buildRequest();
    if (!request) return;

    setExecuting(true);
    try {
      const handoverResult = await executeHandover(clubId, actorUserId, request);
      setResult({
        success: handoverResult.success,
        count: handoverResult.tasksAffected,
        errors: handoverResult.errors,
      });

      if (handoverResult.success && handoverResult.tasksAffected > 0) {
        onComplete?.(handoverResult.tasksAffected);
      }
    } catch (error) {
      setResult({
        success: false,
        count: 0,
        errors: ['An unexpected error occurred'],
      });
    } finally {
      setExecuting(false);
    }
  };

  const fromUser = users.find(u => u.id === fromUserId);
  const toUser = users.find(u => u.id === toUserId);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <ArrowRightLeft className="text-purple-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Handover</h2>
              <p className="text-sm text-slate-400">Reassign tasks in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Result State */}
        {result ? (
          <div className="p-6 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              result.success ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {result.success ? (
                <CheckCircle2 size={32} className="text-green-500" />
              ) : (
                <AlertTriangle size={32} className="text-red-500" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {result.success ? 'Handover Complete' : 'Handover Failed'}
            </h3>
            <p className="text-slate-400 mb-4">
              {result.count} task{result.count !== 1 ? 's' : ''} reassigned
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-left">
                <p className="text-red-400 text-sm font-medium mb-1">Errors:</p>
                <ul className="text-red-300 text-xs list-disc list-inside">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="p-4 space-y-4">
              {/* From User */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Reassigning from
                </label>
                <select
                  value={fromUserId}
                  onChange={e => setFromUserId(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select user...</option>
                  {usersWithTasks.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.primary_role ? `(${user.primary_role.name})` : ''}
                    </option>
                  ))}
                </select>
                {fromUser && (
                  <div className="flex items-center gap-2 mt-2">
                    <UserAvatar user={fromUser} size="sm" />
                    <span className="text-sm text-white">{fromUser.name}</span>
                    {fromUser.primary_role && (
                      <RoleBadge role={fromUser.primary_role.name} size="sm" />
                    )}
                  </div>
                )}
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setScope('all')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      scope === 'all'
                        ? 'bg-green-500/20 border-green-500 text-green-500'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Users size={16} />
                    <span className="text-sm">All</span>
                  </button>
                  {fixture && (
                    <button
                      onClick={() => setScope('fixture')}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        scope === 'fixture'
                          ? 'bg-green-500/20 border-green-500 text-green-500'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Calendar size={16} />
                      <span className="text-sm">Fixture</span>
                    </button>
                  )}
                  <button
                    onClick={() => setScope('pack')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      scope === 'pack'
                        ? 'bg-green-500/20 border-green-500 text-green-500'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Package size={16} />
                    <span className="text-sm">Pack</span>
                  </button>
                </div>
                {scope === 'pack' && (
                  <select
                    value={selectedPackId}
                    onChange={e => setSelectedPackId(e.target.value)}
                    className="w-full mt-2 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select pack...</option>
                    {packs.map(pack => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Assign to
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    onClick={() => setTarget('user')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      target === 'user'
                        ? 'bg-green-500/20 border-green-500 text-green-500'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <User size={16} />
                    <span className="text-sm">Person</span>
                  </button>
                  <button
                    onClick={() => setTarget('role')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      target === 'role'
                        ? 'bg-green-500/20 border-green-500 text-green-500'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Users size={16} />
                    <span className="text-sm">Role</span>
                  </button>
                  <button
                    onClick={() => setTarget('backup')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      target === 'backup'
                        ? 'bg-green-500/20 border-green-500 text-green-500'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <User size={16} />
                    <span className="text-sm">Backup</span>
                  </button>
                </div>

                {target === 'user' && (
                  <select
                    value={toUserId}
                    onChange={e => setToUserId(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select person...</option>
                    {users.filter(u => u.id !== fromUserId).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.primary_role ? `(${user.primary_role.name})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {target === 'role' && (
                  <select
                    value={toRole}
                    onChange={e => setToRole(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select role...</option>
                    {INITIAL_ROLES.map(role => (
                      <option key={role.name} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}

                {target === 'backup' && (
                  <p className="text-xs text-slate-500 mt-2">
                    Each task will be assigned to its designated backup person
                  </p>
                )}
              </div>

              {/* Preview */}
              {previewCount !== null && (
                <div className="bg-slate-800/50 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Tasks affected:</span>
                  <span className="text-lg font-semibold text-white">
                    {previewLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      previewCount
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid() || previewCount === 0 || executing}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {executing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Reassigning...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft size={16} />
                    Handover Tasks
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HandoverModal;
