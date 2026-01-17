/**
 * Demo Storage Service
 *
 * Provides localStorage-based persistence for demo mode (when Supabase is not configured).
 * This allows all features to work without a database connection.
 */

const STORAGE_KEYS = {
  FIXTURE_TASKS: 'pitchside_demo_fixture_tasks',
  AVAILABILITY: 'pitchside_demo_availability',
  EQUIPMENT_ITEMS: 'pitchside_demo_equipment_items',
  EQUIPMENT_ASSIGNMENTS: 'pitchside_demo_equipment_assignments',
  EQUIPMENT_LAUNDRY: 'pitchside_demo_equipment_laundry',
  TEMPLATE_PACKS_ENABLED: 'pitchside_demo_template_packs_enabled',
  CLUB_PROFILE: 'pitchside_demo_club_profile',
  BROADCASTS: 'pitchside_demo_broadcasts',
  TRAINING_SESSIONS: 'pitchside_demo_training_sessions',
  EXPENSES: 'pitchside_demo_expenses',
  OPPOSITION_NOTES: 'pitchside_demo_opposition_notes',
} as const;

// Generic helpers
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

// Generate unique IDs for demo mode
export function generateDemoId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Fixture Tasks
// ============================================================================

import { FixtureTask, TemplatePack, DEFAULT_TEMPLATE_PACKS } from '../types';

export function getDemoFixtureTasks(fixtureId: string): FixtureTask[] {
  const allTasks = getItem<FixtureTask[]>(STORAGE_KEYS.FIXTURE_TASKS, []);
  return allTasks.filter(t => t.fixture_id === fixtureId);
}

export function saveDemoFixtureTask(task: FixtureTask): FixtureTask {
  const allTasks = getItem<FixtureTask[]>(STORAGE_KEYS.FIXTURE_TASKS, []);
  const existingIndex = allTasks.findIndex(t => t.id === task.id);

  if (existingIndex >= 0) {
    allTasks[existingIndex] = task;
  } else {
    allTasks.push(task);
  }

  setItem(STORAGE_KEYS.FIXTURE_TASKS, allTasks);
  return task;
}

export function deleteDemoFixtureTask(taskId: string): void {
  const allTasks = getItem<FixtureTask[]>(STORAGE_KEYS.FIXTURE_TASKS, []);
  const filtered = allTasks.filter(t => t.id !== taskId);
  setItem(STORAGE_KEYS.FIXTURE_TASKS, filtered);
}

