/**
 * Equipment Service (Grassroots Model)
 *
 * Simplified equipment management for grassroots football clubs:
 * - Player kit assignments (who has what number/size)
 * - Club equipment inventory (shared items)
 * - Match day bag checklists
 * - Kit requests
 * - Laundry tracking
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import {
  PlayerKitAssignment,
  ClubEquipment,
  MatchDayChecklist,
  KitRequest,
  LaundryBatch,
  LaundryStatus,
} from '../types';
import {
  getDemoKitAssignments,
  saveDemoKitAssignment,
  deleteDemoKitAssignment,
  getDemoClubEquipment,
  saveDemoClubEquipment,
  deleteDemoClubEquipment,
  getDemoMatchDayChecklist,
  updateDemoMatchDayChecklist,
  toggleDemoChecklistItem,
  addDemoChecklistItem,
  getDemoKitRequests,
  saveDemoKitRequest,
  deleteDemoKitRequest,
  getDemoLaundryBatches,
  getDemoActiveLaundry,
  createDemoLaundryBatch,
  updateDemoLaundryStatus,
  deleteDemoLaundryBatch,
  getDemoEquipmentSummary,
} from './demoStorageService';

// ============================================================================
// Player Kit Assignments
// ============================================================================

export const getKitAssignments = async (clubId: string): Promise<PlayerKitAssignment[]> => {
  // Demo mode only for now (no Supabase tables exist for new model)
  return getDemoKitAssignments(clubId);
};

export const saveKitAssignment = async (assignment: PlayerKitAssignment): Promise<PlayerKitAssignment> => {
  return saveDemoKitAssignment(assignment);
};

export const deleteKitAssignment = async (assignmentId: string): Promise<void> => {
  deleteDemoKitAssignment(assignmentId);
};

// ============================================================================
// Club Equipment (Shared Inventory)
// ============================================================================

export const getClubEquipment = async (clubId: string): Promise<ClubEquipment[]> => {
  return getDemoClubEquipment(clubId);
};

export const saveClubEquipment = async (item: ClubEquipment): Promise<ClubEquipment> => {
  return saveDemoClubEquipment(item);
};

export const deleteClubEquipment = async (itemId: string): Promise<void> => {
  deleteDemoClubEquipment(itemId);
};

// ============================================================================
// Match Day Checklists
// ============================================================================

export const getMatchDayChecklist = async (
  clubId: string,
  fixtureId: string
): Promise<MatchDayChecklist> => {
  return getDemoMatchDayChecklist(clubId, fixtureId);
};

export const updateMatchDayChecklist = async (
  checklist: MatchDayChecklist
): Promise<MatchDayChecklist> => {
  return updateDemoMatchDayChecklist(checklist);
};

export const toggleChecklistItem = async (
  clubId: string,
  fixtureId: string,
  itemId: string
): Promise<MatchDayChecklist> => {
  return toggleDemoChecklistItem(clubId, fixtureId, itemId);
};

export const addChecklistItem = async (
  clubId: string,
  fixtureId: string,
  label: string
): Promise<MatchDayChecklist> => {
  return addDemoChecklistItem(clubId, fixtureId, label);
};

// ============================================================================
// Kit Requests
// ============================================================================

export const getKitRequests = async (clubId: string): Promise<KitRequest[]> => {
  return getDemoKitRequests(clubId);
};

export const getPendingKitRequests = async (clubId: string): Promise<KitRequest[]> => {
  const all = await getKitRequests(clubId);
  return all.filter(r => r.status === 'pending');
};

export const saveKitRequest = async (request: KitRequest): Promise<KitRequest> => {
  return saveDemoKitRequest(request);
};

export const deleteKitRequest = async (requestId: string): Promise<void> => {
  deleteDemoKitRequest(requestId);
};

// ============================================================================
// Laundry Tracking
// ============================================================================

export const getLaundryBatches = async (clubId: string): Promise<LaundryBatch[]> => {
  return getDemoLaundryBatches(clubId);
};

export const getActiveLaundry = async (clubId: string): Promise<LaundryBatch[]> => {
  return getDemoActiveLaundry(clubId);
};

export const createLaundryBatch = async (
  clubId: string,
  kitCount: number,
  fixtureId?: string,
  notes?: string
): Promise<LaundryBatch> => {
  return createDemoLaundryBatch(clubId, kitCount, fixtureId, notes);
};

export const updateLaundryStatus = async (
  batchId: string,
  status: LaundryStatus
): Promise<LaundryBatch | null> => {
  return updateDemoLaundryStatus(batchId, status);
};

export const deleteLaundryBatch = async (batchId: string): Promise<void> => {
  deleteDemoLaundryBatch(batchId);
};

// ============================================================================
// Summary & Stats (for notifications/dashboard)
// ============================================================================

export const getEquipmentSummary = async (clubId: string): Promise<{
  totalPlayers: number;
  playersWithKit: number;
  kitNeedsReplacing: number;
  pendingRequests: number;
  laundryInProgress: number;
}> => {
  return getDemoEquipmentSummary(clubId);
};

/**
 * Get items that need attention (for notifications)
 * Returns kit assignments that need replacing
 */
export const getKitNeedingAttention = async (clubId: string): Promise<PlayerKitAssignment[]> => {
  const assignments = await getKitAssignments(clubId);
  return assignments.filter(k => k.kit_condition === 'needs_replacing' || k.kit_condition === 'worn');
};

/**
 * Legacy compatibility - returns empty array as there's no "low stock" concept in new model
 * The new model focuses on kit assignments to players, not inventory quantity tracking
 */
export const getLowStockItems = async (_clubId: string): Promise<any[]> => {
  // New model doesn't have "low stock" - returns empty for compatibility
  return [];
};
