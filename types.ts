import { generateDemoUUID, DEMO_UUIDS } from './utils/uuid';

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

// Emergency Contact for player safety
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

// ============================================================================
// Multi-tenant (Org / Membership)
// ============================================================================

export interface Org {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type OrgMemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at?: string;
  updated_at?: string;
}

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  number: number;
  is_captain?: boolean;
  image_url?: string;
  stats: PlayerStats;
  form: number; // 0-10
  highlight_uri?: string; // URL for the generated video
  analysis?: string; // AI generated form summary
  narrative_tags?: string[]; // Marketing/branding tags (e.g., "Veteran", "Fan Favorite", "Top Scorer")
  // Emergency contact for player safety
  emergency_contact?: EmergencyContact;
  // Optional personal info
  phone?: string;
  email?: string;
  date_of_birth?: string;
  medical_notes?: string;
}

export interface Club {
  id: string;
  org_id?: string;
  name: string;
  nickname: string;
  slug: string;
  tone_context: string;
  players: Player[];
  primary_color: string;
  secondary_color: string;
}

export type FixtureStatus = 'SCHEDULED' | 'COMPLETED' | 'LIVE';

export interface MatchStats {
  home_possession: number;
  away_possession: number;
  home_shots: number;
  away_shots: number;
  home_xg?: number;
  away_xg?: number;
}

export interface Fixture {
  id: string;
  club_id: string;
  opponent: string;
  kickoff_time: string; // ISO string
  status: FixtureStatus;
  result_home?: number;
  result_away?: number;
  key_events?: string;
  scorers?: string[]; // IDs or names of players who scored
  man_of_the_match?: string; // Player Name
  stats?: MatchStats;
  venue: 'Home' | 'Away';
  competition?: string; // e.g. "League", "Cup"
  attendance?: number;
}

export type ContentType = 'PREVIEW' | 'REPORT' | 'SOCIAL' | 'CAPTION' | 'NEWSLETTER' | 'EMAIL' | 'ARTICLE' | 'GRAPHIC_COPY';
export type ContentStatus = 'DRAFT' | 'APPROVED' | 'PUBLISHED';

// ============================================================================
// VibeStack Status Unions (Law #3 Compliance - Deterministic State)
// ============================================================================

export type ContentGenStatus = 'idle' | 'generating' | 'success' | 'error';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type AsyncOperationStatus = 'idle' | 'loading' | 'success' | 'error';

// ============================================================================
// Fan Sentiment
// ============================================================================

export type SentimentMood = 'euphoric' | 'happy' | 'neutral' | 'worried' | 'angry';

export interface FanSentiment {
  id: string;
  org_id: string;
  club_id: string;
  sentiment_score: number; // 0-100
  sentiment_mood: SentimentMood;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_mentions: number;
  keywords_analyzed?: string[];
  data_source: string;
  snapshot_date: string;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  club_id: string;
  fixture_id?: string;
  type: ContentType;
  platform?: 'Twitter' | 'Instagram' | 'Website' | 'Email';
  body: string;
  status: ContentStatus;
  created_at: string;
  title?: string;
}

// --- NEW ENTITIES FOR OPS ---

export interface SponsorROI {
  impressions?: number;
  engagement_rate?: number;
  clicks?: number;
  conversions?: number;
  period_start?: string;
  period_end?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  sector: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  value: string;
  contract_end: string;
  status: 'Active' | 'Expiring' | 'Negotiating';
  logo_initials: string;
  roi?: SponsorROI;
}

// ============================================================================
// D14 Ops - Task Ownership System
// ============================================================================

/** Task status following FM-style state machine */
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'missed';

/** Task priority levels */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/** Task categories for grouping and filtering */
export type TaskCategory = 'matchday' | 'logistics' | 'content' | 'facilities' | 'medical' | 'commercial' | 'admin';

/**
 * OpsTask - Core task with single owner and due time
 * The heart of D14's accountability system
 */
export interface OpsTask {
  id: string;
  org_id: string;
  club_id: string;
  fixture_id?: string;
  runbook_id?: string;

  title: string;
  description?: string;
  owner_user_id: string;
  owner_name?: string; // Populated via join
  owner_email?: string; // Populated via join
  created_by_user_id: string;

  due_at: string;
  started_at?: string;
  completed_at?: string;

  status: TaskStatus;
  priority: TaskPriority;

  depends_on_task_id?: string;
  depends_on_task?: OpsTask; // Populated via join
  blocking_tasks?: OpsTask[]; // Tasks that depend on this one

  category: TaskCategory;

  created_at: string;
  updated_at: string;
}

/** Filter options for querying tasks */
export interface OpsTaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  category?: TaskCategory | TaskCategory[];
  owner_user_id?: string;
  fixture_id?: string;
  due_before?: string;
  due_after?: string;
}

// ============================================================================
// D14 Ops - Matchday Runbooks
// ============================================================================

/** Categories for runbook items */
export type RunbookItemCategory = 'transport' | 'kit' | 'stadium' | 'warmup' | 'analyst' | 'medical' | 'volunteer' | 'content' | 'commercial';

/**
 * MatchdayRunbook - Reusable template for matchday operations
 * Contains ordered items that become tasks when activated for a fixture
 */
export interface MatchdayRunbook {
  id: string;
  org_id: string;
  club_id: string;
  name: string;
  description?: string;
  is_template: boolean;
  default_lead_hours: number;
  items?: RunbookItem[];
  created_at: string;
  updated_at: string;
}

/**
 * RunbookItem - A step within a runbook
 * relative_time_minutes: negative = before kickoff, positive = after
 */
export interface RunbookItem {
  id: string;
  runbook_id: string;
  title: string;
  description?: string;
  default_role?: string;
  relative_time_minutes: number;
  duration_minutes: number;
  depends_on_item_id?: string;
  sort_order: number;
  category: RunbookItemCategory;
  created_at: string;
}