export function generateDemoTasksFromTemplates(
  clubId: string,
  fixtureId: string,
  venue: 'Home' | 'Away'
): FixtureTask[] {
  // Check if tasks already exist for this fixture
  const existing = getDemoFixtureTasks(fixtureId);
  if (existing.length > 0) {
    return existing;
  }

  // Get enabled template packs
  const enabledPackIds = getDemoEnabledTemplatePacks();

  // Use DEFAULT_TEMPLATE_PACKS and filter by enabled
  const packs = DEFAULT_TEMPLATE_PACKS.map((pack, i) => ({
    ...pack,
    id: `demo-pack-${i}`,
    club_id: clubId,
  }));

  const enabledPacks = packs.filter((p, i) => enabledPackIds.includes(`demo-pack-${i}`));

  // Filter by venue
  const relevantPacks = enabledPacks.filter(p => {
    const nameLower = p.name.toLowerCase();
    if (nameLower.includes('(home)') && venue !== 'Home') return false;
    if (nameLower.includes('(away)') && venue !== 'Away') return false;
    return true;
  });

  // Generate tasks
  const tasks: FixtureTask[] = [];
  let sortOrder = 0;

  for (const pack of relevantPacks) {
    for (const templateTask of pack.tasks) {
      tasks.push({
        id: generateDemoId(),
        club_id: clubId,
        fixture_id: fixtureId,
        template_pack_id: pack.id,
        label: templateTask.label,
        is_completed: false,
        sort_order: sortOrder++,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Save all tasks
  const allTasks = getItem<FixtureTask[]>(STORAGE_KEYS.FIXTURE_TASKS, []);
  setItem(STORAGE_KEYS.FIXTURE_TASKS, [...allTasks, ...tasks]);

  return tasks;
}

// ============================================================================
// Template Packs (Enabled State)
// ============================================================================

export function getDemoEnabledTemplatePacks(): string[] {
  // Default: enable packs that have is_enabled: true
  const defaults = DEFAULT_TEMPLATE_PACKS
    .map((p, i) => p.is_enabled ? `demo-pack-${i}` : null)
    .filter(Boolean) as string[];

  return getItem<string[]>(STORAGE_KEYS.TEMPLATE_PACKS_ENABLED, defaults);
}

export function setDemoEnabledTemplatePacks(enabledIds: string[]): void {
  setItem(STORAGE_KEYS.TEMPLATE_PACKS_ENABLED, enabledIds);
}

export function toggleDemoTemplatePack(packId: string): string[] {
  const current = getDemoEnabledTemplatePacks();
  const newEnabled = current.includes(packId)
    ? current.filter(id => id !== packId)
    : [...current, packId];
  setDemoEnabledTemplatePacks(newEnabled);
  return newEnabled;
}

// ============================================================================
// Player Availability
// ============================================================================

import { PlayerAvailability, AvailabilityStatus } from '../types';

export function getDemoAvailability(fixtureId: string): PlayerAvailability[] {
  const all = getItem<PlayerAvailability[]>(STORAGE_KEYS.AVAILABILITY, []);
  return all.filter(a => a.fixture_id === fixtureId);
}

export function initializeDemoAvailability(
  clubId: string,
  fixtureId: string,
  playerIds: string[]
): PlayerAvailability[] {
  const existing = getDemoAvailability(fixtureId);
  const existingPlayerIds = new Set(existing.map(e => e.player_id));

  const newRecords: PlayerAvailability[] = playerIds
    .filter(id => !existingPlayerIds.has(id))
    .map(playerId => ({
      id: generateDemoId(),
      club_id: clubId,
      fixture_id: fixtureId,
      player_id: playerId,
      status: 'no_response' as AvailabilityStatus,
      created_at: new Date().toISOString(),
    }));

  if (newRecords.length > 0) {
    const all = getItem<PlayerAvailability[]>(STORAGE_KEYS.AVAILABILITY, []);
    setItem(STORAGE_KEYS.AVAILABILITY, [...all, ...newRecords]);
  }

  return [...existing, ...newRecords];
}

export function setDemoPlayerAvailability(
  clubId: string,
  fixtureId: string,
  playerId: string,
  status: AvailabilityStatus,
  note?: string
): PlayerAvailability {
  const all = getItem<PlayerAvailability[]>(STORAGE_KEYS.AVAILABILITY, []);
  const existingIndex = all.findIndex(
    a => a.fixture_id === fixtureId && a.player_id === playerId
  );

  const record: PlayerAvailability = {
    id: existingIndex >= 0 ? all[existingIndex].id : generateDemoId(),
    club_id: clubId,
    fixture_id: fixtureId,
    player_id: playerId,
    status,
    response_note: note,
    responded_at: new Date().toISOString(),
    created_at: existingIndex >= 0 ? all[existingIndex].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    all[existingIndex] = record;
  } else {
    all.push(record);
  }

  setItem(STORAGE_KEYS.AVAILABILITY, all);
  return record;
}

// ============================================================================
// Equipment Items
// ============================================================================

import { EquipmentItem, EquipmentAssignment, EquipmentLaundry, LaundryItem } from '../types';

// Default starter equipment for demo mode
const DEFAULT_EQUIPMENT: Omit<EquipmentItem, 'id' | 'club_id'>[] = [
  { name: 'Home Shirt', category: 'kit', size: 'Mixed', quantity_total: 25, quantity_available: 20, min_stock: 15, condition: 'good' },
  { name: 'Away Shirt', category: 'kit', size: 'Mixed', quantity_total: 25, quantity_available: 23, min_stock: 15, condition: 'good' },
  { name: 'Shorts (Black)', category: 'kit', size: 'Mixed', quantity_total: 30, quantity_available: 28, min_stock: 20, condition: 'good' },
  { name: 'Socks (Home)', category: 'kit', size: 'Mixed', quantity_total: 30, quantity_available: 25, min_stock: 20, condition: 'fair' },
  { name: 'Training Bibs', category: 'training', quantity_total: 20, quantity_available: 18, min_stock: 15, condition: 'fair' },
  { name: 'Training Cones', category: 'training', quantity_total: 40, quantity_available: 38, min_stock: 30, condition: 'good' },
  { name: 'Match Balls', category: 'training', quantity_total: 10, quantity_available: 8, min_stock: 5, condition: 'good' },
  { name: 'Training Balls', category: 'training', quantity_total: 15, quantity_available: 12, min_stock: 10, condition: 'fair' },
  { name: 'First Aid Kit', category: 'medical', quantity_total: 3, quantity_available: 3, min_stock: 2, condition: 'new' },
  { name: 'Ice Packs', category: 'medical', quantity_total: 10, quantity_available: 8, min_stock: 5, condition: 'good' },
  { name: 'Goalkeeper Gloves', category: 'kit', size: 'Mixed', quantity_total: 4, quantity_available: 3, min_stock: 2, condition: 'good' },
  { name: 'Corner Flags', category: 'other', quantity_total: 4, quantity_available: 4, min_stock: 4, condition: 'good' },
];

export function getDemoEquipmentItems(clubId: string): EquipmentItem[] {
  const items = getItem<EquipmentItem[]>(STORAGE_KEYS.EQUIPMENT_ITEMS, []);

  // Initialize with defaults if empty
  if (items.length === 0) {
    const defaultItems: EquipmentItem[] = DEFAULT_EQUIPMENT.map((item, i) => ({
      ...item,
      id: `demo-equip-${i}`,
      club_id: clubId,
      created_at: new Date().toISOString(),
    }));
    setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, defaultItems);
    return defaultItems;
  }

  return items.filter(i => i.club_id === clubId);
}

export function saveDemoEquipmentItem(item: EquipmentItem): EquipmentItem {
  const items = getItem<EquipmentItem[]>(STORAGE_KEYS.EQUIPMENT_ITEMS, []);
  const existingIndex = items.findIndex(i => i.id === item.id);

  if (existingIndex >= 0) {
    items[existingIndex] = { ...item, updated_at: new Date().toISOString() };
  } else {
    items.push({ ...item, created_at: new Date().toISOString() });
  }

  setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, items);
  return item;
}

export function deleteDemoEquipmentItem(itemId: string): void {
  const items = getItem<EquipmentItem[]>(STORAGE_KEYS.EQUIPMENT_ITEMS, []);
  setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, items.filter(i => i.id !== itemId));
}

// ============================================================================
// Equipment Assignments
// ============================================================================

export function getDemoEquipmentAssignments(clubId: string): EquipmentAssignment[] {
  const assignments = getItem<EquipmentAssignment[]>(STORAGE_KEYS.EQUIPMENT_ASSIGNMENTS, []);
  return assignments.filter(a => a.club_id === clubId && !a.returned_at);
}

export function issueDemoEquipment(
  clubId: string,
  itemId: string,
  playerId: string,
  quantity: number,
  notes?: string
): EquipmentAssignment {
  // Update item availability
  const items = getItem<EquipmentItem[]>(STORAGE_KEYS.EQUIPMENT_ITEMS, []);
  const itemIndex = items.findIndex(i => i.id === itemId);
  if (itemIndex >= 0) {
    items[itemIndex].quantity_available -= quantity;
    setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, items);
  }

  // Create assignment
  const assignment: EquipmentAssignment = {
    id: generateDemoId(),
    club_id: clubId,
    item_id: itemId,
    player_id: playerId,
    quantity,
    issued_at: new Date().toISOString(),
    notes,
    created_at: new Date().toISOString(),
  };

  const assignments = getItem<EquipmentAssignment[]>(STORAGE_KEYS.EQUIPMENT_ASSIGNMENTS, []);
  assignments.push(assignment);
  setItem(STORAGE_KEYS.EQUIPMENT_ASSIGNMENTS, assignments);

  return assignment;
}

