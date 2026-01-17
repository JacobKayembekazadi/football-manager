/**
 * Equipment Service
 *
 * Handles equipment inventory, assignments, and laundry tracking.
 */

import { supabase, TABLES, isSupabaseConfigured } from './supabaseClient';
import {
  EquipmentItem,
  EquipmentAssignment,
  EquipmentLaundry,
  EquipmentCategory,
  EquipmentCondition,
  LaundryItem,
  LaundryStatus,
  Player,
} from '../types';
import {
  getDemoEquipmentItems,
  saveDemoEquipmentItem,
  deleteDemoEquipmentItem,
  getDemoEquipmentAssignments,
  issueDemoEquipment,
  returnDemoEquipment,
  getDemoActiveLaundry,
  sendDemoToLaundry,
  returnDemoFromLaundry,
  getDemoInventorySummary,
  generateDemoId,
} from './demoStorageService';

// Extended types with joins
export interface EquipmentAssignmentWithDetails extends EquipmentAssignment {
  item?: EquipmentItem;
  player?: Player;
}

// ============================================================================
// Equipment Items (Inventory)
// ============================================================================

/**
 * Get all equipment items for a club
 */
export const getEquipmentItems = async (clubId: string): Promise<EquipmentItem[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return getDemoEquipmentItems(clubId);
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .select('*')
    .eq('club_id', clubId)
    .order('category')
    .order('name');

  if (error) {
    console.error('Error fetching equipment items:', error);
    throw error;
  }

  return (data || []).map(mapEquipmentItemFromDb);
};

/**
 * Get equipment items by category
 */
export const getEquipmentByCategory = async (
  clubId: string,
  category: EquipmentCategory
): Promise<EquipmentItem[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    const items = getDemoEquipmentItems(clubId);
    return items.filter(i => i.category === category);
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .select('*')
    .eq('club_id', clubId)
    .eq('category', category)
    .order('name');

  if (error) {
    console.error('Error fetching equipment by category:', error);
    throw error;
  }

  return (data || []).map(mapEquipmentItemFromDb);
};

/**
 * Get low stock items
 */
export const getLowStockItems = async (clubId: string): Promise<EquipmentItem[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    const items = getDemoEquipmentItems(clubId);
    return items.filter(item => item.quantity_available <= item.min_stock);
  }

  // Fallback: get all and filter client-side
  const allItems = await getEquipmentItems(clubId);
  return allItems.filter(item => item.quantity_available <= item.min_stock);
};

/**
 * Create a new equipment item
 */
export const createEquipmentItem = async (
  clubId: string,
  item: Omit<EquipmentItem, 'id' | 'club_id'>
): Promise<EquipmentItem> => {
  if (!supabase || !isSupabaseConfigured()) {
    const newItem: EquipmentItem = {
      ...item,
      id: generateDemoId(),
      club_id: clubId,
    };
    return saveDemoEquipmentItem(newItem);
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .insert({
      club_id: clubId,
      name: item.name,
      category: item.category,
      size: item.size,
      quantity_total: item.quantity_total,
      quantity_available: item.quantity_available,
      min_stock: item.min_stock,
      condition: item.condition,
      notes: item.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating equipment item:', error);
    throw error;
  }

  return mapEquipmentItemFromDb(data);
};

/**
 * Update an equipment item
 */
export const updateEquipmentItem = async (
  itemId: string,
  updates: Partial<Omit<EquipmentItem, 'id' | 'club_id'>>
): Promise<EquipmentItem> => {
  if (!supabase || !isSupabaseConfigured()) {
    // Demo mode: get item, update it, save it
    const allKey = 'pitchside_demo_equipment_items';
    const items: EquipmentItem[] = JSON.parse(localStorage.getItem(allKey) || '[]');
    const idx = items.findIndex(i => i.id === itemId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(allKey, JSON.stringify(items));
      return items[idx];
    }
    throw new Error('Item not found');
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating equipment item:', error);
    throw error;
  }

  return mapEquipmentItemFromDb(data);
};

/**
 * Delete an equipment item
 */
export const deleteEquipmentItem = async (itemId: string): Promise<void> => {
  if (!supabase || !isSupabaseConfigured()) {
    deleteDemoEquipmentItem(itemId);
    return;
  }

  const { error } = await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting equipment item:', error);
    throw error;
  }
};

/**
 * Get inventory summary stats
 */
export const getInventorySummary = async (
  clubId: string
): Promise<{
  total_items: number;
  total_quantity: number;
  available: number;
  issued: number;
  low_stock: number;
  in_laundry: number;
}> => {
  if (!supabase || !isSupabaseConfigured()) {
    return getDemoInventorySummary(clubId);
  }

  const items = await getEquipmentItems(clubId);
  const laundry = await getActiveLaundry(clubId);

  const inLaundry = laundry.reduce((sum, l) => {
    return sum + l.items.reduce((s, item) => s + item.quantity, 0);
  }, 0);

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity_total, 0);
  const available = items.reduce((sum, i) => sum + i.quantity_available, 0);
  const lowStock = items.filter(i => i.quantity_available <= i.min_stock).length;

  return {
    total_items: items.length,
    total_quantity: totalQuantity,
    available,
    issued: totalQuantity - available,
    low_stock: lowStock,
    in_laundry: inLaundry,
  };
};

