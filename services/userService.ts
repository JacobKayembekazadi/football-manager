/**
 * User Service
 *
 * Handles CRUD operations for club users.
 * Part of Independence & Leverage feature set.
 */

import { supabase } from './supabaseClient';
import { ClubUser, ClubRole, INITIAL_CLUB_USERS, INITIAL_ROLES } from '../types';
import { generateDemoUUID } from '../utils/uuid';

const isDemo = () => !supabase;

const STORAGE_KEYS = {
  USERS: 'pitchside_demo_club_users',
  ROLES: 'pitchside_demo_club_roles',
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

// ============================================================================
// Roles
// ============================================================================

export const getRoles = async (clubId: string): Promise<ClubRole[]> => {
  if (isDemo()) {
    const stored = getItem<ClubRole[]>(STORAGE_KEYS.ROLES, []);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.ROLES, INITIAL_ROLES);
      return INITIAL_ROLES;
    }
    return stored.filter((r: ClubRole) => r.club_id === clubId);
  }

  const { data, error } = await supabase
    .from('club_roles')
    .select('*')
    .eq('club_id', clubId)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createRole = async (clubId: string, role: Partial<ClubRole>): Promise<ClubRole> => {
  const newRole: ClubRole = {
    id: generateDemoUUID('role', Date.now()),
    club_id: clubId,
    name: role.name || 'New Role',
    color: role.color || 'slate',
    is_system: false,
  };

  if (isDemo()) {
    const roles = getItem<ClubRole[]>(STORAGE_KEYS.ROLES, INITIAL_ROLES);
    setItem(STORAGE_KEYS.ROLES, [...roles, newRole]);
    return newRole;
  }

  const { data, error } = await supabase
    .from('club_roles')
    .insert(newRole)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================================================
// Users
// ============================================================================

export const getClubUsers = async (clubId: string): Promise<ClubUser[]> => {
  if (isDemo()) {
    const stored = getItem<ClubUser[]>(STORAGE_KEYS.USERS, []);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.USERS, INITIAL_CLUB_USERS);
      return INITIAL_CLUB_USERS;
    }
    return stored.filter((u: ClubUser) => u.club_id === clubId);
  }

  const { data, error } = await supabase
    .from('club_users')
    .select(`
      *,
      user_roles (
        is_primary,
        role:club_roles (*)
      )
    `)
    .eq('club_id', clubId)
    .order('name');

  if (error) throw error;

  // Transform to include roles array and primary_role
  return (data || []).map((user: any) => ({
    ...user,
    roles: user.user_roles?.map((ur: any) => ur.role) || [],
    primary_role: user.user_roles?.find((ur: any) => ur.is_primary)?.role || null,
  }));
};