export function returnDemoEquipment(assignmentId: string): EquipmentAssignment | null {
  const assignments = getItem<EquipmentAssignment[]>(STORAGE_KEYS.EQUIPMENT_ASSIGNMENTS, []);
  const index = assignments.findIndex(a => a.id === assignmentId);

  if (index < 0) return null;

  const assignment = assignments[index];
  assignment.returned_at = new Date().toISOString();
  assignments[index] = assignment;
  setItem(STORAGE_KEYS.EQUIPMENT_ASSIGNMENTS, assignments);

  // Update item availability
  const items = getItem<EquipmentItem[]>(STORAGE_KEYS.EQUIPMENT_ITEMS, []);
  const itemIndex = items.findIndex(i => i.id === assignment.item_id);
  if (itemIndex >= 0) {
    items[itemIndex].quantity_available += assignment.quantity;
    setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, items);
  }

  return assignment;
}

// ============================================================================
// Equipment Laundry
// ============================================================================

export function getDemoActiveLaundry(clubId: string): EquipmentLaundry[] {
  const laundry = getItem<EquipmentLaundry[]>(STORAGE_KEYS.EQUIPMENT_LAUNDRY, []);
  return laundry.filter(l => l.club_id === clubId && l.status === 'sent');
}

export function sendDemoToLaundry(
  clubId: string,
  items: LaundryItem[],
  notes?: string
): EquipmentLaundry {
  const laundryRecord: EquipmentLaundry = {
    id: generateDemoId(),
    club_id: clubId,
    items,
    status: 'sent',
    sent_at: new Date().toISOString(),
    notes,
    created_at: new Date().toISOString(),
  };

  const laundry = getItem<EquipmentLaundry[]>(STORAGE_KEYS.EQUIPMENT_LAUNDRY, []);
  laundry.push(laundryRecord);
  setItem(STORAGE_KEYS.EQUIPMENT_LAUNDRY, laundry);

  return laundryRecord;
}

