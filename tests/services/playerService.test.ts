/**
 * Player Service Tests
 * 
 * Tests for playerService functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../../services/playerService';
import { supabase } from '../../services/supabaseClient';

// Mock Supabase client
vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
  TABLES: {
    PLAYERS: 'players',
  },
}));

describe('playerService', () => {
  const mockClubId = 'club-123';
  const mockPlayer = {
    id: 'player-123',
    club_id: mockClubId,
    name: 'Test Player',
    position: 'MID',
    number: 10,
    is_captain: false,
    stats: {
      pace: 80,
      shooting: 75,
      passing: 85,
      dribbling: 80,
      defending: 60,
      physical: 70,
    },
    form: 8.5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlayers', () => {
    it('should fetch players for a club', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockPlayer],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const players = await getPlayers(mockClubId);

      expect(players).toHaveLength(1);
      expect(players[0].name).toBe('Test Player');
      expect(supabase.from).toHaveBeenCalledWith('players');
    });

    it('should handle errors', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      await expect(getPlayers(mockClubId)).rejects.toThrow();
    });
  });

  describe('createPlayer', () => {
    it('should create a new player', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockPlayer,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as any);

      const newPlayer = await createPlayer(mockClubId, {
        name: 'Test Player',
        position: 'MID',
        number: 10,
        stats: mockPlayer.stats,
        form: 8.5,
      });

      expect(newPlayer.name).toBe('Test Player');
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('updatePlayer', () => {
    it('should update a player', async () => {
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockPlayer, name: 'Updated Player' },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      } as any);

      const updatedPlayer = await updatePlayer('player-123', {
        name: 'Updated Player',
      });

      expect(updatedPlayer.name).toBe('Updated Player');
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deletePlayer', () => {
    it('should delete a player', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
        eq: mockEq,
      } as any);

      await deletePlayer('player-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'player-123');
    });
  });
});

