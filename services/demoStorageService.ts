/**
 * Demo Storage Service
 *
 * Provides localStorage-based persistence for demo mode (when Supabase is not configured).
 * This allows all features to work without a database connection.
 */

const STORAGE_KEYS = {
  FIXTURE_TASKS: 'pitchside_demo_fixture_tasks',
  AVAILABILITY: 'pitchside_demo_availability',
  // New grassroots equipment model
  KIT_ASSIGNMENTS: 'pitchside_demo_kit_assignments',
  CLUB_EQUIPMENT: 'pitchside_demo_club_equipment',
  MATCHDAY_CHECKLISTS: 'pitchside_demo_matchday_checklists',
  KIT_REQUESTS: 'pitchside_demo_kit_requests',
  LAUNDRY_BATCHES: 'pitchside_demo_laundry_batches',
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
// Equipment - Grassroots Model
// ============================================================================

import {
  PlayerKitAssignment,
  ClubEquipment,
  MatchDayChecklist,
  MatchDayChecklistItem,
  KitRequest,
  LaundryBatch,
  LaundryStatus,
  DEFAULT_MATCHDAY_BAG,
} from '../types';

// Default club equipment for demo mode
const DEFAULT_CLUB_EQUIPMENT: Omit<ClubEquipment, 'id' | 'club_id'>[] = [
  { name: 'Match Balls', category: 'matchday', quantity: 5, condition: 'good' },
  { name: 'Training Balls', category: 'training', quantity: 12, condition: 'fair' },
  { name: 'Corner Flags', category: 'matchday', quantity: 4, condition: 'good' },
  { name: 'Training Cones', category: 'training', quantity: 30, condition: 'good' },
  { name: 'Training Bibs (Orange)', category: 'training', quantity: 15, condition: 'fair' },
  { name: 'Training Bibs (Blue)', category: 'training', quantity: 15, condition: 'good' },
  { name: 'Agility Ladder', category: 'training', quantity: 2, condition: 'good' },
  { name: 'First Aid Kit', category: 'medical', quantity: 2, condition: 'good' },
  { name: 'Ice Packs', category: 'medical', quantity: 10, condition: 'good' },
  { name: 'Water Bottles', category: 'matchday', quantity: 20, condition: 'fair' },
  { name: 'Water Carrier', category: 'matchday', quantity: 2, condition: 'good' },
  { name: 'Popup Goals (Small)', category: 'training', quantity: 4, condition: 'good' },
];

// ============================================================================
// Player Kit Assignments
// ============================================================================

export function getDemoKitAssignments(clubId: string): PlayerKitAssignment[] {
  return getItem<PlayerKitAssignment[]>(STORAGE_KEYS.KIT_ASSIGNMENTS, [])
    .filter(k => k.club_id === clubId);
}

export function saveDemoKitAssignment(assignment: PlayerKitAssignment): PlayerKitAssignment {
  const all = getItem<PlayerKitAssignment[]>(STORAGE_KEYS.KIT_ASSIGNMENTS, []);
  const existingIndex = all.findIndex(k => k.id === assignment.id);

  const updated = {
    ...assignment,
    updated_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    all[existingIndex] = updated;
  } else {
    updated.created_at = new Date().toISOString();
    all.push(updated);
  }

  setItem(STORAGE_KEYS.KIT_ASSIGNMENTS, all);
  return updated;
}

export function deleteDemoKitAssignment(assignmentId: string): void {
  const all = getItem<PlayerKitAssignment[]>(STORAGE_KEYS.KIT_ASSIGNMENTS, []);
  setItem(STORAGE_KEYS.KIT_ASSIGNMENTS, all.filter(k => k.id !== assignmentId));
}

export function getDemoKitAssignmentByPlayer(clubId: string, playerId: string): PlayerKitAssignment | null {
  const all = getDemoKitAssignments(clubId);
  return all.find(k => k.player_id === playerId) || null;
}

// ============================================================================
// Club Equipment (Shared Inventory)
// ============================================================================

export function getDemoClubEquipment(clubId: string): ClubEquipment[] {
  const items = getItem<ClubEquipment[]>(STORAGE_KEYS.CLUB_EQUIPMENT, []);

  // Initialize with defaults if empty
  if (items.filter(i => i.club_id === clubId).length === 0) {
    const defaultItems: ClubEquipment[] = DEFAULT_CLUB_EQUIPMENT.map((item, i) => ({
      ...item,
      id: `demo-clubequip-${i}`,
      club_id: clubId,
      created_at: new Date().toISOString(),
    }));
    setItem(STORAGE_KEYS.CLUB_EQUIPMENT, [...items, ...defaultItems]);
    return defaultItems;
  }

  return items.filter(i => i.club_id === clubId);
}

export function saveDemoClubEquipment(item: ClubEquipment): ClubEquipment {
  const all = getItem<ClubEquipment[]>(STORAGE_KEYS.CLUB_EQUIPMENT, []);
  const existingIndex = all.findIndex(i => i.id === item.id);

  const updated = { ...item, updated_at: new Date().toISOString() };

  if (existingIndex >= 0) {
    all[existingIndex] = updated;
  } else {
    updated.created_at = new Date().toISOString();
    all.push(updated);
  }

  setItem(STORAGE_KEYS.CLUB_EQUIPMENT, all);
  return updated;
}

export function deleteDemoClubEquipment(itemId: string): void {
  const all = getItem<ClubEquipment[]>(STORAGE_KEYS.CLUB_EQUIPMENT, []);
  setItem(STORAGE_KEYS.CLUB_EQUIPMENT, all.filter(i => i.id !== itemId));
}

// ============================================================================
// Match Day Checklists
// ============================================================================

export function getDemoMatchDayChecklist(clubId: string, fixtureId: string): MatchDayChecklist {
  const all = getItem<MatchDayChecklist[]>(STORAGE_KEYS.MATCHDAY_CHECKLISTS, []);
  const existing = all.find(c => c.club_id === clubId && c.fixture_id === fixtureId);

  if (existing) return existing;

  // Create new checklist with default items
  const newChecklist: MatchDayChecklist = {
    id: generateDemoId(),
    club_id: clubId,
    fixture_id: fixtureId,
    items: DEFAULT_MATCHDAY_BAG.map((item, i) => ({
      ...item,
      id: `item-${i}`,
    })),
    created_at: new Date().toISOString(),
  };

  all.push(newChecklist);
  setItem(STORAGE_KEYS.MATCHDAY_CHECKLISTS, all);
  return newChecklist;
}

export function updateDemoMatchDayChecklist(checklist: MatchDayChecklist): MatchDayChecklist {
  const all = getItem<MatchDayChecklist[]>(STORAGE_KEYS.MATCHDAY_CHECKLISTS, []);
  const index = all.findIndex(c => c.id === checklist.id);

  const updated = { ...checklist, updated_at: new Date().toISOString() };

  // Check if all items are checked
  if (updated.items.every(i => i.is_checked)) {
    updated.completed_at = new Date().toISOString();
  } else {
    updated.completed_at = undefined;
  }

  if (index >= 0) {
    all[index] = updated;
  } else {
    all.push(updated);
  }

  setItem(STORAGE_KEYS.MATCHDAY_CHECKLISTS, all);
  return updated;
}

export function toggleDemoChecklistItem(
  clubId: string,
  fixtureId: string,
  itemId: string
): MatchDayChecklist {
  const checklist = getDemoMatchDayChecklist(clubId, fixtureId);
  const itemIndex = checklist.items.findIndex(i => i.id === itemId);

  if (itemIndex >= 0) {
    checklist.items[itemIndex].is_checked = !checklist.items[itemIndex].is_checked;
  }

  return updateDemoMatchDayChecklist(checklist);
}

export function addDemoChecklistItem(
  clubId: string,
  fixtureId: string,
  label: string
): MatchDayChecklist {
  const checklist = getDemoMatchDayChecklist(clubId, fixtureId);
  checklist.items.push({
    id: generateDemoId(),
    label,
    is_checked: false,
  });
  return updateDemoMatchDayChecklist(checklist);
}

// ============================================================================
// Kit Requests
// ============================================================================

export function getDemoKitRequests(clubId: string): KitRequest[] {
  return getItem<KitRequest[]>(STORAGE_KEYS.KIT_REQUESTS, [])
    .filter(r => r.club_id === clubId);
}

export function saveDemoKitRequest(request: KitRequest): KitRequest {
  const all = getItem<KitRequest[]>(STORAGE_KEYS.KIT_REQUESTS, []);
  const existingIndex = all.findIndex(r => r.id === request.id);

  const updated = { ...request, updated_at: new Date().toISOString() };

  if (existingIndex >= 0) {
    all[existingIndex] = updated;
  } else {
    all.push(updated);
  }

  setItem(STORAGE_KEYS.KIT_REQUESTS, all);
  return updated;
}

export function deleteDemoKitRequest(requestId: string): void {
  const all = getItem<KitRequest[]>(STORAGE_KEYS.KIT_REQUESTS, []);
  setItem(STORAGE_KEYS.KIT_REQUESTS, all.filter(r => r.id !== requestId));
}

// ============================================================================
// Laundry Batches (Simplified)
// ============================================================================

export function getDemoLaundryBatches(clubId: string): LaundryBatch[] {
  return getItem<LaundryBatch[]>(STORAGE_KEYS.LAUNDRY_BATCHES, [])
    .filter(b => b.club_id === clubId);
}

export function getDemoActiveLaundry(clubId: string): LaundryBatch[] {
  return getDemoLaundryBatches(clubId).filter(b => b.status !== 'ready');
}

export function createDemoLaundryBatch(
  clubId: string,
  kitCount: number,
  fixtureId?: string,
  notes?: string
): LaundryBatch {
  const batch: LaundryBatch = {
    id: generateDemoId(),
    club_id: clubId,
    fixture_id: fixtureId,
    status: 'dirty',
    kit_count: kitCount,
    notes,
    created_at: new Date().toISOString(),
  };

  const all = getItem<LaundryBatch[]>(STORAGE_KEYS.LAUNDRY_BATCHES, []);
  all.push(batch);
  setItem(STORAGE_KEYS.LAUNDRY_BATCHES, all);

  return batch;
}

export function updateDemoLaundryStatus(batchId: string, status: LaundryStatus): LaundryBatch | null {
  const all = getItem<LaundryBatch[]>(STORAGE_KEYS.LAUNDRY_BATCHES, []);
  const index = all.findIndex(b => b.id === batchId);

  if (index < 0) return null;

  all[index].status = status;
  all[index].updated_at = new Date().toISOString();

  if (status === 'washing') {
    all[index].sent_at = new Date().toISOString();
  } else if (status === 'ready') {
    all[index].returned_at = new Date().toISOString();
  }

  setItem(STORAGE_KEYS.LAUNDRY_BATCHES, all);
  return all[index];
}

export function deleteDemoLaundryBatch(batchId: string): void {
  const all = getItem<LaundryBatch[]>(STORAGE_KEYS.LAUNDRY_BATCHES, []);
  setItem(STORAGE_KEYS.LAUNDRY_BATCHES, all.filter(b => b.id !== batchId));
}

// ============================================================================
// Equipment Summary (for dashboard/notifications)
// ============================================================================

export function getDemoEquipmentSummary(clubId: string): {
  totalPlayers: number;
  playersWithKit: number;
  kitNeedsReplacing: number;
  pendingRequests: number;
  laundryInProgress: number;
} {
  const kitAssignments = getDemoKitAssignments(clubId);
  const kitRequests = getDemoKitRequests(clubId);
  const laundry = getDemoActiveLaundry(clubId);

  return {
    totalPlayers: 0, // Will be set by component with actual player count
    playersWithKit: kitAssignments.length,
    kitNeedsReplacing: kitAssignments.filter(k => k.kit_condition === 'needs_replacing').length,
    pendingRequests: kitRequests.filter(r => r.status === 'pending').length,
    laundryInProgress: laundry.filter(l => l.status === 'washing').length,
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
