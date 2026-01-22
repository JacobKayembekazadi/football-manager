/**
 * TeamSettings Component
 *
 * UI for managing club users, roles, and invites.
 * Part of Independence & Leverage feature set.
 */

import React, { useState, useEffect } from 'react';
import { ClubUser, ClubRole } from '../types';
import {
  getClubUsers,
  getRoles,
  createClubUser,
  updateUserStatus,
  deleteClubUser,
} from '../services/userService';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';
import { useToast } from './Toast';
import {
  Users,
  Plus,
  MoreVertical,
  Mail,
  UserMinus,
  UserCheck,
  Clock,
  X,
  Check,
} from 'lucide-react';

interface TeamSettingsProps {
  clubId: string;
}

const TeamSettings: React.FC<TeamSettingsProps> = ({ clubId }) => {
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [roles, setRoles] = useState<ClubRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    loadData();
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        getClubUsers(clubId),
        getRoles(clubId),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: ClubUser['status']) => {
    try {
      await updateUserStatus(userId, newStatus);
      success('User status updated');
      await loadData();
    } catch (err) {
      error('Failed to update status');
    }
    setMenuOpenFor(null);
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Remove this user from the club?')) return;
    try {
      await deleteClubUser(userId);
      success('User removed');
      await loadData();
    } catch (err) {
      error('Failed to remove user');
    }
    setMenuOpenFor(null);
  };

  const activeUsers = users.filter(u => u.status === 'active');
  const unavailableUsers = users.filter(u => u.status === 'unavailable');
  const inactiveUsers = users.filter(u => u.status === 'inactive');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Users size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Team Members</h3>
            <p className="text-sm text-slate-400">{users.length} members</p>
          </div>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          Invite Member
        </button>
      </div>

      {/* Roles Overview */}
      <div className="glass-card p-4 rounded-xl border border-white/10">
        <h4 className="text-sm font-bold text-slate-300 mb-3">Roles</h4>
        <div className="flex flex-wrap gap-2">
          {roles.map(role => (
            <RoleBadge key={role.id} role={role} size="md" />
          ))}
        </div>
      </div>

      {/* Active Users */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <UserCheck size={14} className="text-green-500" />
          Active ({activeUsers.length})
        </h4>
        <div className="space-y-2">
          {activeUsers.map(user => (
            <UserRow
              key={user.id}
              user={user}
              menuOpen={menuOpenFor === user.id}
              onMenuToggle={() => setMenuOpenFor(menuOpenFor === user.id ? null : user.id)}
              onStatusChange={handleStatusChange}
              onRemove={handleRemoveUser}
            />
          ))}
        </div>
      </div>

      {/* Unavailable Users */}
      {unavailableUsers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            Unavailable ({unavailableUsers.length})
          </h4>
          <div className="space-y-2">
            {unavailableUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                menuOpen={menuOpenFor === user.id}
                onMenuToggle={() => setMenuOpenFor(menuOpenFor === user.id ? null : user.id)}
                onStatusChange={handleStatusChange}
                onRemove={handleRemoveUser}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Users */}
      {inactiveUsers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <UserMinus size={14} className="text-slate-500" />
            Inactive ({inactiveUsers.length})
          </h4>
          <div className="space-y-2 opacity-60">
            {inactiveUsers.map(user => (
              <UserRow
                key={user.id}
                user={user}
                menuOpen={menuOpenFor === user.id}
                onMenuToggle={() => setMenuOpenFor(menuOpenFor === user.id ? null : user.id)}
                onStatusChange={handleStatusChange}
                onRemove={handleRemoveUser}
              />
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          clubId={clubId}
          roles={roles}
          onClose={() => setShowInviteModal(false)}
          onInvite={async (name, email, roleIds) => {
            try {
              await createClubUser(clubId, { name, email }, roleIds, roleIds[0]);
              success(name + ' added to team');
              await loadData();
              setShowInviteModal(false);
            } catch (err) {
              error('Failed to add member');
            }
          }}
        />
      )}
    </div>
  );
};

// User Row Component
interface UserRowProps {
  user: ClubUser;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onStatusChange: (userId: string, status: ClubUser['status']) => void;
  onRemove: (userId: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  menuOpen,
  onMenuToggle,
  onStatusChange,
  onRemove,
}) => {
  return (
    <div className="glass-card p-3 rounded-xl border border-white/10 flex items-center gap-3 hover:border-white/20 transition-colors">
      <UserAvatar user={user} size="lg" showStatus />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{user.name}</span>
          {user.primary_role && (
            <RoleBadge role={user.primary_role} size="sm" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Mail size={10} />
          <span className="truncate">{user.email}</span>
        </div>
      </div>

      {/* Additional Roles */}
      {user.roles && user.roles.length > 1 && (
        <div className="hidden md:flex items-center gap-1">
          {user.roles
            .filter(r => r.id !== user.primary_role?.id)
            .map(role => (
              <RoleBadge key={role.id} role={role} size="sm" showIcon={false} />
            ))}
        </div>
      )}

      {/* Menu */}
      <div className="relative">
        <button
          onClick={onMenuToggle}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-20 animate-scale-in overflow-hidden">
            {user.status !== 'active' && (
              <button
                onClick={() => onStatusChange(user.id, 'active')}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"
              >
                <UserCheck size={14} className="text-green-500" />
                Mark as Active
              </button>
            )}
            {user.status !== 'unavailable' && (
              <button
                onClick={() => onStatusChange(user.id, 'unavailable')}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"
              >
                <Clock size={14} className="text-amber-500" />
                Mark as Unavailable
              </button>
            )}
            {user.status !== 'inactive' && (
              <button
                onClick={() => onStatusChange(user.id, 'inactive')}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2"
              >
                <UserMinus size={14} className="text-slate-500" />
                Mark as Inactive
              </button>
            )}
            <hr className="border-white/10 my-1" />
            <button
              onClick={() => onRemove(user.id)}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
            >
              <X size={14} />
              Remove from Club
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Invite Modal Component
interface InviteModalProps {
  clubId: string;
  roles: ClubRole[];
  onClose: () => void;
  onInvite: (name: string, email: string, roleIds: string[]) => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ clubId, roles, onClose, onInvite }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedRoles.length === 0) return;
    onInvite(name.trim(), email.trim(), selectedRoles);
  };

  const isRoleSelected = (roleId: string) => selectedRoles.includes(roleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-xl animate-scale-in">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-purple-500 to-amber-500" />

        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-1">Add Team Member</h2>
          <p className="text-sm text-slate-400 mb-6">Add a new member to your club</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Roles *</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => {
                  const selected = isRoleSelected(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={
                        'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ' +
                        (selected
                          ? 'bg-green-500/20 border-green-500/50 text-green-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20')
                      }
                    >
                      {selected && <Check size={12} className="inline mr-1" />}
                      {role.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || selectedRoles.length === 0}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors"
              >
                Add Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamSettings;