// ============================================================================
// D14 Ops - Activity Log (Audit Trail)
// ============================================================================

/** Action types for activity log */
export type ActivityAction =
  | 'task_created' | 'task_started' | 'task_completed' | 'task_blocked' | 'task_missed' | 'task_reassigned'
  | 'runbook_created' | 'runbook_activated' | 'runbook_completed'
  | 'fixture_created' | 'fixture_updated'
  | 'content_published'
  | 'escalation_triggered';

/**
 * ActivityLogEntry - Audit trail entry
 * Records who did what, when
 */
export interface ActivityLogEntry {
  id: string;
  org_id: string;
  club_id?: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  action: ActivityAction;
  entity_type: string;
  entity_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Filter options for activity log */
export interface ActivityLogFilters {
  action?: ActivityAction | ActivityAction[];
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  after?: string;
  before?: string;
  limit?: number;
}

// ============================================================================
// D14 Ops - Escalation Rules
// ============================================================================

/** Trigger types for escalation rules */
export type EscalationTrigger = 'task_overdue' | 'task_blocked' | 'task_missed';

/** Notification channels */
export type NotificationChannel = 'in_app' | 'email' | 'both';

/**
 * EscalationRule - Defines when and who to notify
 * E.g., "If any critical task is overdue by 30 min, notify admins"
 */
export interface EscalationRule {
  id: string;
  org_id: string;
  club_id?: string;
  name: string;
  trigger_type: EscalationTrigger;
  trigger_delay_minutes: number;
  notify_user_ids: string[];
  notify_roles: string[];
  notification_channel: NotificationChannel;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// MOCK DATA - 3 MONTHS INTO THE SEASON
// Season started: September 1st, 2024
// Current Date: December 11th, 2024 (Week 14)
// ============================================================================

// Helper to create dates relative to "now"
const daysAgo = (days: number) => new Date(Date.now() - 86400000 * days).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + 86400000 * days).toISOString();
const hoursFromNow = (hours: number) => new Date(Date.now() + 3600000 * hours).toISOString();

// --- SQUAD (18 Players with Season Stats & Analysis) ---
export const INITIAL_PLAYERS: Player[] = [
  // GOALKEEPERS
  {
    id: generateDemoUUID('player', 1),
    name: 'Viktor Volkov',
    position: 'GK',
    number: 1,
    stats: { pace: 45, shooting: 25, passing: 68, dribbling: 42, defending: 35, physical: 78 },
    form: 7.8,
    analysis: 'Commanding presence between the posts. 4 clean sheets in last 6 matches. Distribution has improved significantly - long ball accuracy up to 72%. Key save ratio of 81% puts him among the league\'s elite.'
  },
  {
    id: generateDemoUUID('player', 13),
    name: 'Alisson Becker',
    position: 'GK',
    number: 13,
    stats: { pace: 48, shooting: 22, passing: 75, dribbling: 38, defending: 32, physical: 82 },
    form: 7.2,
    analysis: 'Reliable backup option. Made 2 league appearances this season. Shot-stopping remains world-class but distribution slightly below Volkov. Cup specialist.'
  },

  // DEFENDERS
  {
    id: generateDemoUUID('player', 2),
    name: 'Sam Miller',
    position: 'DEF',
    number: 4,
    is_captain: true,
    stats: { pace: 72, shooting: 45, passing: 78, dribbling: 65, defending: 88, physical: 85 },
    form: 8.4,
    analysis: 'The heartbeat of our defense. Captain\'s performances driving team morale. 92% aerial duel success rate. 3 goals from set pieces - a genuine goal threat. Leadership qualities evident in tight games.'
  },
  {
    id: generateDemoUUID('player', 6),
    name: 'Kieran Torres',
    position: 'DEF',
    number: 3,
    stats: { pace: 85, shooting: 52, passing: 74, dribbling: 72, defending: 79, physical: 75 },
    form: 7.6,
    analysis: 'Dynamic left-back averaging 2.3 key passes per game. Overlapping runs creating width. 4 assists in league play. Defensive positioning improving under new tactical setup.'
  },
  {
    id: generateDemoUUID('player', 9),
    name: 'Virgil Ironside',
    position: 'DEF',
    number: 5,
    stats: { pace: 68, shooting: 48, passing: 72, dribbling: 55, defending: 92, physical: 88 },
    form: 8.1,
    analysis: 'Colossus at the back. Partnership with Miller yielding results - only 8 goals conceded with both starting. Reading of the game is exceptional. 94% pass completion in own half.'
  },
  {
    id: generateDemoUUID('player', 12),
    name: 'Kyle Sterling',
    position: 'DEF',
    number: 2,
    stats: { pace: 88, shooting: 55, passing: 76, dribbling: 75, defending: 82, physical: 78 },
    form: 7.9,
    analysis: 'Tireless right-back covering 11.8km per match average. Defensive contribution strong with 3.1 tackles per game. Could improve final ball quality - 2 assists only so far.'
  },
  {
    id: generateDemoUUID('player', 14),
    name: 'Lucas Mendez',
    position: 'DEF',
    number: 15,
    stats: { pace: 65, shooting: 38, passing: 70, dribbling: 58, defending: 84, physical: 80 },
    form: 6.8,
    analysis: 'Versatile center-back providing depth. 3 league starts - solid if unspectacular. Good in air at 87% aerial success. Needs more game time to hit form.'
  },

  // MIDFIELDERS
  {
    id: generateDemoUUID('player', 3),
    name: 'Jay Patel',
    position: 'MID',
    number: 8,
    stats: { pace: 75, shooting: 72, passing: 85, dribbling: 82, defending: 65, physical: 72 },
    form: 8.0,
    analysis: 'The metronome. 91% pass accuracy in the final third. 5 assists this campaign with eye for the killer ball. Workrate in pressing improved - 8.2 ball recoveries per 90.'
  },
  {
    id: generateDemoUUID('player', 7),
    name: 'Luka Modrić',
    position: 'MID',
    number: 14,
    stats: { pace: 72, shooting: 78, passing: 92, dribbling: 88, defending: 62, physical: 68 },
    form: 9.0,
    analysis: 'Maestro pulling the strings. 7 goals, 6 assists - involved in 52% of our goals. Set-piece delivery is elite. At 38, still the best midfielder in the league. Pure class.'
  },
  {
    id: generateDemoUUID('player', 11),
    name: 'Kevin De Bruyne',
    position: 'MID',
    number: 17,
    stats: { pace: 76, shooting: 88, passing: 95, dribbling: 85, defending: 58, physical: 75 },
    form: 9.4,
    analysis: 'Simply unstoppable when fit. 8 assists in 10 league games - on pace for record. Vision and execution are unmatched. The assist for Thorn\'s hat-trick was pure artistry.'
  },
  {
    id: generateDemoUUID('player', 15),
    name: 'Jude Chen',
    position: 'MID',
    number: 22,
    stats: { pace: 82, shooting: 75, passing: 80, dribbling: 84, defending: 70, physical: 78 },
    form: 8.2,
    analysis: 'Box-to-box dynamo breaking out this season. 4 goals from midfield - all from outside the box. Progressive carries leading to chances. The future of this club.'
  },
  {
    id: generateDemoUUID('player', 16),
    name: 'Marco Silva',
    position: 'MID',
    number: 6,
    stats: { pace: 68, shooting: 58, passing: 82, dribbling: 72, defending: 80, physical: 82 },
    form: 7.4,
    analysis: 'Defensive midfielder providing crucial protection. 4.2 interceptions per 90 - league leading. Yellow card count (5) needs monitoring. Unsung hero of our midfield.'
  },

  // FORWARDS
  {
    id: generateDemoUUID('player', 4),
    name: 'Marcus Thorn',
    position: 'FWD',
    number: 9,
    stats: { pace: 88, shooting: 92, passing: 72, dribbling: 85, defending: 42, physical: 82 },
    form: 9.5,
    analysis: 'ELECTRIC. 14 goals in 13 league games - top scorer by 4. Hat-trick hero against Orbital. Pressing from the front creating turnovers. Clinical finishing (42% conversion). On course for Golden Boot.'
  },
  {
    id: generateDemoUUID('player', 5),
    name: 'Billy Bones',
    position: 'FWD',
    number: 10,
    stats: { pace: 90, shooting: 82, passing: 78, dribbling: 88, defending: 38, physical: 72 },
    form: 8.7,
    analysis: 'Partnership with Thorn is lethal - 12 goal contributions as a duo. 6 goals, 5 assists. Dribbling success rate of 68%. Creates space for others. Big game player.'
  },
  {
    id: generateDemoUUID('player', 8),
    name: 'Erling Haaland',
    position: 'FWD',
    number: 11,
    stats: { pace: 92, shooting: 95, passing: 65, dribbling: 78, defending: 48, physical: 90 },
    form: 8.9,
    analysis: 'The super-sub. 5 goals from 420 minutes - a goal every 84 minutes. Physical presence changing games when introduced. Itching for more starts.'
  },
  {
    id: generateDemoUUID('player', 17),
    name: 'Rico Santos',
    position: 'FWD',
    number: 19,
    stats: { pace: 94, shooting: 75, passing: 70, dribbling: 86, defending: 35, physical: 68 },
    form: 7.5,
    analysis: 'Raw pace merchant. 2 goals from the bench. Needs to improve decision-making in final third. Terrifying option against tired defenders.'
  },
  {
    id: generateDemoUUID('player', 18),
    name: 'Tomás Vega',
    position: 'FWD',
    number: 21,
    stats: { pace: 78, shooting: 80, passing: 75, dribbling: 82, defending: 40, physical: 74 },
    form: 7.0,
    analysis: 'Technical forward providing different option. 1 goal, 2 assists in limited minutes. Link-up play is smooth. Could be key in congested December fixtures.'
  },
];

export const MOCK_CLUB: Club = {
  id: DEMO_UUIDS.club,
  name: 'Neon City FC',
  nickname: 'The Cyberpunks',
  slug: 'neon-city-fc',
  tone_context: 'Futuristic, relentless, high-tech. We use data to win. Our fans are early adopters. Bold, confident, but never arrogant. We celebrate innovation and teamwork.',
  players: INITIAL_PLAYERS,
  primary_color: '#00f3ff',
  secondary_color: '#bc13fe',
};

// --- FIXTURES (3 Months: Sept-Dec 2024) ---
// League Position: 2nd (W9 D2 L2) - 29 points from 13 games
// Goals: 32 scored, 12 conceded
export const INITIAL_FIXTURES: Fixture[] = [
  // === COMPLETED MATCHES ===
  // Matchweek 1 - Season Opener
  {
    id: generateDemoUUID('fixture', 1),
    club_id: DEMO_UUIDS.club,
    opponent: 'Phoenix Rising',
    kickoff_time: daysAgo(98), // Sept 1
    status: 'COMPLETED',
    result_home: 2,
    result_away: 1,
    key_events: 'Season opener win! Thorn brace. Nervy finish after they pulled one back. Sterling cleared off the line in stoppage time.',
    scorers: ['Marcus Thorn', 'Marcus Thorn'],
    man_of_the_match: 'Marcus Thorn',
    venue: 'Home',
    competition: 'Cyber League',
    attendance: 42500,
    stats: { home_possession: 58, away_possession: 42, home_shots: 14, away_shots: 8, home_xg: 2.1, away_xg: 0.9 }
  },
  // Matchweek 2
  {
    id: generateDemoUUID('fixture', 2),
    club_id: DEMO_UUIDS.club,
    opponent: 'Steelforge United',
    kickoff_time: daysAgo(91), // Sept 8
    status: 'COMPLETED',
    result_home: 0,
    result_away: 3,
    key_events: 'Dominant away performance. De Bruyne masterclass with 2 assists. Clean sheet for Volkov.',
    scorers: ['Billy Bones', 'Luka Modrić', 'Marcus Thorn'],
    man_of_the_match: 'Kevin De Bruyne',
    venue: 'Away',
    competition: 'Cyber League',
    attendance: 28000,
    stats: { home_possession: 38, away_possession: 62, home_shots: 6, away_shots: 18, home_xg: 0.7, away_xg: 2.8 }
  },
  // Matchweek 3
  {
    id: generateDemoUUID('fixture', 3),
    club_id: DEMO_UUIDS.club,
    opponent: 'Quantum FC',
    kickoff_time: daysAgo(84), // Sept 15
    status: 'COMPLETED',
    result_home: 2,
    result_away: 2,
    key_events: 'Dropped points at home. Twice came from behind. De Bruyne injured - out for 3 weeks.',
    scorers: ['Sam Miller', 'Erling Haaland'],
    man_of_the_match: 'Sam Miller',
    venue: 'Home',
    competition: 'Cyber League',
    attendance: 43200,
    stats: { home_possession: 55, away_possession: 45, home_shots: 16, away_shots: 10, home_xg: 2.4, away_xg: 1.8 }
  },
  // Matchweek 4
  {
    id: generateDemoUUID('fixture', 4),
    club_id: DEMO_UUIDS.club,
    opponent: 'Binary Stars',
    kickoff_time: daysAgo(77), // Sept 22
    status: 'COMPLETED',
    result_home: 1,
    result_away: 4,
    key_events: 'Statement win without KDB. Four different scorers. Jude Chen debut goal - a screamer from 25 yards.',
    scorers: ['Marcus Thorn', 'Billy Bones', 'Jude Chen', 'Jay Patel'],
    man_of_the_match: 'Jude Chen',
    venue: 'Away',
    competition: 'Cyber League',
    attendance: 18500,
    stats: { home_possession: 42, away_possession: 58, home_shots: 7, away_shots: 19, home_xg: 1.2, away_xg: 3.5 }
  },
  // Matchweek 5
  {
    id: generateDemoUUID('fixture', 5),
    club_id: DEMO_UUIDS.club,
    opponent: 'Nebula City',
    kickoff_time: daysAgo(70), // Sept 29
    status: 'COMPLETED',
    result_home: 3,
    result_away: 0,
    key_events: 'Back to winning ways at home. Thorn continues hot streak. First clean sheet of the season.',
    scorers: ['Marcus Thorn', 'Marcus Thorn', 'Luka Modrić'],
    man_of_the_match: 'Viktor Volkov',
    venue: 'Home',
    competition: 'Cyber League',
    attendance: 44100,
    stats: { home_possession: 62, away_possession: 38, home_shots: 20, away_shots: 4, home_xg: 3.2, away_xg: 0.4 }
  },
  // Matchweek 6 - Cup Match
  {
    id: generateDemoUUID('fixture', 6),
    club_id: DEMO_UUIDS.club,
    opponent: 'Metro Wanderers',
    kickoff_time: daysAgo(63), // Oct 6 - Cup R2
    status: 'COMPLETED',
    result_home: 4,
    result_away: 1,
    key_events: 'Cup progress secured. Rotated squad delivered. Haaland brace off the bench. Youth players got minutes.',
    scorers: ['Erling Haaland', 'Erling Haaland', 'Rico Santos', 'Tomás Vega'],
    man_of_the_match: 'Erling Haaland',
    venue: 'Home',
    competition: 'Galaxy Cup',
    attendance: 31000,
    stats: { home_possession: 68, away_possession: 32, home_shots: 22, away_shots: 6, home_xg: 4.1, away_xg: 1.0 }
  },
  // Matchweek 7
  {
    id: generateDemoUUID('fixture', 7),
    club_id: DEMO_UUIDS.club,
    opponent: 'Titan Rovers',
    kickoff_time: daysAgo(56), // Oct 13
    status: 'COMPLETED',
    result_home: 1,
    result_away: 2,
    key_events: 'FIRST LEAGUE DEFEAT. Controversial penalty decision in 88th min. Ref had a shocker. We were the better team.',
    scorers: ['Billy Bones'],
    man_of_the_match: 'Virgil Ironside',
    venue: 'Away',
    competition: 'Cyber League',
    attendance: 35000,
    stats: { home_possession: 45, away_possession: 55, home_shots: 9, away_shots: 15, home_xg: 1.1, away_xg: 2.3 }
  },
  // Matchweek 8
  {
    id: generateDemoUUID('fixture', 8),
    club_id: DEMO_UUIDS.club,
    opponent: 'Apex Athletic',
    kickoff_time: daysAgo(49), // Oct 20
    status: 'COMPLETED',
    result_home: 2,
    result_away: 0,
    key_events: 'Bounce back win. KDB returns and immediately assists. Miller header from corner.',
    scorers: ['Sam Miller', 'Marcus Thorn'],
    man_of_the_match: 'Kevin De Bruyne',
    venue: 'Home',
    competition: 'Cyber League',
    attendance: 44800,
    stats: { home_possession: 60, away_possession: 40, home_shots: 17, away_shots: 6, home_xg: 2.5, away_xg: 0.6 }
  },
  // Matchweek 9
  {
    id: generateDemoUUID('fixture', 9),
    club_id: DEMO_UUIDS.club,
    opponent: 'Vector Valley',
    kickoff_time: daysAgo(42), // Oct 27
    status: 'COMPLETED',
    result_home: 0,
    result_away: 2,
    key_events: 'Professional away win. Torres first goal of the season. Modrić free-kick special.',
    scorers: ['Kieran Torres', 'Luka Modrić'],
    man_of_the_match: 'Luka Modrić',
    venue: 'Away',
    competition: 'Cyber League',
    attendance: 22000,
    stats: { home_possession: 40, away_possession: 60, home_shots: 8, away_shots: 14, home_xg: 0.8, away_xg: 2.0 }
  },
  // Matchweek 10
  {
    id: generateDemoUUID('fixture', 10),
    club_id: DEMO_UUIDS.club,
    opponent: 'Cipher Town',
    kickoff_time: daysAgo(35), // Nov 3
    status: 'COMPLETED',
    result_home: 5,
    result_away: 1,
    key_events: 'DEMOLITION JOB. Thorn another hat-trick! The stadium was rocking. Best performance of the season.',
    scorers: ['Marcus Thorn', 'Marcus Thorn', 'Marcus Thorn', 'Kevin De Bruyne', 'Jude Chen'],
    man_of_the_match: 'Marcus Thorn',
    venue: 'Home',
    competition: 'Cyber League',
    attendance: 45000,
    stats: { home_possession: 65, away_possession: 35, home_shots: 24, away_shots: 5, home_xg: 4.8, away_xg: 0.9 }
  },
  // Matchweek 11 - Cup Match
  {
    id: generateDemoUUID('fixture', 11),
    club_id: DEMO_UUIDS.club,
    opponent: 'Apex Athletic',
    kickoff_time: daysAgo(28), // Nov 10 - Cup R3
    status: 'COMPLETED',
    result_home: 1,
    result_away: 0,
    key_events: 'Tight cup battle. Bones winner in extra time. Squad depth tested. Through to quarter-finals.',
    scorers: ['Billy Bones'],
    man_of_the_match: 'Marco Silva',
    venue: 'Away',
    competition: 'Galaxy Cup',
    attendance: 29000,
    stats: { home_possession: 48, away_possession: 52, home_shots: 11, away_shots: 13, home_xg: 1.1, away_xg: 1.3 }
  },
  // Matchweek 12
  {
    id: generateDemoUUID('fixture', 12),
    club_id: DEMO_UUIDS.club,
    opponent: 'Orbital United',
    kickoff_time: daysAgo(21), // Nov 17 - BIG GAME
    status: 'COMPLETED',
    result_home: 1,
    result_away: 3,
    key_events: 'TOP OF THE TABLE CLASH. We came, we saw, we conquered. Thorn hat-trick secures huge 3 points. De Bruyne assist of the season for the third.',
    scorers: ['Marcus Thorn', 'Marcus Thorn', 'Marcus Thorn'],
    man_of_the_match: 'Marcus Thorn',
    venue: 'Away',
    competition: 'Cyber League',
    attendance: 52000,
    stats: { home_possession: 42, away_possession: 58, home_shots: 8, away_shots: 17, home_xg: 1.2, away_xg: 3.4 }
  },
  // Matchweek 13
  {
    id: generateDemoUUID('fixture', 13),
    club_id: DEMO_UUIDS.club,
    opponent: 'Grid FC',
    kickoff_time: daysAgo(14), // Nov 24
    status: 'COMPLETED',
    result_home: 2,
    result_away: 1,
    key_events: 'Hard-fought win. They made us work for it. Modrić penalty and Haaland header. 2nd place secured before December.',
    scorers: ['Luka Modrić', 'Erling Haaland'],
    man_of_the_match: 'Jay Patel',
    venue: 'Home',
    competition: 'Cyber League',
    attendance: 44500,
    stats: { home_possession: 54, away_possession: 46, home_shots: 13, away_shots: 11, home_xg: 1.9, away_xg: 1.2 }
  },
  // Matchweek 14 - LAST MATCH
  {
    id: generateDemoUUID('fixture', 14),
    club_id: DEMO_UUIDS.club,
    opponent: 'Nova Dynamic',
    kickoff_time: daysAgo(7), // Dec 1
    status: 'COMPLETED',
    result_home: 0,
    result_away: 0,
    key_events: 'Frustrating draw. Hit woodwork 3 times. They parked the bus and we couldn\'t break through. Thorn had goal wrongly disallowed.',
    scorers: [],
    man_of_the_match: 'Viktor Volkov',
    venue: 'Away',
    competition: 'Cyber League',
    attendance: 19500,
    stats: { home_possession: 32, away_possession: 68, home_shots: 4, away_shots: 21, home_xg: 0.3, away_xg: 2.8 }
  },

  // === UPCOMING MATCHES ===
  // Matchweek 15 - TODAY'S MATCH
  {
    id: generateDemoUUID('fixture', 15),
    club_id: DEMO_UUIDS.club,
    opponent: 'Phoenix Rising',
    kickoff_time: hoursFromNow(3), // TODAY - 3 hours from now
    status: 'SCHEDULED',
    venue: 'Home',
    competition: 'Cyber League',
    attendance: 38000,
  },
  // Matchweek 16
  {
    id: generateDemoUUID('fixture', 16),
    club_id: DEMO_UUIDS.club,
    opponent: 'Steelforge United',
    kickoff_time: daysFromNow(10), // Dec 21
    status: 'SCHEDULED',
    venue: 'Home',
    competition: 'Cyber League',
  },
  // Cup Quarter-Final
  {
    id: generateDemoUUID('fixture', 17),
    club_id: DEMO_UUIDS.club,
    opponent: 'Quantum FC',
    kickoff_time: daysFromNow(17), // Dec 28 - Cup QF
    status: 'SCHEDULED',
    venue: 'Home',
    competition: 'Galaxy Cup',
  },
  // Matchweek 17 - New Years Day
  {
    id: generateDemoUUID('fixture', 18),
    club_id: DEMO_UUIDS.club,
    opponent: 'Binary Stars',
    kickoff_time: daysFromNow(21), // Jan 1
    status: 'SCHEDULED',
    venue: 'Home',
    competition: 'Cyber League',
  },
];

// --- CONTENT PIPELINE (Published, Approved, Drafts) ---
export const INITIAL_CONTENT: ContentItem[] = [
  // === PUBLISHED CONTENT ===
  {
    id: generateDemoUUID('content', 1),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 12),
    type: 'REPORT',
    platform: 'Website',
    title: 'THORN HAT-TRICK SINKS ORBITAL IN TITLE SIX-POINTER',
    body: `# NEON CITY 3-1 ORBITAL UNITED\n\nMarcus Thorn produced a devastating hat-trick as Neon City FC dismantled league leaders Orbital United at their own ground in the biggest win of the season.\n\nThe Cyberpunks made their intentions clear from the first whistle, with De Bruyne pulling the strings in midfield. Thorn opened the scoring on 23 minutes, latching onto a defense-splitting pass before coolly slotting past the keeper.\n\nOrbital equalized before half-time, but Neon City's response was emphatic. Thorn restored the lead with a bullet header from Torres's cross, before completing his hat-trick with a stunning chip in the 78th minute - assisted by a piece of De Bruyne wizardry.\n\n**Manager's Reaction:** "This is what we've been building towards. The players executed the plan perfectly. Marcus is in the form of his life, but this was a complete team performance."\n\n**Man of the Match:** Marcus Thorn (3 goals)`,
    status: 'PUBLISHED',
    created_at: daysAgo(20),
  },
  {
    id: generateDemoUUID('content', 2),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 12),
    type: 'SOCIAL',
    platform: 'Twitter',
    body: `🔥 FULL TIME: Orbital 1-3 NEON CITY\n\n⚽ Thorn 23' \n⚽ Thorn 58'\n⚽ Thorn 78'\n\nStatement. Made. 💜⚡\n\n#NeonCityFC #CyberLeague #ThornOnFire`,
    status: 'PUBLISHED',
    created_at: daysAgo(21),
  },
  {
    id: generateDemoUUID('content', 3),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 10),
    type: 'REPORT',
    platform: 'Website',
    title: 'FIVE-STAR CYBERPUNKS CRUSH CIPHER TOWN',
    body: `# NEON CITY 5-1 CIPHER TOWN\n\nNeon City FC produced their most complete performance of the campaign, with Marcus Thorn claiming another match ball in a comprehensive victory.\n\nThe home side were relentless from start to finish, with Thorn opening his account inside 10 minutes. De Bruyne doubled the lead with a sublime free-kick before Thorn struck twice more before the break.\n\nJude Chen capped off the scoring with his second goal of the season, continuing his impressive breakthrough campaign.\n\n**Key Stats:**\n- 24 shots (12 on target)\n- 65% possession\n- 4.8 xG\n\n**Next Up:** Galaxy Cup Round 3 vs Apex Athletic`,
    status: 'PUBLISHED',
    created_at: daysAgo(34),
  },
  {
    id: generateDemoUUID('content', 4),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 13),
    type: 'SOCIAL',
    platform: 'Instagram',
    body: `Another win secured ✅\n\nModrić from the spot ⚽\nHaaland with the header 🎯\n\n2nd place LOCKED IN going into December 💪\n\n#NeonCityFC #OnTheRise`,
    status: 'PUBLISHED',
    created_at: daysAgo(13),
  },
  {
    id: generateDemoUUID('content', 5),
    club_id: DEMO_UUIDS.club,
    type: 'NEWSLETTER',
    platform: 'Email',
    title: 'November Review: Our Best Month Yet',
    body: `Dear Cyberpunks,\n\nWhat a month November was! Here's your monthly wrap-up:\n\n📊 NOVEMBER STATS:\n- Played: 4 | Won: 3 | Drew: 1\n- Goals Scored: 11 | Goals Conceded: 3\n- League Position: 2nd (29 points)\n\n⭐ PLAYER OF THE MONTH:\nMarcus Thorn - 7 goals in 4 games. Simply unstoppable.\n\n🏆 HIGHLIGHT:\nThe 3-1 victory at Orbital was the statement win we needed. Top of the table for 48 hours before they scraped a win.\n\n🎟️ UPCOMING:\nPhoenix Rising away on December 14th - tickets on sale now!\n\nUTNC! ⚡`,
    status: 'PUBLISHED',
    created_at: daysAgo(10),
  },

  // === APPROVED CONTENT (Ready to Post) ===
  {
    id: generateDemoUUID('content', 6),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 15),
    type: 'PREVIEW',
    platform: 'Website',
    title: 'PREVIEW: Phoenix Rising (A) - Revenge Mission',
    body: `# PHOENIX RISING vs NEON CITY FC\n\n**When:** Saturday, December 14th - 3:00 PM\n**Where:** Flame Stadium\n**Competition:** Cyber League - Matchweek 15\n\n## THE STORY\nA return to where it all began. Phoenix Rising were our first opponents this season, and that 2-1 win set the tone for our campaign.\n\nThey'll be out for revenge on home turf, but we arrive in confident mood after beating Orbital in our last away game.\n\n## FORM GUIDE\n**Neon City:** W-D-W-W-W (13 games: W9 D2 L2)\n**Phoenix Rising:** L-W-L-D-W (Currently 8th)\n\n## KEY BATTLE\nMarcus Thorn vs their center-back pairing. They struggled to contain him in September - can they do better this time?\n\n## PREDICTED XI\nVolkov; Sterling, Miller (C), Ironside, Torres; Silva, Modrić, De Bruyne, Chen; Bones, Thorn`,
    status: 'APPROVED',
    created_at: daysAgo(1),
  },
  {
    id: generateDemoUUID('content', 7),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 15),
    type: 'SOCIAL',
    platform: 'Twitter',
    body: `🔜 MATCHDAY INCOMING\n\n🆚 Phoenix Rising\n📍 Flame Stadium\n🗓️ Saturday 3PM\n📺 Stream on CyberLeague+\n\nTime to keep the momentum going 💜⚡\n\n#NCFC #PhxNCFC`,
    status: 'APPROVED',
    created_at: daysAgo(1),
  },
  {
    id: generateDemoUUID('content', 8),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 15),
    type: 'GRAPHIC_COPY',
    platform: 'Instagram',
    body: `GAMEDAY GRAPHIC\n\n🔥 PHOENIX RISING vs NEON CITY FC 🔥\n\nSATURDAY | 3PM | FLAME STADIUM\n\n"Back where it all started"\n\n#NCFC #AwayDays`,
    status: 'APPROVED',
    created_at: daysAgo(1),
  },

  // === DRAFT CONTENT (Needs Review) ===
  {
    id: generateDemoUUID('content', 9),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 14),
    type: 'REPORT',
    platform: 'Website',
    title: 'FRUSTRATION AT NOVA AS CHANCES GO BEGGING',
    body: `# NOVA DYNAMIC 0-0 NEON CITY\n\n[DRAFT - NEEDS FINAL REVIEW]\n\nNeon City dominated but couldn't find the breakthrough in a frustrating goalless draw at Nova Dynamic.\n\nDespite enjoying 68% possession and creating chances worth 2.8 xG, the Cyberpunks were unable to break down a resolute home defense that sat deep and defended in numbers.\n\nMarcus Thorn had a goal controversially ruled out for offside in the second half, with replays suggesting the decision was marginal at best.\n\n**Talking Point:** Are we becoming too predictable? Teams are sitting deep against us.\n\n**Next Up:** Phoenix Rising (A) - December 14th`,
    status: 'DRAFT',
    created_at: daysAgo(6),
  },
  {
    id: generateDemoUUID('content', 10),
    club_id: DEMO_UUIDS.club,
    type: 'ARTICLE',
    platform: 'Website',
    title: 'THORN: "I\'m Just Getting Started"',
    body: `[INTERVIEW DRAFT]\n\nExclusive: We sat down with the league's top scorer to discuss his incredible season so far.\n\n**14 goals in 13 games - did you expect this?**\n"Honestly? I knew I was in good shape coming into the season, but 14 goals... that's beyond what I imagined. The service I'm getting from KDB and Luka makes my job easier."\n\n**The hat-trick at Orbital - take us through it:**\n"That was special. Their fans were giving me grief all game, so to score three... [laughs] Sometimes football writes its own scripts."\n\n**Golden Boot ambitions?**\n"One game at a time. But yeah, why not? If I stay fit and we keep creating chances, who knows what's possible."\n\n[NEEDS: Manager quote, stats graphic, image approvals]`,
    status: 'DRAFT',
    created_at: daysAgo(3),
  },
  {
    id: generateDemoUUID('content', 11),
    club_id: DEMO_UUIDS.club,
    fixture_id: generateDemoUUID('fixture', 17),
    type: 'PREVIEW',
    platform: 'Website',
    title: 'CUP QUARTER-FINAL PREVIEW: Quantum FC',
    body: `[EARLY DRAFT - Cup QF Preview]\n\n# GALAXY CUP QUARTER-FINAL\n## NEON CITY vs QUANTUM FC\n\n**Date:** December 28th\n**Venue:** Neon Arena\n\nA chance for cup glory continues as we host Quantum FC in the last eight.\n\nWe drew 2-2 with them in the league back in September - a game where we came from behind twice. They'll be a tough test.\n\n[TODO: Add team news, ticket info, historical record]`,
    status: 'DRAFT',
    created_at: daysAgo(2),
  },
];