export function returnDemoFromLaundry(laundryId: string): EquipmentLaundry | null {
  const laundry = getItem<EquipmentLaundry[]>(STORAGE_KEYS.EQUIPMENT_LAUNDRY, []);
  const index = laundry.findIndex(l => l.id === laundryId);

  if (index < 0) return null;

  laundry[index].status = 'returned';
  laundry[index].returned_at = new Date().toISOString();
  setItem(STORAGE_KEYS.EQUIPMENT_LAUNDRY, laundry);

  return laundry[index];
}

export function getDemoInventorySummary(clubId: string): {
  total_items: number;
  total_quantity: number;
  available: number;
  issued: number;
  low_stock: number;
  in_laundry: number;
} {
  const items = getDemoEquipmentItems(clubId);
  const laundry = getDemoActiveLaundry(clubId);

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
}

// ============================================================================
// Club Profile (for demo mode)
// ============================================================================

export interface DemoClubProfile {
  club_id: string;
  display_name?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  founded_year?: number;
  stadium_name?: string;
  website_url?: string;
  updated_at?: string;
}

export function getDemoClubProfile(clubId: string): DemoClubProfile | null {
  const profiles = getItem<Record<string, DemoClubProfile>>(STORAGE_KEYS.CLUB_PROFILE, {});
  return profiles[clubId] || null;
}

export function saveDemoClubProfile(profile: DemoClubProfile): DemoClubProfile {
  const profiles = getItem<Record<string, DemoClubProfile>>(STORAGE_KEYS.CLUB_PROFILE, {});
  profiles[profile.club_id] = {
    ...profile,
    updated_at: new Date().toISOString(),
  };
  setItem(STORAGE_KEYS.CLUB_PROFILE, profiles);
  return profiles[profile.club_id];
}

