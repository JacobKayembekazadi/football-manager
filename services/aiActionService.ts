/**
 * AI Action Service
 *
 * Executes actions requested by the AI Assistant.
 * Maps AI action types to their corresponding service functions.
 */

import {
  AIAction,
  ActionResult,
  CreateFixtureData,
  UpdateFixtureData,
  DeleteFixtureData,
  CreatePlayerData,
  UpdatePlayerData,
  DeletePlayerData,
  CreateSponsorData,
  UpdateSponsorData,
  DeleteSponsorData,
  CreateContentData,
  UpdateContentData,
} from '../types/aiActions';
import { createFixture, updateFixture, deleteFixture, getFixtures } from './fixtureService';
import { createPlayer, updatePlayer, deletePlayer, getPlayers } from './playerService';
import { createSponsor, updateSponsor, deleteSponsor, getSponsors } from './sponsorService';
import { createContentItem, updateContentItem } from './contentService';
import { Fixture, Player, Sponsor } from '../types';

// --- Helper functions to find entities by name ---

const findFixtureByOpponent = async (
  clubId: string,
  opponent: string,
  kickoffTime?: string
): Promise<Fixture | null> => {
  const fixtures = await getFixtures(clubId);
  const normalizedOpponent = opponent.toLowerCase().trim();

  // Find fixtures matching opponent
  const matches = fixtures.filter(f =>
    f.opponent.toLowerCase().includes(normalizedOpponent) ||
    normalizedOpponent.includes(f.opponent.toLowerCase())
  );

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // If multiple matches and kickoff time provided, find closest
  if (kickoffTime) {
    const targetTime = new Date(kickoffTime).getTime();
    return matches.reduce((closest, f) => {
      const fTime = new Date(f.kickoff_time).getTime();
      const closestTime = new Date(closest.kickoff_time).getTime();
      return Math.abs(fTime - targetTime) < Math.abs(closestTime - targetTime) ? f : closest;
    });
  }

  // Return the most recent/upcoming fixture
  const now = Date.now();
  return matches.reduce((best, f) => {
    const fTime = new Date(f.kickoff_time).getTime();
    const bestTime = new Date(best.kickoff_time).getTime();
    // Prefer upcoming fixtures, then most recent past
    if (fTime >= now && bestTime < now) return f;
    if (fTime < now && bestTime >= now) return best;
    return Math.abs(fTime - now) < Math.abs(bestTime - now) ? f : best;
  });
};

const findPlayerByName = async (
  clubId: string,
  name: string
): Promise<Player | null> => {
  const players = await getPlayers(clubId);
  const normalizedName = name.toLowerCase().trim();

  // Exact match first
  const exactMatch = players.find(p => p.name.toLowerCase() === normalizedName);
  if (exactMatch) return exactMatch;

  // Partial match
  return players.find(p =>
    p.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(p.name.toLowerCase())
  ) || null;
};

const findSponsorByName = async (
  clubId: string,
  name: string
): Promise<Sponsor | null> => {
  const sponsors = await getSponsors(clubId);
  const normalizedName = name.toLowerCase().trim();

  // Exact match first
  const exactMatch = sponsors.find(s => s.name.toLowerCase() === normalizedName);
  if (exactMatch) return exactMatch;

  // Partial match
  return sponsors.find(s =>
    s.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(s.name.toLowerCase())
  ) || null;
};

// --- Action Handlers ---