// --- SPONSORS (Commercial Partners) ---
export const INITIAL_SPONSORS: Sponsor[] = [
  {
    id: generateDemoUUID('sponsor', 1),
    name: 'CyberDyne Systems',
    sector: 'Technology',
    tier: 'Platinum',
    value: '£150,000',
    contract_end: '2026-06-30',
    status: 'Active',
    logo_initials: 'CD'
  },
  {
    id: generateDemoUUID('sponsor', 2),
    name: 'Orbital Energy Drinks',
    sector: 'Beverage',
    tier: 'Gold',
    value: '£85,000',
    contract_end: '2025-01-31',
    status: 'Expiring',
    logo_initials: 'OE'
  },
  {
    id: generateDemoUUID('sponsor', 3),
    name: 'NeoTextile Apparel',
    sector: 'Sportswear',
    tier: 'Gold',
    value: '£75,000',
    contract_end: '2025-06-30',
    status: 'Active',
    logo_initials: 'NT'
  },
  {
    id: generateDemoUUID('sponsor', 4),
    name: 'Quantum Motors',
    sector: 'Automotive',
    tier: 'Silver',
    value: '£40,000',
    contract_end: '2025-12-31',
    status: 'Active',
    logo_initials: 'QM'
  },
  {
    id: generateDemoUUID('sponsor', 5),
    name: 'DataStream Analytics',
    sector: 'Tech/Data',
    tier: 'Silver',
    value: '£35,000',
    contract_end: '2025-03-31',
    status: 'Negotiating',
    logo_initials: 'DS'
  },
  {
    id: generateDemoUUID('sponsor', 6),
    name: 'GridBank Financial',
    sector: 'Finance',
    tier: 'Platinum',
    value: '£120,000',
    contract_end: '2027-06-30',
    status: 'Active',
    logo_initials: 'GB'
  },
];

