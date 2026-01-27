/**
 * AI Action Types
 *
 * Defines the structure for actions that the AI Assistant can execute.
 */

// --- Action Types ---

export type ActionType =
  // Fixtures
  | 'CREATE_FIXTURE'
  | 'UPDATE_FIXTURE'
  | 'DELETE_FIXTURE'
  // Players
  | 'CREATE_PLAYER'
  | 'UPDATE_PLAYER'
  | 'DELETE_PLAYER'
  // Sponsors
  | 'CREATE_SPONSOR'
  | 'UPDATE_SPONSOR'
  | 'DELETE_SPONSOR'
  // Content
  | 'CREATE_CONTENT'
  | 'UPDATE_CONTENT';

export type ActionConfidence = 'high' | 'medium' | 'low';

// --- Action Data Types ---

export interface CreateFixtureData {
  opponent: string;
  kickoff_time: string; // ISO 8601 format
  venue: 'Home' | 'Away';
  competition?: string;
}

export interface UpdateFixtureData {
  fixture_id?: string;
  opponent?: string; // For lookup if fixture_id not provided
  kickoff_time?: string;
  result_home?: number;
  result_away?: number;
  scorers?: string[];
  man_of_the_match?: string;
  status?: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
}

export interface DeleteFixtureData {
  fixture_id?: string;
  opponent?: string; // For lookup if fixture_id not provided
  kickoff_time?: string;
}

export interface CreatePlayerData {
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  number: number;
  stats?: {
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
  };
  form?: number;
}

export interface UpdatePlayerData {
  player_id?: string;
  name?: string; // For lookup if player_id not provided
  updates: {
    number?: number;
    position?: 'GK' | 'DEF' | 'MID' | 'FWD';
    form?: number;
    stats?: {
      pace?: number;
      shooting?: number;
      passing?: number;
      dribbling?: number;
      defending?: number;
      physical?: number;
    };
  };
}

export interface DeletePlayerData {
  player_id?: string;
  name?: string; // For lookup if player_id not provided
}

export interface CreateSponsorData {
  name: string;
  sector: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  annual_value: number;
  contract_end_date?: string;
  logo_url?: string;
}

export interface UpdateSponsorData {
  sponsor_id?: string;
  name?: string; // For lookup if sponsor_id not provided
  updates: {
    tier?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
    annual_value?: number;
    contract_end_date?: string;
    sector?: string;
  };
}

export interface DeleteSponsorData {
  sponsor_id?: string;
  name?: string; // For lookup if sponsor_id not provided
}

export interface CreateContentData {
  type: 'PREVIEW' | 'REPORT' | 'SOCIAL' | 'GRAPHIC_COPY';
  body: string;
  fixture_id?: string;
  platform?: string;
}

export interface UpdateContentData {
  content_id: string;
  updates: {
    body?: string;
    status?: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
  };
}

// --- Union type for all action data ---

export type ActionData =
  | CreateFixtureData
  | UpdateFixtureData
  | DeleteFixtureData
  | CreatePlayerData
  | UpdatePlayerData
  | DeletePlayerData
  | CreateSponsorData
  | UpdateSponsorData
  | DeleteSponsorData
  | CreateContentData
  | UpdateContentData;

// --- AI Action Interface ---

export interface AIAction {
  type: ActionType;
  confidence: ActionConfidence;
  summary: string; // Human-readable summary for confirmation UI
  data: ActionData;
}

// --- AI Response Interface ---

export interface AIResponse {
  response: string; // Conversational text to display
  action?: AIAction; // Optional action to execute
}

// --- Action Result Interface ---

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// --- Helper type guards ---

export const isCreateFixtureData = (data: ActionData): data is CreateFixtureData => {
  return 'opponent' in data && 'kickoff_time' in data && 'venue' in data;
};

export const isUpdateFixtureData = (data: ActionData): data is UpdateFixtureData => {
  return 'result_home' in data || 'result_away' in data || ('fixture_id' in data && !('body' in data));
};

export const isCreatePlayerData = (data: ActionData): data is CreatePlayerData => {
  return 'name' in data && 'position' in data && 'number' in data && !('tier' in data);
};

export const isCreateSponsorData = (data: ActionData): data is CreateSponsorData => {
  return 'name' in data && 'tier' in data && 'annual_value' in data;
};
