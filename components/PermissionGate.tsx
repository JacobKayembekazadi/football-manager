/**
 * PermissionGate Component
 *
 * Conditionally renders children based on user permissions.
 * Use this to hide UI elements users don't have access to.
 * Part of Independence & Leverage feature set - Phase 2.
 */

import React from 'react';
import { PermissionModule, PermissionAction } from '../types';

interface PermissionGateProps {
  // What permission is required
  module: PermissionModule;
  action?: PermissionAction; // Defaults to 'view'
  
  // Permission check function from usePermission hook
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  
  // Content to render if permitted
  children: React.ReactNode;
  
  // Optional fallback if not permitted (default: null)
  fallback?: React.ReactNode;
  
  // If true, shows children even without permission (useful for debugging)
  bypass?: boolean;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  action = 'view',
  hasPermission,
  children,
  fallback = null,
  bypass = false,
}) => {
  // Check if user has the required permission
  const isPermitted = bypass || hasPermission(module, action);
  
  if (isPermitted) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * RequireAdmin Component
 * 
 * Only renders children if user is an admin.
 */
interface RequireAdminProps {
  isAdmin: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({
  isAdmin,
  children,
  fallback = null,
}) => {
  if (isAdmin) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

/**
 * PermissionBadge Component
 * 
 * Shows a small badge indicating permission level for debugging/admin UI.
 */
interface PermissionBadgeProps {
  module: PermissionModule;
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  showAll?: boolean;
}

export const PermissionBadge: React.FC<PermissionBadgeProps> = ({
  module,
  hasPermission,
  showAll = false,
}) => {
  const actions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve'];
  const granted = actions.filter(action => hasPermission(module, action));
  
  if (granted.length === 0) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
        No Access
      </span>
    );
  }
  
  if (granted.length === actions.length) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
        Full Access
      </span>
    );
  }
  
  if (showAll) {
    return (
      <div className="flex gap-1">
        {actions.map(action => (
          <span
            key={action}
            className={`text-[10px] px-1 py-0.5 rounded ${
              granted.includes(action)
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-500/20 text-slate-500'
            }`}
          >
            {action[0].toUpperCase()}
          </span>
        ))}
      </div>
    );
  }
  
  return (
    <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">
      {granted.length}/{actions.length}
    </span>
  );
};

export default PermissionGate;
