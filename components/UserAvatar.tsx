/**
 * UserAvatar Component
 *
 * Displays a user's avatar with initials fallback and status indicator.
 * Part of Independence & Leverage feature set.
 */

import React from 'react';
import { ClubUser } from '../types';
import { getUserInitials } from '../services/userService';

interface UserAvatarProps {
  user: ClubUser | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const statusColors = {
  active: 'bg-green-500',
  inactive: 'bg-slate-500',
  unavailable: 'bg-amber-500',
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showStatus = false,
  className = '',
}) => {
  if (!user) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-slate-700 border border-dashed border-slate-500 flex items-center justify-center text-slate-500 ${className}`}
        title="Unassigned"
      >
        ?
      </div>
    );
  }

  const initials = getUserInitials(user.name);
  const roleColor = user.primary_role?.color || 'slate';

  // Generate a consistent background color based on user name
  const bgColorMap: Record<string, string> = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    pink: 'bg-pink-600',
    amber: 'bg-amber-600',
    green: 'bg-green-600',
    slate: 'bg-slate-600',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-white/20`}
          title={user.name}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${bgColorMap[roleColor] || 'bg-slate-600'} rounded-full flex items-center justify-center font-bold text-white border border-white/20`}
          title={user.name}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${statusColors[user.status]} rounded-full border-2 border-[#0a0a0a]`}
          title={user.status}
        />
      )}
    </div>
  );
};

export default UserAvatar;