// ============================================================================
// Equipment Assignments
// ============================================================================

/**
 * Get all active assignments (not returned)
 */
export const getActiveAssignments = async (
  clubId: string
): Promise<EquipmentAssignmentWithDetails[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    const assignments = getDemoEquipmentAssignments(clubId);
    // Enrich with item details
    const items = getDemoEquipmentItems(clubId);
    return assignments.map(a => ({
      ...a,
      item: items.find(i => i.id === a.item_id),
    }));
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ASSIGNMENTS)
    .select(`
      *,
      item:equipment_items(*),
      player:players(*)
    `)
    .eq('club_id', clubId)
    .is('returned_at', null)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Error fetching assignments:', error);
    throw error;
  }

  return (data || []).map(row => ({
    ...mapEquipmentAssignmentFromDb(row),
    item: row.item ? mapEquipmentItemFromDb(row.item) : undefined,
    player: row.player,
  }));
};

/**
 * Get assignments for a specific player
 */
export const getPlayerAssignments = async (
  playerId: string
): Promise<EquipmentAssignmentWithDetails[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    const allKey = 'pitchside_demo_equipment_assignments';
    const all: EquipmentAssignment[] = JSON.parse(localStorage.getItem(allKey) || '[]');
    const playerAssignments = all.filter(a => a.player_id === playerId && !a.returned_at);
    const items = getDemoEquipmentItems('demo');
    return playerAssignments.map(a => ({
      ...a,
      item: items.find(i => i.id === a.item_id),
    }));
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ASSIGNMENTS)
    .select(`
      *,
      item:equipment_items(*)
    `)
    .eq('player_id', playerId)
    .is('returned_at', null)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error('Error fetching player assignments:', error);
    throw error;
  }

  return (data || []).map(row => ({
    ...mapEquipmentAssignmentFromDb(row),
    item: row.item ? mapEquipmentItemFromDb(row.item) : undefined,
  }));
};

/**
 * Issue equipment to a player
 */
export const issueEquipment = async (
  clubId: string,
  itemId: string,
  playerId: string,
  quantity: number = 1,
  notes?: string
): Promise<EquipmentAssignment> => {
  if (!supabase || !isSupabaseConfigured()) {
    return issueDemoEquipment(clubId, itemId, playerId, quantity, notes);
  }

  // First, check available quantity
  const { data: item, error: itemError } = await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .select('quantity_available')
    .eq('id', itemId)
    .single();

  if (itemError) throw itemError;
  if (item.quantity_available < quantity) {
    throw new Error('Not enough stock available');
  }

  // Create assignment
  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ASSIGNMENTS)
    .insert({
      club_id: clubId,
      item_id: itemId,
      player_id: playerId,
      quantity,
      notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }

  // Update available quantity
  await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .update({ quantity_available: item.quantity_available - quantity })
    .eq('id', itemId);

  return mapEquipmentAssignmentFromDb(data);
};

/**
 * Return equipment from a player
 */
