/**
 * Permission Service
 *
 * Handles RBAC (Role-Based Access Control) for the app.
 * Part of Independence & Leverage feature set - Phase 2.
 */

import { supabase } from './supabaseClient';
import { Permission, PermissionModule, PermissionAction, ClubRole, INITIAL_ROLES } from '../types';

const isDemo = () => !supabase;

const STORAGE_KEY = 'pitchside_demo_permissions';

// Default permission matrix - what each role can do
// 'full' means all actions: view, create, edit, delete, approve
export const DEFAULT_PERMISSIONS: Record<string, Record<PermissionModule, PermissionAction[]>> = {
  Admin: {
    fixtures: ['view', 'create', 'edit', 'delete', 'approve'],
    content: ['view', 'create', 'edit', 'delete', 'approve'],
    equipment: ['view', 'create', 'edit', 'delete', 'approve'],
    squad: ['view', 'create', 'edit', 'delete', 'approve'],
    finance: ['view', 'create', 'edit', 'delete', 'approve'],
    settings: ['view', 'create', 'edit', 'delete', 'approve'],
    templates: ['view', 'create', 'edit', 'delete', 'approve'],
  },
  Coach: {
    fixtures: ['view', 'edit'],
    content: ['view'],
    equipment: ['view'],
    squad: ['view', 'create', 'edit', 'delete'],
    finance: [],
    settings: [],
    templates: ['view'],
  },
  Ops: {
    fixtures: ['view'],
    content: ['view'],
    equipment: ['view', 'create', 'edit', 'delete'],
    squad: ['view'],
    finance: [],
    settings: [],
    templates: ['view', 'edit'],
  },
  Media: {
    fixtures: ['view'],
    content: ['view', 'create', 'edit', 'delete', 'approve'],
    equipment: ['view'],
    squad: ['view'],
    finance: [],
    settings: [],
    templates: ['view', 'edit'],
  },
  Kit: {
    fixtures: ['view'],
    content: ['view'],
    equipment: ['view', 'create', 'edit', 'delete'],
    squad: ['view'],
    finance: [],
    settings: [],
    templates: ['view', 'edit'],
  },
  Finance: {
    fixtures: ['view'],
    content: ['view'],
    equipment: ['view'],
    squad: ['view'],
    finance: ['view', 'create', 'edit', 'delete', 'approve'],
    settings: [],
    templates: [],
  },
};

// Generic localStorage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// Generate flat permission array from default matrix
function generateDefaultPermissions(clubId: string, roles: ClubRole[]): Permission[] {
  const permissions: Permission[] = [];
  
  for (const role of roles) {
    const rolePerms = DEFAULT_PERMISSIONS[role.name];
    if (!rolePerms) continue;
    
    for (const [module, actions] of Object.entries(rolePerms)) {
      for (const action of actions) {
        permissions.push({
          role_id: role.id,
          module: module as PermissionModule,
          action: action as PermissionAction,
        });
      }
    }
  }
  
  return permissions;
}

// ============================================================================
// Permission Queries
// ============================================================================

export const getPermissions = async (clubId: string): Promise<Permission[]> => {
  if (isDemo()) {
    const stored = getItem<Permission[]>(STORAGE_KEY, []);
    if (!stored || stored.length === 0) {
      // Initialize with default permissions
      const defaults = generateDefaultPermissions(clubId, INITIAL_ROLES);
      setItem(STORAGE_KEY, defaults);
      return defaults;
    }
    return stored;
  }

  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('club_id', clubId);

  if (error) throw error;
  return data || [];
};

export const getRolePermissions = async (roleId: string): Promise<Permission[]> => {
  const allPerms = await getPermissions(''); // Club ID not needed for filtering
  return allPerms.filter(p => p.role_id === roleId);
};

// ============================================================================
// Permission Checks
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export const roleHasPermission = (
  permissions: Permission[],
  roleId: string,
  module: PermissionModule,
  action: PermissionAction
): boolean => {
  return permissions.some(
    p => p.role_id === roleId && p.module === module && p.action === action
  );
};

/**
 * Check if any of the user's roles have the permission
 */
export const userHasPermission = (
  permissions: Permission[],
  roleIds: string[],
  module: PermissionModule,
  action: PermissionAction
): boolean => {
  return roleIds.some(roleId => roleHasPermission(permissions, roleId, module, action));
};

/**
 * Check if user can access a module at all (has 'view' permission)
 */
export const canAccessModule = (
  permissions: Permission[],
  roleIds: string[],
  module: PermissionModule
): boolean => {
  return userHasPermission(permissions, roleIds, module, 'view');
};

/**
 * Get all modules a user can access
 */
export const getAccessibleModules = (
  permissions: Permission[],
  roleIds: string[]
): PermissionModule[] => {
  const modules: PermissionModule[] = ['fixtures', 'content', 'equipment', 'squad', 'finance', 'settings', 'templates'];
  return modules.filter(module => canAccessModule(permissions, roleIds, module));
};

// ============================================================================
// Permission Management (Admin only)
// ============================================================================

export const grantPermission = async (
  roleId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<void> => {
  if (isDemo()) {
    const perms = getItem<Permission[]>(STORAGE_KEY, []);
    const exists = perms.some(
      p => p.role_id === roleId && p.module === module && p.action === action
    );
    if (!exists) {
      perms.push({ role_id: roleId, module, action });
      setItem(STORAGE_KEY, perms);
    }
    return;
  }

  const { error } = await supabase
    .from('permissions')
    .upsert({ role_id: roleId, module, action });

  if (error) throw error;
};

export const revokePermission = async (
  roleId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<void> => {
  if (isDemo()) {
    const perms = getItem<Permission[]>(STORAGE_KEY, []);
    const filtered = perms.filter(
      p => !(p.role_id === roleId && p.module === module && p.action === action)
    );
    setItem(STORAGE_KEY, filtered);
    return;
  }

  const { error } = await supabase
    .from('permissions')
    .delete()
    .eq('role_id', roleId)
    .eq('module', module)
    .eq('action', action);

  if (error) throw error;
};

// ============================================================================
// Quick Permission Helpers
// ============================================================================

export const canView = (permissions: Permission[], roleIds: string[], module: PermissionModule) =>
  userHasPermission(permissions, roleIds, module, 'view');

export const canCreate = (permissions: Permission[], roleIds: string[], module: PermissionModule) =>
  userHasPermission(permissions, roleIds, module, 'create');

export const canEdit = (permissions: Permission[], roleIds: string[], module: PermissionModule) =>
  userHasPermission(permissions, roleIds, module, 'edit');

export const canDelete = (permissions: Permission[], roleIds: string[], module: PermissionModule) =>
  userHasPermission(permissions, roleIds, module, 'delete');

export const canApprove = (permissions: Permission[], roleIds: string[], module: PermissionModule) =>
  userHasPermission(permissions, roleIds, module, 'approve');
