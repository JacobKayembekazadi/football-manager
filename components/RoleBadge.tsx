/**
 * RoleBadge Component
 *
 * Displays a styled badge for a user's role.
 * Part of Independence & Leverage feature set.
 */

import React from 'react';
import { ClubRole, getRoleColorClass } from '../types';
import { Shield, Clipboard, Megaphone, Shirt, Banknote, Users } from 'lucide-react';

interface RoleBadgeProps {
  role: ClubRole | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const roleIcons: Record<string, React.ElementType> = {
  Admin: Shield,
  Coach: Clipboard,
  Ops: Users,
  Media: Megaphone,
  Kit: Shirt,
  Finance: Banknote,
};

const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'sm',
  showIcon = true,
  className = '',
}) => {
  const roleName = typeof role === 'string' ? role : role.name;
  const roleColor = typeof role === 'string' ? 'slate' : role.color;
  const colorClass = getRoleColorClass(roleColor);
  const Icon = roleIcons[roleName];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${colorClass}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      {roleName}
    </span>
  );
};

export default RoleBadge;
