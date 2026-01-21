/**
 * TaskOwnerSelector Component
 *
 * Dropdown to assign task ownership to a user.
 * Part of Independence & Leverage feature set - Phase 3.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ClubUser, ClubRole } from '../types';
import { getClubUsers } from '../services/userService';
import UserAvatar from './UserAvatar';
import RoleBadge from './RoleBadge';
import { ChevronDown, User, UserPlus, X } from 'lucide-react';

interface TaskOwnerSelectorProps {
  clubId: string;
  currentOwnerId?: string;
  currentBackupId?: string;
  ownerRole?: string;
  onOwnerChange: (userId: string | null) => void;
  onBackupChange?: (userId: string | null) => void;
  size?: 'sm' | 'md';
  showBackup?: boolean;
  disabled?: boolean;
}

const TaskOwnerSelector: React.FC<TaskOwnerSelectorProps> = ({
  clubId,
  currentOwnerId,
  currentBackupId,
  ownerRole,
  onOwnerChange,
  onBackupChange,
  size = 'sm',
  showBackup = false,
  disabled = false,
}) => {
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectingBackup, setSelectingBackup] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUsers = async () => {
      const data = await getClubUsers(clubId);
      setUsers(data.filter(u => u.status === 'active'));
    };
    loadUsers();
  }, [clubId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingBackup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOwner = users.find(u => u.id === currentOwnerId);
  const currentBackup = users.find(u => u.id === currentBackupId);

  // Filter users by role if specified
  const filteredUsers = ownerRole
    ? users.filter(u => u.roles?.some(r => r.name === ownerRole))
    : users;

  const handleSelect = (userId: string | null) => {
    if (selectingBackup) {
      onBackupChange?.(userId);
      setSelectingBackup(false);
    } else {
      onOwnerChange(userId);
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'h-7 text-xs',
    md: 'h-9 text-sm',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={
          'flex items-center gap-2 px-2 rounded-lg border transition-colors ' +
          sizeClasses[size] + ' ' +
          (disabled
            ? 'bg-slate-800/50 border-slate-700 cursor-not-allowed'
            : 'bg-white/5 border-white/10 hover:border-white/20')
        }
      >
        {currentOwner ? (
          <>
            <UserAvatar user={currentOwner} size="sm" />
            <span className="text-white truncate max-w-[80px]">{currentOwner.name.split(' ')[0]}</span>
            {currentBackup && showBackup && (
              <span className="text-slate-500 text-[10px]">+B</span>
            )}
          </>
        ) : ownerRole ? (
          <>
            <RoleBadge role={ownerRole} size="sm" showIcon={false} />
            <span className="text-slate-400">Unassigned</span>
          </>
        ) : (
          <>
            <User size={14} className="text-slate-500" />
            <span className="text-slate-400">Assign</span>
          </>
        )}
        <ChevronDown size={12} className="text-slate-500 ml-auto" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-30 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {selectingBackup ? 'Select Backup' : 'Assign Owner'}
            </span>
            {selectingBackup && (
              <button
                onClick={() => setSelectingBackup(false)}
                className="text-slate-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* User List */}
          <div className="max-h-48 overflow-y-auto">
            {/* Unassign option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-slate-700 border border-dashed border-slate-500 flex items-center justify-center">
                <X size={10} className="text-slate-500" />
              </div>
              <span className="text-sm text-slate-400">Unassign</span>
            </button>

            {filteredUsers.map(user => {
              const isSelected = selectingBackup
                ? user.id === currentBackupId
                : user.id === currentOwnerId;

              return (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user.id)}
                  className={
                    'w-full px-3 py-2 text-left hover:bg-white/5 flex items-center gap-2 ' +
                    (isSelected ? 'bg-green-500/10' : '')
                  }
                >
                  <UserAvatar user={user} size="sm" showStatus />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white truncate block">{user.name}</span>
                    {user.primary_role && (
                      <span className="text-[10px] text-slate-500">{user.primary_role.name}</span>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-green-500 text-xs"></span>
                  )}
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                No users available
              </div>
            )}
          </div>

          {/* Backup option */}
          {showBackup && !selectingBackup && currentOwnerId && (
            <div className="border-t border-white/10 p-2">
              <button
                onClick={() => setSelectingBackup(true)}
                className="w-full px-2 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded flex items-center gap-2"
              >
                <UserPlus size={12} />
                {currentBackup ? `Change backup (${currentBackup.name.split(' ')[0]})` : 'Add backup'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskOwnerSelector;
