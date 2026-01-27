/**
 * PermissionContext
 *
 * Provides permission state and checks throughout the app.
 * Part of Independence & Leverage feature set - Phase 2.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Permission, PermissionModule, PermissionAction, ClubUser, ClubRole, INITIAL_CLUB_USERS } from '../types';
import { getPermissions, userHasPermission, canAccessModule, getAccessibleModules } from '../services/permissionService';

interface PermissionContextValue {
  // Current user (for demo, first user is "logged in")
  currentUser: ClubUser | null;
  setCurrentUser: (user: ClubUser | null) => void;

  // Permissions
  permissions: Permission[];
  loading: boolean;

  // Quick checks
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  canAccess: (module: PermissionModule) => boolean;
  accessibleModules: PermissionModule[];

  // Specific action checks
  canView: (module: PermissionModule) => boolean;
  canCreate: (module: PermissionModule) => boolean;
  canEdit: (module: PermissionModule) => boolean;
  canDelete: (module: PermissionModule) => boolean;
  canApprove: (module: PermissionModule) => boolean;

  // Is admin
  isAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
  clubId: string;
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ clubId, children }) => {
  const [currentUser, setCurrentUser] = useState<ClubUser | null>(() => {
    // Default to first user (Jacob - Admin) for demo
    return INITIAL_CLUB_USERS[0] || null;
  });
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Get user's role IDs
  const roleIds = useMemo(() => {
    if (!currentUser?.roles) return [];
    return currentUser.roles.map((r: ClubRole) => r.id);
  }, [currentUser]);

  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!currentUser?.roles) return false;
    return currentUser.roles.some((r: ClubRole) => r.name === 'Admin');
  }, [currentUser]);

  // Load permissions
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        const perms = await getPermissions(clubId);
        setPermissions(perms);
      } catch (err) {
        console.error('Failed to load permissions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, [clubId]);

  // Permission check functions
  const hasPermission = useCallback(
    (module: PermissionModule, action: PermissionAction) => {
      if (isAdmin) return true;
      return userHasPermission(permissions, roleIds, module, action);
    },
    [permissions, roleIds, isAdmin]
  );

  const canAccess = useCallback(
    (module: PermissionModule) => {
      if (isAdmin) return true;
      return canAccessModule(permissions, roleIds, module);
    },
    [permissions, roleIds, isAdmin]
  );

  const accessibleModules = useMemo(() => {
    if (isAdmin) {
      return ['fixtures', 'content', 'equipment', 'squad', 'finance', 'settings', 'templates'] as PermissionModule[];
    }
    return getAccessibleModules(permissions, roleIds);
  }, [permissions, roleIds, isAdmin]);

  // Specific checks
  const canView = useCallback((m: PermissionModule) => hasPermission(m, 'view'), [hasPermission]);
  const canCreate = useCallback((m: PermissionModule) => hasPermission(m, 'create'), [hasPermission]);
  const canEdit = useCallback((m: PermissionModule) => hasPermission(m, 'edit'), [hasPermission]);
  const canDelete = useCallback((m: PermissionModule) => hasPermission(m, 'delete'), [hasPermission]);
  const canApprove = useCallback((m: PermissionModule) => hasPermission(m, 'approve'), [hasPermission]);

  const value: PermissionContextValue = {
    currentUser,
    setCurrentUser,
    permissions,
    loading,
    hasPermission,
    canAccess,
    accessibleModules,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    isAdmin,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissionContext = (): PermissionContextValue => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within PermissionProvider');
  }
  return context;
};

export default PermissionContext;