// ============================================================================
// Squad Broadcasts
// ============================================================================

export type BroadcastChannel = 'all' | 'available' | 'unavailable' | 'no_response' | 'custom';

export interface Broadcast {
  id: string;
  club_id: string;
  message: string;
  channel: BroadcastChannel;
  recipient_ids: string[]; // player IDs
  fixture_id?: string; // optional link to fixture
  sent_at: string;
  created_by?: string;
}

export function getDemoBroadcasts(clubId: string): Broadcast[] {
  const all = getItem<Broadcast[]>(STORAGE_KEYS.BROADCASTS, []);
  return all.filter(b => b.club_id === clubId).sort((a, b) =>
    new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  );
}

export function saveDemoBroadcast(broadcast: Omit<Broadcast, 'id' | 'sent_at'>): Broadcast {
  const all = getItem<Broadcast[]>(STORAGE_KEYS.BROADCASTS, []);
  const newBroadcast: Broadcast = {
    ...broadcast,
    id: generateDemoId(),
    sent_at: new Date().toISOString(),
  };
  all.push(newBroadcast);
  setItem(STORAGE_KEYS.BROADCASTS, all);
  return newBroadcast;
}

// ============================================================================
// Training Sessions
// ============================================================================

export type TrainingType = 'regular' | 'match_prep' | 'recovery' | 'tactical' | 'fitness';

export interface TrainingSession {
  id: string;
  club_id: string;
  title: string;
  type: TrainingType;
  date: string; // ISO date
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  location: string;
  notes?: string;
  fixture_id?: string; // if match prep
  created_at: string;
  updated_at?: string;
}

export interface TrainingAttendance {
  id: string;
  session_id: string;
  player_id: string;
  status: 'attending' | 'not_attending' | 'maybe' | 'no_response';
  responded_at?: string;
  note?: string;
}

export function getDemoTrainingSessions(clubId: string): TrainingSession[] {
  const all = getItem<TrainingSession[]>(STORAGE_KEYS.TRAINING_SESSIONS, []);
  return all.filter(s => s.club_id === clubId).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function saveDemoTrainingSession(session: Omit<TrainingSession, 'id' | 'created_at'>): TrainingSession {
  const all = getItem<TrainingSession[]>(STORAGE_KEYS.TRAINING_SESSIONS, []);
  const newSession: TrainingSession = {
    ...session,
    id: generateDemoId(),
    created_at: new Date().toISOString(),
  };
  all.push(newSession);
  setItem(STORAGE_KEYS.TRAINING_SESSIONS, all);
  return newSession;
}

export function updateDemoTrainingSession(sessionId: string, updates: Partial<TrainingSession>): TrainingSession | null {
  const all = getItem<TrainingSession[]>(STORAGE_KEYS.TRAINING_SESSIONS, []);
  const idx = all.findIndex(s => s.id === sessionId);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
  setItem(STORAGE_KEYS.TRAINING_SESSIONS, all);
  return all[idx];
}

export function deleteDemoTrainingSession(sessionId: string): void {
  const all = getItem<TrainingSession[]>(STORAGE_KEYS.TRAINING_SESSIONS, []);
  setItem(STORAGE_KEYS.TRAINING_SESSIONS, all.filter(s => s.id !== sessionId));
}

export function getDemoTrainingAttendance(sessionId: string): TrainingAttendance[] {
  const key = `pitchside_demo_training_attendance_${sessionId}`;
  return getItem<TrainingAttendance[]>(key, []);
}

export function setDemoTrainingAttendance(
  sessionId: string,
  playerId: string,
  status: TrainingAttendance['status'],
  note?: string
): TrainingAttendance {
  const key = `pitchside_demo_training_attendance_${sessionId}`;
  const all = getItem<TrainingAttendance[]>(key, []);
  const existing = all.findIndex(a => a.player_id === playerId);

  const attendance: TrainingAttendance = {
    id: existing >= 0 ? all[existing].id : generateDemoId(),
    session_id: sessionId,
    player_id: playerId,
    status,
    responded_at: new Date().toISOString(),
    note,
  };

  if (existing >= 0) {
    all[existing] = attendance;
  } else {
    all.push(attendance);
  }

  setItem(key, all);
  return attendance;
}

// ============================================================================
// Quick Expenses
// ============================================================================

export type ExpenseCategory = 'match_fees' | 'equipment' | 'travel' | 'facilities' | 'medical' | 'other';
export type ExpenseType = 'income' | 'expense';

export interface Expense {
  id: string;
  club_id: string;
  type: ExpenseType;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  player_id?: string; // if related to a player (e.g., match fee)
  fixture_id?: string; // if related to a fixture
  created_at: string;
}

export function getDemoExpenses(clubId: string): Expense[] {
  const all = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  return all.filter(e => e.club_id === clubId).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function saveDemoExpense(expense: Omit<Expense, 'id' | 'created_at'>): Expense {
  const all = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  const newExpense: Expense = {
    ...expense,
    id: generateDemoId(),
    created_at: new Date().toISOString(),
  };
  all.push(newExpense);
  setItem(STORAGE_KEYS.EXPENSES, all);
  return newExpense;
}

export function deleteDemoExpense(expenseId: string): void {
  const all = getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  setItem(STORAGE_KEYS.EXPENSES, all.filter(e => e.id !== expenseId));
}

export function getDemoExpensesSummary(clubId: string): {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: Record<ExpenseCategory, number>;
} {
  const expenses = getDemoExpenses(clubId);

  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);

  const byCategory: Record<ExpenseCategory, number> = {
    match_fees: 0,
    equipment: 0,
    travel: 0,
    facilities: 0,
    medical: 0,
    other: 0,
  };

  expenses.forEach(e => {
    if (e.type === 'expense') {
      byCategory[e.category] += e.amount;
    }
  });

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    byCategory,
  };
}

