
export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
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
// MOCK DATA - 3 MONTHS INTO THE SEASON
// Season started: September 1st, 2024
// Current Date: December 11th, 2024 (Week 14)
// ============================================================================

// Helper to create dates relative to "now"
const daysAgo = (days: number) => new Date(Date.now() - 86400000 * days).toISOString();
const daysFromNow = (days: number) => new Date(Date.now() + 86400000 * days).toISOString();

// --- SQUAD (18 Players with Season Stats & Analysis) ---
export const INITIAL_PLAYERS: Player[] = [
  // GOALKEEPERS
  { 
    id: 'p-1', 
    name: 'Viktor Volkov', 
    position: 'GK', 
    number: 1, 
    stats: { pace: 45, shooting: 25, passing: 68, dribbling: 42, defending: 35, physical: 78 }, 
    form: 7.8,
    analysis: 'Commanding presence between the posts. 4 clean sheets in last 6 matches. Distribution has improved significantly - long ball accuracy up to 72%. Key save ratio of 81% puts him among the league\'s elite.'
  },
  { 
    id: 'p-13', 
    name: 'Alisson Becker', 
    position: 'GK', 
    number: 13, 
    stats: { pace: 48, shooting: 22, passing: 75, dribbling: 38, defending: 32, physical: 82 }, 
    form: 7.2,
    analysis: 'Reliable backup option. Made 2 league appearances this season. Shot-stopping remains world-class but distribution slightly below Volkov. Cup specialist.'
  },
  
  // DEFENDERS
  { 
    id: 'p-2', 
    name: 'Sam Miller', 
    position: 'DEF', 
    number: 4, 
    is_captain: true, 
    stats: { pace: 72, shooting: 45, passing: 78, dribbling: 65, defending: 88, physical: 85 }, 
    form: 8.4,
    analysis: 'The heartbeat of our defense. Captain\'s performances driving team morale. 92% aerial duel success rate. 3 goals from set pieces - a genuine goal threat. Leadership qualities evident in tight games.'
  },
  { 
    id: 'p-6', 
    name: 'Kieran Torres', 
    position: 'DEF', 
    number: 3, 
    stats: { pace: 85, shooting: 52, passing: 74, dribbling: 72, defending: 79, physical: 75 }, 
    form: 7.6,
    analysis: 'Dynamic left-back averaging 2.3 key passes per game. Overlapping runs creating width. 4 assists in league play. Defensive positioning improving under new tactical setup.'
  },
  { 
    id: 'p-9', 
    name: 'Virgil Ironside', 
    position: 'DEF', 
    number: 5, 
    stats: { pace: 68, shooting: 48, passing: 72, dribbling: 55, defending: 92, physical: 88 }, 
    form: 8.1,
    analysis: 'Colossus at the back. Partnership with Miller yielding results - only 8 goals conceded with both starting. Reading of the game is exceptional. 94% pass completion in own half.'
  },
  { 
    id: 'p-12', 
    name: 'Kyle Sterling', 
    position: 'DEF', 
    number: 2, 
    stats: { pace: 88, shooting: 55, passing: 76, dribbling: 75, defending: 82, physical: 78 }, 
    form: 7.9,
    analysis: 'Tireless right-back covering 11.8km per match average. Defensive contribution strong with 3.1 tackles per game. Could improve final ball quality - 2 assists only so far.'
  },
  { 
    id: 'p-14', 
    name: 'Lucas Mendez', 
    position: 'DEF', 
    number: 15, 
    stats: { pace: 65, shooting: 38, passing: 70, dribbling: 58, defending: 84, physical: 80 }, 
    form: 6.8,
    analysis: 'Versatile center-back providing depth. 3 league starts - solid if unspectacular. Good in air at 87% aerial success. Needs more game time to hit form.'
  },
  
  // MIDFIELDERS
  { 
    id: 'p-3', 
    name: 'Jay Patel', 
    position: 'MID', 
    number: 8, 
    stats: { pace: 75, shooting: 72, passing: 85, dribbling: 82, defending: 65, physical: 72 }, 
    form: 8.0,
    analysis: 'The metronome. 91% pass accuracy in the final third. 5 assists this campaign with eye for the killer ball. Workrate in pressing improved - 8.2 ball recoveries per 90.'
  },
  { 
    id: 'p-7', 
    name: 'Luka Modrić', 
    position: 'MID', 
    number: 14, 
    stats: { pace: 72, shooting: 78, passing: 92, dribbling: 88, defending: 62, physical: 68 }, 
    form: 9.0,
    analysis: 'Maestro pulling the strings. 7 goals, 6 assists - involved in 52% of our goals. Set-piece delivery is elite. At 38, still the best midfielder in the league. Pure class.'
  },
  { 
    id: 'p-11', 
    name: 'Kevin De Bruyne', 
    position: 'MID', 
    number: 17, 
    stats: { pace: 76, shooting: 88, passing: 95, dribbling: 85, defending: 58, physical: 75 }, 
    form: 9.4,
    analysis: 'Simply unstoppable when fit. 8 assists in 10 league games - on pace for record. Vision and execution are unmatched. The assist for Thorn\'s hat-trick was pure artistry.'
  },
  { 
    id: 'p-15', 
    name: 'Jude Chen', 
    position: 'MID', 
    number: 22, 
    stats: { pace: 82, shooting: 75, passing: 80, dribbling: 84, defending: 70, physical: 78 }, 
    form: 8.2,
    analysis: 'Box-to-box dynamo breaking out this season. 4 goals from midfield - all from outside the box. Progressive carries leading to chances. The future of this club.'
  },
  { 
    id: 'p-16', 
    name: 'Marco Silva', 
    position: 'MID', 
    number: 6, 
    stats: { pace: 68, shooting: 58, passing: 82, dribbling: 72, defending: 80, physical: 82 }, 
    form: 7.4,
    analysis: 'Defensive midfielder providing crucial protection. 4.2 interceptions per 90 - league leading. Yellow card count (5) needs monitoring. Unsung hero of our midfield.'
  },
  
  // FORWARDS
  { 
    id: 'p-4', 
    name: 'Marcus Thorn', 
    position: 'FWD', 
    number: 9, 
    stats: { pace: 88, shooting: 92, passing: 72, dribbling: 85, defending: 42, physical: 82 }, 
    form: 9.5,
    analysis: 'ELECTRIC. 14 goals in 13 league games - top scorer by 4. Hat-trick hero against Orbital. Pressing from the front creating turnovers. Clinical finishing (42% conversion). On course for Golden Boot.'
  },
  { 
    id: 'p-5', 
    name: 'Billy Bones', 
    position: 'FWD', 
    number: 10, 
    stats: { pace: 90, shooting: 82, passing: 78, dribbling: 88, defending: 38, physical: 72 }, 
    form: 8.7,
    analysis: 'Partnership with Thorn is lethal - 12 goal contributions as a duo. 6 goals, 5 assists. Dribbling success rate of 68%. Creates space for others. Big game player.'
  },
  { 
    id: 'p-8', 
    name: 'Erling Haaland', 
    position: 'FWD', 
    number: 11, 
    stats: { pace: 92, shooting: 95, passing: 65, dribbling: 78, defending: 48, physical: 90 }, 
    form: 8.9,
    analysis: 'The super-sub. 5 goals from 420 minutes - a goal every 84 minutes. Physical presence changing games when introduced. Itching for more starts.'
  },
  { 
    id: 'p-17', 
    name: 'Rico Santos', 
    position: 'FWD', 
    number: 19, 
    stats: { pace: 94, shooting: 75, passing: 70, dribbling: 86, defending: 35, physical: 68 }, 
    form: 7.5,
    analysis: 'Raw pace merchant. 2 goals from the bench. Needs to improve decision-making in final third. Terrifying option against tired defenders.'
  },
  { 
    id: 'p-18', 
    name: 'Tomás Vega', 
    position: 'FWD', 
    number: 21, 
    stats: { pace: 78, shooting: 80, passing: 75, dribbling: 82, defending: 40, physical: 74 }, 
    form: 7.0,
    analysis: 'Technical forward providing different option. 1 goal, 2 assists in limited minutes. Link-up play is smooth. Could be key in congested December fixtures.'
  },
];