const handleCreateFixture = async (
  clubId: string,
  data: CreateFixtureData
): Promise<ActionResult> => {
  try {
    const fixture = await createFixture(clubId, {
      opponent: data.opponent,
      kickoff_time: data.kickoff_time,
      venue: data.venue,
      competition: data.competition || 'League Match',
      status: 'SCHEDULED',
      club_id: clubId,
    });

    const date = new Date(fixture.kickoff_time).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      success: true,
      message: `Created ${fixture.venue} fixture vs ${fixture.opponent} on ${date}`,
      data: fixture,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create fixture',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleUpdateFixture = async (
  clubId: string,
  data: UpdateFixtureData
): Promise<ActionResult> => {
  try {
    let fixtureId = data.fixture_id;

    // If no fixture_id, try to find by opponent
    if (!fixtureId && data.opponent) {
      const fixture = await findFixtureByOpponent(clubId, data.opponent, data.kickoff_time);
      if (!fixture) {
        return {
          success: false,
          message: `Could not find a fixture against ${data.opponent}`,
          error: 'Fixture not found',
        };
      }
      fixtureId = fixture.id;
    }

    if (!fixtureId) {
      return {
        success: false,
        message: 'No fixture specified',
        error: 'Missing fixture_id or opponent',
      };
    }

    const updates: any = {};
    if (data.result_home !== undefined) updates.result_home = data.result_home;
    if (data.result_away !== undefined) updates.result_away = data.result_away;
    if (data.scorers) updates.scorers = data.scorers;
    if (data.man_of_the_match) updates.man_of_the_match = data.man_of_the_match;
    if (data.status) updates.status = data.status;
    if (data.kickoff_time) updates.kickoff_time = data.kickoff_time;

    // Auto-set status to COMPLETED if result is being set
    if (data.result_home !== undefined && data.result_away !== undefined) {
      updates.status = 'COMPLETED';
    }

    const fixture = await updateFixture(fixtureId, updates);

    let message = `Updated fixture vs ${fixture.opponent}`;
    if (data.result_home !== undefined && data.result_away !== undefined) {
      message = `Recorded result: ${data.result_home}-${data.result_away} vs ${fixture.opponent}`;
    }

    return {
      success: true,
      message,
      data: fixture,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update fixture',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleDeleteFixture = async (
  clubId: string,
  data: DeleteFixtureData
): Promise<ActionResult> => {
  try {
    let fixtureId = data.fixture_id;

    if (!fixtureId && data.opponent) {
      const fixture = await findFixtureByOpponent(clubId, data.opponent, data.kickoff_time);
      if (!fixture) {
        return {
          success: false,
          message: `Could not find a fixture against ${data.opponent}`,
          error: 'Fixture not found',
        };
      }
      fixtureId = fixture.id;
    }

    if (!fixtureId) {
      return {
        success: false,
        message: 'No fixture specified',
        error: 'Missing fixture_id or opponent',
      };
    }

    await deleteFixture(fixtureId);

    return {
      success: true,
      message: `Deleted fixture${data.opponent ? ` vs ${data.opponent}` : ''}`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to delete fixture',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleCreatePlayer = async (
  clubId: string,
  data: CreatePlayerData
): Promise<ActionResult> => {
  try {
    const defaultStats = {
      pace: 50,
      shooting: 50,
      passing: 50,
      dribbling: 50,
      defending: 50,
      physical: 50,
      ...data.stats,
    };

    const player = await createPlayer(clubId, {
      name: data.name,
      position: data.position,
      number: data.number,
      stats: defaultStats,
      form: data.form || 5.0,
      is_captain: false,
    });

    return {
      success: true,
      message: `Added ${player.name} (#${player.number}, ${player.position}) to the squad`,
      data: player,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to add player',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleUpdatePlayer = async (
  clubId: string,
  data: UpdatePlayerData
): Promise<ActionResult> => {
  try {
    let playerId = data.player_id;

    if (!playerId && data.name) {
      const player = await findPlayerByName(clubId, data.name);
      if (!player) {
        return {
          success: false,
          message: `Could not find player "${data.name}"`,
          error: 'Player not found',
        };
      }
      playerId = player.id;
    }

    if (!playerId) {
      return {
        success: false,
        message: 'No player specified',
        error: 'Missing player_id or name',
      };
    }

    const player = await updatePlayer(playerId, data.updates);

    return {
      success: true,
      message: `Updated ${player.name}`,
      data: player,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update player',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleDeletePlayer = async (
  clubId: string,
  data: DeletePlayerData
): Promise<ActionResult> => {
  try {
    let playerId = data.player_id;
    let playerName = 'the player';

    if (!playerId && data.name) {
      const player = await findPlayerByName(clubId, data.name);
      if (!player) {
        return {
          success: false,
          message: `Could not find player "${data.name}"`,
          error: 'Player not found',
        };
      }
      playerId = player.id;
      playerName = player.name;
    }

    if (!playerId) {
      return {
        success: false,
        message: 'No player specified',
        error: 'Missing player_id or name',
      };
    }

    await deletePlayer(playerId);

    return {
      success: true,
      message: `Removed ${playerName} from the squad`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove player',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleCreateSponsor = async (
  clubId: string,
  data: CreateSponsorData
): Promise<ActionResult> => {
  try {
    // Generate logo initials from name
    const initials = data.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const sponsor = await createSponsor(clubId, {
      name: data.name,
      sector: data.sector,
      tier: data.tier,
      value: data.annual_value,
      contract_end: data.contract_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      logo_initials: initials,
    });

    return {
      success: true,
      message: `Added ${sponsor.name} as a ${sponsor.tier} tier sponsor (£${sponsor.value.toLocaleString()}/year)`,
      data: sponsor,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to add sponsor',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleUpdateSponsor = async (
  clubId: string,
  data: UpdateSponsorData
): Promise<ActionResult> => {
  try {
    let sponsorId = data.sponsor_id;

    if (!sponsorId && data.name) {
      const sponsor = await findSponsorByName(clubId, data.name);
      if (!sponsor) {
        return {
          success: false,
          message: `Could not find sponsor "${data.name}"`,
          error: 'Sponsor not found',
        };
      }
      sponsorId = sponsor.id;
    }

    if (!sponsorId) {
      return {
        success: false,
        message: 'No sponsor specified',
        error: 'Missing sponsor_id or name',
      };
    }

    const updates: any = {};
    if (data.updates.tier) updates.tier = data.updates.tier;
    if (data.updates.annual_value) updates.value = data.updates.annual_value;
    if (data.updates.contract_end_date) updates.contract_end = data.updates.contract_end_date;
    if (data.updates.sector) updates.sector = data.updates.sector;

    const sponsor = await updateSponsor(sponsorId, updates);

    return {
      success: true,
      message: `Updated ${sponsor.name} sponsorship`,
      data: sponsor,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update sponsor',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleDeleteSponsor = async (
  clubId: string,
  data: DeleteSponsorData
): Promise<ActionResult> => {
  try {
    let sponsorId = data.sponsor_id;
    let sponsorName = 'the sponsor';

    if (!sponsorId && data.name) {
      const sponsor = await findSponsorByName(clubId, data.name);
      if (!sponsor) {
        return {
          success: false,
          message: `Could not find sponsor "${data.name}"`,
          error: 'Sponsor not found',
        };
      }
      sponsorId = sponsor.id;
      sponsorName = sponsor.name;
    }

    if (!sponsorId) {
      return {
        success: false,
        message: 'No sponsor specified',
        error: 'Missing sponsor_id or name',
      };
    }

    await deleteSponsor(sponsorId);

    return {
      success: true,
      message: `Removed ${sponsorName} sponsorship`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove sponsor',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleCreateContent = async (
  clubId: string,
  data: CreateContentData
): Promise<ActionResult> => {
  try {
    const content = await createContentItem(clubId, {
      type: data.type,
      body: data.body,
      fixture_id: data.fixture_id,
      platform: data.platform || 'Website',
      status: 'DRAFT',
    });

    return {
      success: true,
      message: `Created ${data.type.toLowerCase()} content draft`,
      data: content,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create content',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const handleUpdateContent = async (
  _clubId: string,
  data: UpdateContentData
): Promise<ActionResult> => {
  try {
    const content = await updateContentItem(data.content_id, data.updates);

    let message = 'Updated content';
    if (data.updates.status === 'APPROVED') message = 'Approved content';
    if (data.updates.status === 'PUBLISHED') message = 'Published content';

    return {
      success: true,
      message,
      data: content,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to update content',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// --- Main Execute Function ---

export const executeAction = async (
  clubId: string,
  action: AIAction
): Promise<ActionResult> => {
  console.log('[AI Action] Executing:', action.type, action.data);

  try {
    switch (action.type) {
      // Fixtures
      case 'CREATE_FIXTURE':
        return await handleCreateFixture(clubId, action.data as CreateFixtureData);
      case 'UPDATE_FIXTURE':
        return await handleUpdateFixture(clubId, action.data as UpdateFixtureData);
      case 'DELETE_FIXTURE':
        return await handleDeleteFixture(clubId, action.data as DeleteFixtureData);

      // Players
      case 'CREATE_PLAYER':
        return await handleCreatePlayer(clubId, action.data as CreatePlayerData);
      case 'UPDATE_PLAYER':
        return await handleUpdatePlayer(clubId, action.data as UpdatePlayerData);
      case 'DELETE_PLAYER':
        return await handleDeletePlayer(clubId, action.data as DeletePlayerData);

      // Sponsors
      case 'CREATE_SPONSOR':
        return await handleCreateSponsor(clubId, action.data as CreateSponsorData);
      case 'UPDATE_SPONSOR':
        return await handleUpdateSponsor(clubId, action.data as UpdateSponsorData);
      case 'DELETE_SPONSOR':
        return await handleDeleteSponsor(clubId, action.data as DeleteSponsorData);

      // Content
      case 'CREATE_CONTENT':
        return await handleCreateContent(clubId, action.data as CreateContentData);
      case 'UPDATE_CONTENT':
        return await handleUpdateContent(clubId, action.data as UpdateContentData);

      default:
        return {
          success: false,
          message: 'Unknown action type',
          error: `Unhandled action: ${action.type}`,
        };
    }
  } catch (error) {
    console.error('[AI Action] Error:', error);
    return {
      success: false,
      message: 'Action failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