// ============================================================================
// Opposition Notes (Scouting)
// ============================================================================

export interface OppositionNote {
  id: string;
  club_id: string;
  opponent_name: string;
  fixture_id?: string;
  formation?: string;
  key_players?: string;
  strengths?: string;
  weaknesses?: string;
  tactics?: string;
  notes?: string;
  last_result?: string;
  created_at: string;
  updated_at?: string;
}

export function getDemoOppositionNotes(clubId: string): OppositionNote[] {
  const all = getItem<OppositionNote[]>(STORAGE_KEYS.OPPOSITION_NOTES, []);
  return all.filter(n => n.club_id === clubId).sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getDemoOppositionNoteByOpponent(clubId: string, opponentName: string): OppositionNote | null {
  const all = getDemoOppositionNotes(clubId);
  return all.find(n => n.opponent_name.toLowerCase() === opponentName.toLowerCase()) || null;
}

export function saveDemoOppositionNote(note: Omit<OppositionNote, 'id' | 'created_at'>): OppositionNote {
  const all = getItem<OppositionNote[]>(STORAGE_KEYS.OPPOSITION_NOTES, []);

  // Check if note for this opponent already exists
  const existingIdx = all.findIndex(n =>
    n.club_id === note.club_id &&
    n.opponent_name.toLowerCase() === note.opponent_name.toLowerCase()
  );

  const newNote: OppositionNote = {
    ...note,
    id: existingIdx >= 0 ? all[existingIdx].id : generateDemoId(),
    created_at: existingIdx >= 0 ? all[existingIdx].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    all[existingIdx] = newNote;
  } else {
    all.push(newNote);
  }

  setItem(STORAGE_KEYS.OPPOSITION_NOTES, all);
  return newNote;
}

export function deleteDemoOppositionNote(noteId: string): void {
  const all = getItem<OppositionNote[]>(STORAGE_KEYS.OPPOSITION_NOTES, []);
  setItem(STORAGE_KEYS.OPPOSITION_NOTES, all.filter(n => n.id !== noteId));
}