export const returnEquipment = async (
  assignmentId: string
): Promise<EquipmentAssignment> => {
  if (!supabase || !isSupabaseConfigured()) {
    const result = returnDemoEquipment(assignmentId);
    if (!result) throw new Error('Assignment not found');
    return result;
  }

  // Get assignment details
  const { data: assignment, error: getError } = await supabase
    .from(TABLES.EQUIPMENT_ASSIGNMENTS)
    .select('item_id, quantity')
    .eq('id', assignmentId)
    .single();

  if (getError) throw getError;

  // Mark as returned
  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_ASSIGNMENTS)
    .update({ returned_at: new Date().toISOString() })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error('Error returning equipment:', error);
    throw error;
  }

  // Update available quantity
  const { data: item } = await supabase
    .from(TABLES.EQUIPMENT_ITEMS)
    .select('quantity_available')
    .eq('id', assignment.item_id)
    .single();

  if (item) {
    await supabase
      .from(TABLES.EQUIPMENT_ITEMS)
      .update({ quantity_available: item.quantity_available + assignment.quantity })
      .eq('id', assignment.item_id);
  }

  return mapEquipmentAssignmentFromDb(data);
};

// ============================================================================
// Laundry Tracking
// ============================================================================

/**
 * Get active laundry batches (sent but not returned)
 */
export const getActiveLaundry = async (clubId: string): Promise<EquipmentLaundry[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    return getDemoActiveLaundry(clubId);
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_LAUNDRY)
    .select('*')
    .eq('club_id', clubId)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('Error fetching laundry:', error);
    throw error;
  }

  return (data || []).map(mapEquipmentLaundryFromDb);
};

/**
 * Get laundry history
 */
export const getLaundryHistory = async (
  clubId: string,
  limit: number = 20
): Promise<EquipmentLaundry[]> => {
  if (!supabase || !isSupabaseConfigured()) {
    const allKey = 'pitchside_demo_equipment_laundry';
    const all: EquipmentLaundry[] = JSON.parse(localStorage.getItem(allKey) || '[]');
    return all.filter(l => l.club_id === clubId).slice(0, limit);
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_LAUNDRY)
    .select('*')
    .eq('club_id', clubId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching laundry history:', error);
    throw error;
  }

  return (data || []).map(mapEquipmentLaundryFromDb);
};

/**
 * Send items to laundry
 */
export const sendToLaundry = async (
  clubId: string,
  items: LaundryItem[],
  notes?: string
): Promise<EquipmentLaundry> => {
  if (!supabase || !isSupabaseConfigured()) {
    return sendDemoToLaundry(clubId, items, notes);
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_LAUNDRY)
    .insert({
      club_id: clubId,
      items,
      status: 'sent',
      notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending to laundry:', error);
    throw error;
  }

  return mapEquipmentLaundryFromDb(data);
};

/**
 * Mark laundry as returned
 */
export const returnFromLaundry = async (laundryId: string): Promise<EquipmentLaundry> => {
  if (!supabase || !isSupabaseConfigured()) {
    const result = returnDemoFromLaundry(laundryId);
    if (!result) throw new Error('Laundry batch not found');
    return result;
  }

  const { data, error } = await supabase
    .from(TABLES.EQUIPMENT_LAUNDRY)
    .update({
      status: 'returned',
      returned_at: new Date().toISOString(),
    })
    .eq('id', laundryId)
    .select()
    .single();

  if (error) {
    console.error('Error returning laundry:', error);
    throw error;
  }

  return mapEquipmentLaundryFromDb(data);
};

// ============================================================================
// Mappers
// ============================================================================

const mapEquipmentItemFromDb = (row: any): EquipmentItem => ({
  id: row.id,
  club_id: row.club_id,
  name: row.name,
  category: row.category as EquipmentCategory,
  size: row.size,
  quantity_total: row.quantity_total,
  quantity_available: row.quantity_available,
  min_stock: row.min_stock,
  condition: row.condition as EquipmentCondition,
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapEquipmentAssignmentFromDb = (row: any): EquipmentAssignment => ({
  id: row.id,
  club_id: row.club_id,
  item_id: row.item_id,
  player_id: row.player_id,
  quantity: row.quantity,
  issued_at: row.issued_at,
  returned_at: row.returned_at,
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const mapEquipmentLaundryFromDb = (row: any): EquipmentLaundry => ({
  id: row.id,
  club_id: row.club_id,
  items: (row.items || []) as LaundryItem[],
  status: row.status as LaundryStatus,
  sent_at: row.sent_at,
  returned_at: row.returned_at,
  notes: row.notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
});
