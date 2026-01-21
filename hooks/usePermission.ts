/**
 * usePermission Hook
 *
 * React hook for checking user permissions.
 * Part of Independence & Leverage feature set - Phase 2.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Permission, PermissionModule, PermissionAction, ClubUser, ClubRole } from '../types';
import {
  getPermissions,
  userHasPermission,
  canAccessModule,
  getAccessibleModules,
  canView,
  canCreate,
  canEdit,
  canDelete,
  canApprove,
} from '../services/permissionService';

interface UsePermissionOptions {
  clubId: string;
  currentUser: ClubUser | null;
}

interface UsePermissionReturn {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  // Quick checks
  hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  canAccessModule: (module: PermissionModule) => boolean;
  accessibleModules: PermissionModule[];
  // Specific action checks
  canView: (module: PermissionModule) => boolean;
  canCreate: (module: PermissionModule) => boolean;
  canEdit: (module: PermissionModule) => boolean;
  canDelete: (module: PermissionModule) => boolean;
  canApprove: (module: PermissionModule) => boolean;
  // Is admin check
  isAdmin: boolean;
  // Refresh
  refresh: () => Promise<void>;
}

export function usePermission({ clubId, currentUser }: UsePermissionOptions): UsePermissionReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadPermissions = useCallback(async () => {
    if (!clubId) return;
    
    try {
      setLoading(true);
      const perms = await getPermissions(clubId);
      setPermissions(perms);
      setError(null);
    } catch (err) {
      setError('Failed to load permissions');
      console.error('Permission load error:', err);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Permission check functions
  const hasPermission = useCallback(
    (module: PermissionModule, action: PermissionAction) => {
      if (isAdmin) return true; // Admin can do everything
      return userHasPermission(permissions, roleIds, module, action);
    },
    [permissions, roleIds, isAdmin]
  );

  const checkCanAccessModule = useCallback(
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

  // Specific action checks
  const checkCanView = useCallback(
    (module: PermissionModule) => isAdmin || canView(permissions, roleIds, module),
    [permissions, roleIds, isAdmin]
  );

  const checkCanCreate = useCallback(
    (module: PermissionModule) => isAdmin || canCreate(permissions, roleIds, module),
    [permissions, roleIds, isAdmin]
  );

  const checkCanEdit = useCallback(
    (module: PermissionModule) => isAdmin || canEdit(permissions, roleIds, module),
    [permissions, roleIds, isAdmin]
  );

  const checkCanDelete = useCallback(
    (module: PermissionModule) => isAdmin || canDelete(permissions, roleIds, module),
    [permissions, roleIds, isAdmin]
  );

  const checkCanApprove = useCallback(
    (module: PermissionModule) => isAdmin || canApprove(permissions, roleIds, module),
    [permissions, roleIds, isAdmin]
  );

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canAccessModule: checkCanAccessModule,
    accessibleModules,
    canView: checkCanView,
    canCreate: checkCanCreate,
    canEdit: checkCanEdit,
    canDelete: checkCanDelete,
    canApprove: checkCanApprove,
    isAdmin,
    refresh: loadPermissions,
  };
}

export default usePermission;