// --- ADMIN TASKS (Ops Queue) - DEPRECATED ---
// Removed as part of pivot to Commercial & Media Operating System
// Mock data completely removed - AdminTask interface and INITIAL_TASKS export deleted

// --- INBOX EMAILS - DEPRECATED ---
// Removed as part of pivot to Commercial & Media Operating System
// Mock data completely removed - InboxEmail interface and INITIAL_EMAILS export deleted

// ============================================================================
// Template Packs & Fixture Tasks
// ============================================================================

export interface TemplateTask {
  label: string;
  sort_order: number;
}

export interface TemplatePack {
  id: string;
  club_id: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  tasks: TemplateTask[];
  created_at?: string;
  updated_at?: string;
}

export interface FixtureTask {
  id: string;
  club_id: string;
  fixture_id: string;
  template_pack_id?: string;
  label: string;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Player Availability
// ============================================================================

export type AvailabilityStatus = 'available' | 'unavailable' | 'maybe' | 'injured' | 'no_response';

export interface PlayerAvailability {
  id: string;
  club_id: string;
  player_id: string;
  fixture_id: string;
  status: AvailabilityStatus;
  response_note?: string;
  responded_at?: string;
  marked_by?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Equipment Management (Grassroots Model)
// ============================================================================

// Kit condition for individual player kit
export type KitCondition = 'new' | 'good' | 'worn' | 'needs_replacing';

// Player's assigned kit
export interface PlayerKitAssignment {
  id: string;
  club_id: string;
  player_id: string;
  shirt_number: number;
  shirt_size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  shorts_size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  socks_size?: 'S' | 'M' | 'L';
  kit_condition: KitCondition;
  has_training_kit?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Club shared equipment (not assigned to players)
export interface ClubEquipment {
  id: string;
  club_id: string;
  name: string;
  category: 'matchday' | 'training' | 'medical' | 'other';
  quantity: number;
  condition: 'good' | 'fair' | 'poor';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Match day bag checklist item
export interface MatchDayChecklistItem {
  id: string;
  label: string;
  is_checked: boolean;
}

// Match day bag checklist per fixture
export interface MatchDayChecklist {
  id: string;
  club_id: string;
  fixture_id: string;
  items: MatchDayChecklistItem[];
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Kit request from player
export interface KitRequest {
  id: string;
  club_id: string;
  player_id: string;
  request_type: 'new_kit' | 'replacement' | 'size_change';
  item_needed: 'shirt' | 'shorts' | 'socks' | 'full_kit' | 'training_kit';
  size_needed?: string;
  reason?: string;
  status: 'pending' | 'ordered' | 'fulfilled';
  created_at: string;
  updated_at?: string;
}

// Laundry batch (simplified)
export type LaundryStatus = 'dirty' | 'washing' | 'ready';

export interface LaundryBatch {
  id: string;
  club_id: string;
  fixture_id?: string;
  status: LaundryStatus;
  kit_count: number;
  sent_at?: string;
  returned_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Default match day bag items
export const DEFAULT_MATCHDAY_BAG: Omit<MatchDayChecklistItem, 'id'>[] = [
  { label: 'Match balls (x3)', is_checked: false },
  { label: 'Corner flags (x4)', is_checked: false },
  { label: 'First aid kit', is_checked: false },
  { label: 'Water bottles', is_checked: false },
  { label: 'Team sheet copies', is_checked: false },
  { label: 'Referee payment', is_checked: false },
  { label: 'Spare kit', is_checked: false },
  { label: 'Warm-up bibs', is_checked: false },
  { label: 'Cones', is_checked: false },
  { label: 'Captain armband', is_checked: false },
];

// ============================================================================
// Default Template Packs (for new clubs)
// ============================================================================

export const DEFAULT_TEMPLATE_PACKS: Omit<TemplatePack, 'id' | 'club_id'>[] = [
  {
    name: 'Matchday Pack (Home)',
    description: 'Essential tasks for home matches',
    is_enabled: true,
    tasks: [
      { label: 'Confirm referee and officials', sort_order: 1 },
      { label: 'Prepare matchday programme', sort_order: 2 },
      { label: 'Check pitch and goal nets', sort_order: 3 },
      { label: 'Set up refreshments', sort_order: 4 },
      { label: 'Post lineup graphic on social', sort_order: 5 },
      { label: 'Brief stewards and volunteers', sort_order: 6 },
    ]
  },
  {
    name: 'Matchday Pack (Away)',
    description: 'Essential tasks for away matches',
    is_enabled: true,
    tasks: [
      { label: 'Confirm transport arrangements', sort_order: 1 },
      { label: 'Check away kit is clean and packed', sort_order: 2 },
      { label: 'Send travel details to players', sort_order: 3 },
      { label: 'Post lineup graphic on social', sort_order: 4 },
      { label: 'Confirm meeting time and location', sort_order: 5 },
    ]
  },
  {
    name: 'Training Night Pack',
    description: 'Pre-training session tasks',
    is_enabled: false,
    tasks: [
      { label: 'Set up training cones and equipment', sort_order: 1 },
      { label: 'Check first aid kit', sort_order: 2 },
      { label: 'Confirm session plan with coach', sort_order: 3 },
      { label: 'Take attendance', sort_order: 4 },
    ]
  },
  {
    name: 'Squad Availability Pack',
    description: 'Collect and track player availability',
    is_enabled: true,
    tasks: [
      { label: 'Send availability request to group', sort_order: 1 },
      { label: 'Chase non-responders', sort_order: 2 },
      { label: 'Confirm final squad', sort_order: 3 },
      { label: 'Notify unavailable players', sort_order: 4 },
    ]
  },
  {
    name: 'Kit & Equipment Pack',
    description: 'Kit management before and after match',
    is_enabled: false,
    tasks: [
      { label: 'Collect dirty kit from last match', sort_order: 1 },
      { label: 'Send kit for laundry', sort_order: 2 },
      { label: 'Check kit stock levels', sort_order: 3 },
      { label: 'Prepare match kit', sort_order: 4 },
    ]
  },
  {
    name: 'Media Pack',
    description: 'Content tasks for match coverage',
    is_enabled: true,
    tasks: [
      { label: 'Write match preview', sort_order: 1 },
      { label: 'Create matchday graphic', sort_order: 2 },
      { label: 'Post pre-match content', sort_order: 3 },
      { label: 'Post full-time result', sort_order: 4 },
      { label: 'Write match report', sort_order: 5 },
    ]
  },
];