export const getClubUser = async (userId: string): Promise<ClubUser | null> => {
  if (isDemo()) {
    const users = getItem<ClubUser[]>(STORAGE_KEYS.USERS, INITIAL_CLUB_USERS);
    return users.find((u: ClubUser) => u.id === userId) || null;
  }

  const { data, error } = await supabase
    .from('club_users')
    .select(`
      *,
      user_roles (
        is_primary,
        role:club_roles (*)
      )
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;

  return {
    ...data,
    roles: data.user_roles?.map((ur: any) => ur.role) || [],
    primary_role: data.user_roles?.find((ur: any) => ur.is_primary)?.role || null,
  };
};

export const createClubUser = async (
  clubId: string,
  user: Partial<ClubUser>,
  roleIds: string[] = [],
  primaryRoleId?: string
): Promise<ClubUser> => {
  const roles = await getRoles(clubId);
  const assignedRoles = roles.filter(r => roleIds.includes(r.id));
  const primaryRole = roles.find(r => r.id === primaryRoleId) || assignedRoles[0];

  const newUser: ClubUser = {
    id: generateDemoUUID('clubuser', Date.now()),
    club_id: clubId,
    email: user.email || '',
    name: user.name || '',
    avatar_url: user.avatar_url,
    status: 'active',
    created_at: new Date().toISOString(),
    roles: assignedRoles,
    primary_role: primaryRole,
  };

  if (isDemo()) {
    const users = getItem<ClubUser[]>(STORAGE_KEYS.USERS, INITIAL_CLUB_USERS);
    setItem(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  }

  // Create user
  const { data: userData, error: userError } = await supabase
    .from('club_users')
    .insert({
      club_id: clubId,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      status: 'active',
    })
    .select()
    .single();

  if (userError) throw userError;

  // Assign roles
  if (roleIds.length > 0) {
    const userRoles = roleIds.map(roleId => ({
      user_id: userData.id,
      role_id: roleId,
      is_primary: roleId === primaryRoleId,
    }));

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert(userRoles);

    if (roleError) throw roleError;
  }

  return { ...userData, roles: assignedRoles, primary_role: primaryRole };
};

export const updateClubUser = async (
  userId: string,
  updates: Partial<ClubUser>
): Promise<ClubUser> => {
  if (isDemo()) {
    const users = getItem<ClubUser[]>(STORAGE_KEYS.USERS, INITIAL_CLUB_USERS);
    const index = users.findIndex((u: ClubUser) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const updated = { ...users[index], ...updates };
    users[index] = updated;
    setItem(STORAGE_KEYS.USERS, users);
    return updated;
  }

  const { data, error } = await supabase
    .from('club_users')
    .update({
      name: updates.name,
      email: updates.email,
      avatar_url: updates.avatar_url,
      status: updates.status,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUserStatus = async (
  userId: string,
  status: ClubUser['status']
): Promise<ClubUser> => {
  return updateClubUser(userId, { status });
};

export const deleteClubUser = async (userId: string): Promise<void> => {
  if (isDemo()) {
    const users = getItem<ClubUser[]>(STORAGE_KEYS.USERS, INITIAL_CLUB_USERS);
    setItem(STORAGE_KEYS.USERS, users.filter((u: ClubUser) => u.id !== userId));
    return;
  }

  // Delete user roles first (cascade should handle this, but explicit is safer)
  await supabase.from('user_roles').delete().eq('user_id', userId);

  const { error } = await supabase
    .from('club_users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
};

// ============================================================================
// User Roles
// ============================================================================

export const assignRole = async (
  userId: string,
  roleId: string,
  isPrimary: boolean = false
): Promise<void> => {
  if (isDemo()) {
    const users = getItem<ClubUser[]>(STORAGE_KEYS.USERS, INITIAL_CLUB_USERS);
    const roles = getItem<ClubRole[]>(STORAGE_KEYS.ROLES, INITIAL_ROLES);
    const user = users.find((u: ClubUser) => u.id === userId);
    const role = roles.find((r: ClubRole) => r.id === roleId);

    if (user && role) {
      if (!user.roles) user.roles = [];
      if (!user.roles.find((r: ClubRole) => r.id === roleId)) {
        user.roles.push(role);
      }
      if (isPrimary) {
        user.primary_role = role;
      }
      setItem(STORAGE_KEYS.USERS, users);
    }
    return;
  }

  // If setting as primary, first unset other primary roles for this user
  if (isPrimary) {
    await supabase
      .from('user_roles')
      .update({ is_primary: false })
      .eq('user_id', userId);
  }

  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role_id: roleId,
      is_primary: isPrimary,
    });

  if (error) throw error;
};

export const removeRole = async (userId: string, roleId: string): Promise<void> => {
  if (isDemo()) {
    const users = getItem<ClubUser[]>(STORAGE_KEYS.USERS, INITIAL_CLUB_USERS);
    const user = users.find((u: ClubUser) => u.id === userId);

    if (user && user.roles) {
      user.roles = user.roles.filter((r: ClubRole) => r.id !== roleId);
      if (user.primary_role?.id === roleId) {
        user.primary_role = user.roles[0] || undefined;
      }
      setItem(STORAGE_KEYS.USERS, users);
    }
    return;
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) throw error;
};

// ============================================================================
// Helpers
// ============================================================================

export const getUsersByRole = async (clubId: string, roleName: string): Promise<ClubUser[]> => {
  const users = await getClubUsers(clubId);
  return users.filter(user =>
    user.roles?.some(role => role.name === roleName)
  );
};

export const getAvailableUsers = async (clubId: string): Promise<ClubUser[]> => {
  const users = await getClubUsers(clubId);
  return users.filter(user => user.status === 'active');
};

export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