export const MOCK_CLUB: Club = {
  id: 'c-1',
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
    id: 'f-1',
    club_id: 'c-1',
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
    id: 'f-2',
    club_id: 'c-1',
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
    id: 'f-3',
    club_id: 'c-1',
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
    id: 'f-4',
    club_id: 'c-1',
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
    id: 'f-5',
    club_id: 'c-1',
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
    id: 'f-6',
    club_id: 'c-1',
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
    id: 'f-7',
    club_id: 'c-1',
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
    id: 'f-8',
    club_id: 'c-1',
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
    id: 'f-9',
    club_id: 'c-1',
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
    id: 'f-10',
    club_id: 'c-1',
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
    id: 'f-11',
    club_id: 'c-1',
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
    id: 'f-12',
    club_id: 'c-1',
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
    id: 'f-13',
    club_id: 'c-1',
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
    id: 'f-14',
    club_id: 'c-1',
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
  // Matchweek 15
  {
    id: 'f-15',
    club_id: 'c-1',
    opponent: 'Phoenix Rising',
    kickoff_time: daysFromNow(3), // Dec 14 - Saturday 3pm
    status: 'SCHEDULED',
    venue: 'Away',
    competition: 'Cyber League',
    attendance: 38000,
  },
  // Matchweek 16
  {
    id: 'f-16',
    club_id: 'c-1',
    opponent: 'Steelforge United',
    kickoff_time: daysFromNow(10), // Dec 21
    status: 'SCHEDULED',
    venue: 'Home',
    competition: 'Cyber League',
  },
  // Cup Quarter-Final
  {
    id: 'f-17',
    club_id: 'c-1',
    opponent: 'Quantum FC',
    kickoff_time: daysFromNow(17), // Dec 28 - Cup QF
    status: 'SCHEDULED',
    venue: 'Home',
    competition: 'Galaxy Cup',
  },
  // Matchweek 17 - New Years Day
  {
    id: 'f-18',
    club_id: 'c-1',
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
    id: 'cnt-1',
    club_id: 'c-1',
    fixture_id: 'f-12',
    type: 'REPORT',
    platform: 'Website',
    title: 'THORN HAT-TRICK SINKS ORBITAL IN TITLE SIX-POINTER',
    body: `# NEON CITY 3-1 ORBITAL UNITED\n\nMarcus Thorn produced a devastating hat-trick as Neon City FC dismantled league leaders Orbital United at their own ground in the biggest win of the season.\n\nThe Cyberpunks made their intentions clear from the first whistle, with De Bruyne pulling the strings in midfield. Thorn opened the scoring on 23 minutes, latching onto a defense-splitting pass before coolly slotting past the keeper.\n\nOrbital equalized before half-time, but Neon City's response was emphatic. Thorn restored the lead with a bullet header from Torres's cross, before completing his hat-trick with a stunning chip in the 78th minute - assisted by a piece of De Bruyne wizardry.\n\n**Manager's Reaction:** "This is what we've been building towards. The players executed the plan perfectly. Marcus is in the form of his life, but this was a complete team performance."\n\n**Man of the Match:** Marcus Thorn (3 goals)`,
    status: 'PUBLISHED',
    created_at: daysAgo(20),
  },
  {
    id: 'cnt-2',
    club_id: 'c-1',
    fixture_id: 'f-12',
    type: 'SOCIAL',
    platform: 'Twitter',
    body: `🔥 FULL TIME: Orbital 1-3 NEON CITY\n\n⚽ Thorn 23' \n⚽ Thorn 58'\n⚽ Thorn 78'\n\nStatement. Made. 💜⚡\n\n#NeonCityFC #CyberLeague #ThornOnFire`,
    status: 'PUBLISHED',
    created_at: daysAgo(21),
  },
  {
    id: 'cnt-3',
    club_id: 'c-1',
    fixture_id: 'f-10',
    type: 'REPORT',
    platform: 'Website',
    title: 'FIVE-STAR CYBERPUNKS CRUSH CIPHER TOWN',
    body: `# NEON CITY 5-1 CIPHER TOWN\n\nNeon City FC produced their most complete performance of the campaign, with Marcus Thorn claiming another match ball in a comprehensive victory.\n\nThe home side were relentless from start to finish, with Thorn opening his account inside 10 minutes. De Bruyne doubled the lead with a sublime free-kick before Thorn struck twice more before the break.\n\nJude Chen capped off the scoring with his second goal of the season, continuing his impressive breakthrough campaign.\n\n**Key Stats:**\n- 24 shots (12 on target)\n- 65% possession\n- 4.8 xG\n\n**Next Up:** Galaxy Cup Round 3 vs Apex Athletic`,
    status: 'PUBLISHED',
    created_at: daysAgo(34),
  },
  {
    id: 'cnt-4',
    club_id: 'c-1',
    fixture_id: 'f-13',
    type: 'SOCIAL',
    platform: 'Instagram',
    body: `Another win secured ✅\n\nModrić from the spot ⚽\nHaaland with the header 🎯\n\n2nd place LOCKED IN going into December 💪\n\n#NeonCityFC #OnTheRise`,
    status: 'PUBLISHED',
    created_at: daysAgo(13),
  },
  {
    id: 'cnt-5',
    club_id: 'c-1',
    type: 'NEWSLETTER',
    platform: 'Email',
    title: 'November Review: Our Best Month Yet',
    body: `Dear Cyberpunks,\n\nWhat a month November was! Here's your monthly wrap-up:\n\n📊 NOVEMBER STATS:\n- Played: 4 | Won: 3 | Drew: 1\n- Goals Scored: 11 | Goals Conceded: 3\n- League Position: 2nd (29 points)\n\n⭐ PLAYER OF THE MONTH:\nMarcus Thorn - 7 goals in 4 games. Simply unstoppable.\n\n🏆 HIGHLIGHT:\nThe 3-1 victory at Orbital was the statement win we needed. Top of the table for 48 hours before they scraped a win.\n\n🎟️ UPCOMING:\nPhoenix Rising away on December 14th - tickets on sale now!\n\nUTNC! ⚡`,
    status: 'PUBLISHED',
    created_at: daysAgo(10),
  },
  
  // === APPROVED CONTENT (Ready to Post) ===
  {
    id: 'cnt-6',
    club_id: 'c-1',
    fixture_id: 'f-15',
    type: 'PREVIEW',
    platform: 'Website',
    title: 'PREVIEW: Phoenix Rising (A) - Revenge Mission',
    body: `# PHOENIX RISING vs NEON CITY FC\n\n**When:** Saturday, December 14th - 3:00 PM\n**Where:** Flame Stadium\n**Competition:** Cyber League - Matchweek 15\n\n## THE STORY\nA return to where it all began. Phoenix Rising were our first opponents this season, and that 2-1 win set the tone for our campaign.\n\nThey'll be out for revenge on home turf, but we arrive in confident mood after beating Orbital in our last away game.\n\n## FORM GUIDE\n**Neon City:** W-D-W-W-W (13 games: W9 D2 L2)\n**Phoenix Rising:** L-W-L-D-W (Currently 8th)\n\n## KEY BATTLE\nMarcus Thorn vs their center-back pairing. They struggled to contain him in September - can they do better this time?\n\n## PREDICTED XI\nVolkov; Sterling, Miller (C), Ironside, Torres; Silva, Modrić, De Bruyne, Chen; Bones, Thorn`,
    status: 'APPROVED',
    created_at: daysAgo(1),
  },
  {
    id: 'cnt-7',
    club_id: 'c-1',
    fixture_id: 'f-15',
    type: 'SOCIAL',
    platform: 'Twitter',
    body: `🔜 MATCHDAY INCOMING\n\n🆚 Phoenix Rising\n📍 Flame Stadium\n🗓️ Saturday 3PM\n📺 Stream on CyberLeague+\n\nTime to keep the momentum going 💜⚡\n\n#NCFC #PhxNCFC`,
    status: 'APPROVED',
    created_at: daysAgo(1),
  },
  {
    id: 'cnt-8',
    club_id: 'c-1',
    fixture_id: 'f-15',
    type: 'GRAPHIC_COPY',
    platform: 'Instagram',
    body: `GAMEDAY GRAPHIC\n\n🔥 PHOENIX RISING vs NEON CITY FC 🔥\n\nSATURDAY | 3PM | FLAME STADIUM\n\n"Back where it all started"\n\n#NCFC #AwayDays`,
    status: 'APPROVED',
    created_at: daysAgo(1),
  },
  
  // === DRAFT CONTENT (Needs Review) ===
  {
    id: 'cnt-9',
    club_id: 'c-1',
    fixture_id: 'f-14',
    type: 'REPORT',
    platform: 'Website',
    title: 'FRUSTRATION AT NOVA AS CHANCES GO BEGGING',
    body: `# NOVA DYNAMIC 0-0 NEON CITY\n\n[DRAFT - NEEDS FINAL REVIEW]\n\nNeon City dominated but couldn't find the breakthrough in a frustrating goalless draw at Nova Dynamic.\n\nDespite enjoying 68% possession and creating chances worth 2.8 xG, the Cyberpunks were unable to break down a resolute home defense that sat deep and defended in numbers.\n\nMarcus Thorn had a goal controversially ruled out for offside in the second half, with replays suggesting the decision was marginal at best.\n\n**Talking Point:** Are we becoming too predictable? Teams are sitting deep against us.\n\n**Next Up:** Phoenix Rising (A) - December 14th`,
    status: 'DRAFT',
    created_at: daysAgo(6),
  },
  {
    id: 'cnt-10',
    club_id: 'c-1',
    type: 'ARTICLE',
    platform: 'Website',
    title: 'THORN: "I\'m Just Getting Started"',
    body: `[INTERVIEW DRAFT]\n\nExclusive: We sat down with the league's top scorer to discuss his incredible season so far.\n\n**14 goals in 13 games - did you expect this?**\n"Honestly? I knew I was in good shape coming into the season, but 14 goals... that's beyond what I imagined. The service I'm getting from KDB and Luka makes my job easier."\n\n**The hat-trick at Orbital - take us through it:**\n"That was special. Their fans were giving me grief all game, so to score three... [laughs] Sometimes football writes its own scripts."\n\n**Golden Boot ambitions?**\n"One game at a time. But yeah, why not? If I stay fit and we keep creating chances, who knows what's possible."\n\n[NEEDS: Manager quote, stats graphic, image approvals]`,
    status: 'DRAFT',
    created_at: daysAgo(3),
  },
  {
    id: 'cnt-11',
    club_id: 'c-1',
    fixture_id: 'f-17',
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
    id: 's-1', 
    name: 'CyberDyne Systems', 
    sector: 'Technology', 
    tier: 'Platinum', 
    value: '£150,000', 
    contract_end: '2026-06-30', 
    status: 'Active', 
    logo_initials: 'CD' 
  },
  { 
    id: 's-2', 
    name: 'Orbital Energy Drinks', 
    sector: 'Beverage', 
    tier: 'Gold', 
    value: '£85,000', 
    contract_end: '2025-01-31', 
    status: 'Expiring', 
    logo_initials: 'OE' 
  },
  { 
    id: 's-3', 
    name: 'NeoTextile Apparel', 
    sector: 'Sportswear', 
    tier: 'Gold', 
    value: '£75,000', 
    contract_end: '2025-06-30', 
    status: 'Active', 
    logo_initials: 'NT' 
  },
  { 
    id: 's-4', 
    name: 'Quantum Motors', 
    sector: 'Automotive', 
    tier: 'Silver', 
    value: '£40,000', 
    contract_end: '2025-12-31', 
    status: 'Active', 
    logo_initials: 'QM' 
  },
  { 
    id: 's-5', 
    name: 'DataStream Analytics', 
    sector: 'Tech/Data', 
    tier: 'Silver', 
    value: '£35,000', 
    contract_end: '2025-03-31', 
    status: 'Negotiating', 
    logo_initials: 'DS' 
  },
  { 
    id: 's-6', 
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
// export const INITIAL_TASKS: AdminTask[] = [
  // HIGH PRIORITY
  { 
    id: 't-1', 
    title: 'Submit January Transfer Window Registration', 
    deadline: daysFromNow(20), 
    priority: 'High', 
    type: 'League', 
    status: 'Pending' 
  },
  { 
    id: 't-2', 
    title: 'Orbital Energy Contract Renewal Meeting', 
    deadline: daysFromNow(5), 
    priority: 'High', 
    type: 'Finance', 
    status: 'In Progress' 
  },
  { 
    id: 't-3', 
    title: 'Phoenix Rising Away Travel Arrangements', 
    deadline: daysFromNow(2), 
    priority: 'High', 
    type: 'Facilities', 
    status: 'In Progress' 
  },
  // MEDIUM PRIORITY  
  { 
    id: 't-4', 
    title: 'Stadium Safety Certificate Renewal', 
    deadline: daysFromNow(30), 
    priority: 'Medium', 
    type: 'Facilities', 
    status: 'Pending' 
  },
  { 
    id: 't-5', 
    title: 'Press Conference: Pre-Phoenix Rising', 
    deadline: daysFromNow(1), 
    priority: 'Medium', 
    type: 'Media', 
    status: 'Pending' 
  },
  { 
    id: 't-6', 
    title: 'Approve December Payroll', 
    deadline: daysFromNow(14), 
    priority: 'Medium', 
    type: 'Finance', 
    status: 'Pending' 
  },
  // LOW PRIORITY
  { 
    id: 't-7', 
    title: 'Youth Academy Annual Review', 
    deadline: daysFromNow(45), 
    priority: 'Low', 
    type: 'League', 
    status: 'Pending' 
  },
  // COMPLETED
  { 
    id: 't-8', 
    title: 'Submit November Financial Report', 
    deadline: daysAgo(5), 
    priority: 'High', 
    type: 'Finance', 
    status: 'Completed' 
  },
  { 
    id: 't-9', 
    title: 'Confirm Cup QF Date with League', 
    deadline: daysAgo(3), 
    priority: 'Medium', 
    type: 'League', 
    status: 'Completed' 
  },
  { 
    id: 't-10', 
    title: 'CyberDyne Q3 ROI Report Submitted', 
    deadline: daysAgo(10), 
    priority: 'Medium', 
    type: 'Finance', 
    status: 'Completed' 
  },
];
*/

// --- INBOX EMAILS - DEPRECATED ---
// Removed as part of pivot to Commercial & Media Operating System
// export const INITIAL_EMAILS: InboxEmail[] = [
  // UNREAD
  { 
    id: 'e-1', 
    from: 'Cyber League Operations', 
    from_email: 'fixtures@cyberleague.com',
    subject: 'URGENT: Cup Quarter-Final TV Schedule Confirmed', 
    preview: 'Your Galaxy Cup QF tie vs Quantum FC has been selected for live broadcast...', 
    body: `Dear Club Secretary,\n\nI am pleased to confirm that your Galaxy Cup Quarter-Final tie against Quantum FC has been selected for live television broadcast.\n\n**Confirmed Details:**\n- Date: Saturday, December 28th\n- Kick-off: 5:30 PM (moved from 3:00 PM)\n- Broadcaster: CyberLeague TV\n\nPlease update your ticketing and communications accordingly. The broadcast fee of £25,000 will be processed within 14 days.\n\nBest regards,\nJames Morrison\nHead of Fixtures, Cyber League`,
    received_at: daysAgo(0) + 'T09:30:00.000Z', 
    category: 'League', 
    is_read: false 
  },
  { 
    id: 'e-2', 
    from: 'Marcus Thorn Agent', 
    from_email: 'agent@stellartalent.com',
    subject: 'Re: Contract Extension Discussions', 
    preview: 'Following our initial conversation, Marcus is open to discussing...', 
    body: `Hi,\n\nFollowing our initial conversation last week, I wanted to follow up on the contract extension for Marcus.\n\nGiven his form this season (14 goals, top scorer), Marcus and I believe his current contract doesn't reflect his value to the club. We would like to open formal discussions about:\n\n1. Extended contract through 2028\n2. Revised salary reflecting his performances\n3. Performance-based bonuses\n\nMarcus remains committed to Neon City and wants to be part of the project long-term. Let's find a time to meet in the new year.\n\nBest,\nDavid Chen\nStellar Talent Management`,
    received_at: daysAgo(1) + 'T14:22:00.000Z', 
    category: 'League', 
    is_read: false 
  },
  { 
    id: 'e-3', 
    from: 'Orbital Energy - Sarah', 
    from_email: 's.johnson@orbitalenergy.com',
    subject: 'Contract Renewal: Meeting Request', 
    preview: 'As our current partnership approaches its end date, we would like to...', 
    body: `Dear Neon City FC,\n\nAs you know, our current sponsorship agreement expires on January 31st, 2025.\n\nOrbital Energy has greatly valued our partnership over the past two years. The brand visibility, particularly during your recent high-profile wins, has been excellent.\n\nWe would like to propose a meeting to discuss renewal terms. We are prepared to offer:\n- Increased annual value (£95,000, up from £85,000)\n- 3-year commitment\n- Additional match-day activation rights\n\nAre you available for a call this Friday?\n\nBest regards,\nSarah Johnson\nHead of Partnerships, Orbital Energy`,
    received_at: daysAgo(2) + 'T10:15:00.000Z', 
    category: 'Sponsor', 
    is_read: false 
  },
  
  // READ
  { 
    id: 'e-4', 
    from: 'CyberLeague TV', 
    from_email: 'media@cyberleaguetv.com',
    subject: 'Post-Match Interview Request: Thorn', 
    preview: 'Following another outstanding performance, we would love to feature Marcus...', 
    body: `Hi,\n\nFollowing Marcus Thorn's incredible season, CyberLeague TV would like to feature him in our "Star of the Season So Far" segment.\n\nWe're looking at:\n- 15-minute sit-down interview\n- Training ground filming (30 mins)\n- Air date: December 20th\n\nThis would be great exposure ahead of the busy Christmas period. Can you confirm availability?\n\nThanks,\nMedia Team\nCyberLeague TV`,
    received_at: daysAgo(3) + 'T16:45:00.000Z', 
    category: 'Media', 
    is_read: true 
  },
  { 
    id: 'e-5', 
    from: 'Neon Daily Sports', 
    from_email: 'sport@neondaily.com',
    subject: 'Thorn Interview Published - Great Response!', 
    preview: 'Just wanted to let you know the Thorn interview went live yesterday and...', 
    body: `Hi team,\n\nJust a quick note to say thank you for arranging the Marcus Thorn interview last week.\n\nThe article went live yesterday and has already hit 50,000 reads - our best performing sports piece this month! The fans loved the insight into his hat-trick at Orbital.\n\nWe'd love to do a follow-up piece if Neon City make the Cup semi-finals. Something to keep in mind!\n\nCheers,\nJim Peters\nSports Editor, Neon Daily`,
    received_at: daysAgo(4) + 'T11:30:00.000Z', 
    category: 'Media', 
    is_read: true 
  },
  { 
    id: 'e-6', 
    from: 'Fan - Michael R', 
    from_email: 'mike.r.cyberpunk@email.com',
    subject: 'AMAZING SEASON - Quick Question', 
    preview: 'Long time fan here, just wanted to say this season has been incredible...', 
    body: `To whoever reads this,\n\nI've been a Neon City supporter for 15 years, through the dark times in the lower leagues, and I just want to say THANK YOU for this season.\n\nThe way the team plays, the signings, Marcus Thorn... it's everything we dreamed of.\n\nQuick question - my son's birthday is in January and he's desperate for a signed Thorn shirt. Is there any way to arrange this? Happy to pay whatever it costs.\n\nUp The Neon City! ⚡\n\nMichael R\nSeason ticket holder - Block C, Row 12`,
    received_at: daysAgo(5) + 'T20:10:00.000Z', 
    category: 'Fan', 
    is_read: true 
  },
  { 
    id: 'e-7', 
    from: 'DataStream Analytics', 
    from_email: 'partnerships@datastream.io',
    subject: 'Partnership Proposal - Premium Analytics Suite', 
    preview: 'We believe our advanced analytics platform could provide significant value...', 
    body: `Dear Neon City FC,\n\nDataStream Analytics has been following your club's data-driven approach with great interest.\n\nAs your current Silver sponsor, we would like to propose an expanded partnership that includes:\n\n1. Premium analytics dashboard for coaching staff\n2. Real-time performance tracking integration\n3. Fan engagement analytics module\n4. Increased sponsorship value (£55,000, up from £35,000)\n\nWe believe this partnership would align perfectly with Neon City's "high-tech" brand identity.\n\nCould we arrange a demo session in the new year?\n\nBest regards,\nTom Anderson\nPartnership Director, DataStream Analytics`,
    received_at: daysAgo(6) + 'T09:00:00.000Z', 
    category: 'Sponsor', 
    is_read: true 
  },
  { 
    id: 'e-8', 
    from: 'Phoenix Rising FC', 
    from_email: 'ops@phoenixrising.com',
    subject: 'Away Allocation Confirmation - Dec 14', 
    preview: 'Please find attached the away supporter allocation details for...', 
    body: `Dear Neon City FC,\n\nPlease find confirmed details for your away allocation for the match on December 14th:\n\n**Allocation:** 2,400 tickets\n**Location:** East Stand, Blocks E1-E4\n**Access:** Gate 7\n**Coach parking:** Lot C (pre-registration required)\n\nPlease ensure all traveling supporters have valid ID. Pyrotechnics are strictly prohibited.\n\nLet us know if you need anything else.\n\nPhoenix Rising Operations`,
    received_at: daysAgo(7) + 'T14:00:00.000Z', 
    category: 'League', 
    is_read: true 
  },
];
*/
