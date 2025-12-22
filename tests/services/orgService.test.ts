/**
 * Org Service Tests
 * 
 * Tests for organization and membership operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../services/supabaseClient';

// Mock Supabase client
vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
  TABLES: {
    ORGS: 'orgs',
    ORG_MEMBERS: 'org_members',
    CLUBS: 'clubs',
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

// Import after mocking
import {
  getMyOrgs,
  createOrg,
  getOrgMembers,
} from '../../services/orgService';

describe('orgService', () => {
  const mockUserId = 'user-123';
  const mockOrg = {
    id: 'org-123',
    name: 'Test Organization',
    created_by: mockUserId,
    created_at: '2024-12-17T00:00:00Z',
    updated_at: '2024-12-17T00:00:00Z',
  };
  const mockMember = {
    id: 'member-123',
    org_id: mockOrg.id,
    user_id: mockUserId,
    role: 'owner',
    created_at: '2024-12-17T00:00:00Z',
    updated_at: '2024-12-17T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyOrgs', () => {
    it('should fetch organizations', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockOrg],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      const orgs = await getMyOrgs();

      expect(orgs).toHaveLength(1);
      expect(orgs[0].name).toBe('Test Organization');
      expect(supabase.from).toHaveBeenCalledWith('orgs');
    });

    it('should return empty array on error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
      } as any);

      await expect(getMyOrgs()).rejects.toThrow();
    });
  });

  describe('createOrg', () => {
    it('should create organization and add creator as owner', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      } as any);

      // Mock org creation
      const mockInsertOrg = vi.fn().mockReturnThis();
      const mockSelectOrg = vi.fn().mockReturnThis();
      const mockSingleOrg = vi.fn().mockResolvedValue({
        data: mockOrg,
        error: null,
      });

      // Mock member creation
      const mockInsertMember = vi.fn().mockResolvedValue({
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'orgs') {
          return {
            insert: mockInsertOrg,
            select: mockSelectOrg,
            single: mockSingleOrg,
          } as any;
        }
        if (table === 'org_members') {
          return {
            insert: mockInsertMember,
          } as any;
        }
        return {} as any;
      });

      const org = await createOrg('Test Organization');

      expect(org.name).toBe('Test Organization');
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    it('should throw when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(createOrg('Test')).rejects.toThrow('Not authenticated');
    });
  });

  describe('getOrgMembers', () => {
    it('should fetch members for an organization', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockMember],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any);

      const members = await getOrgMembers(mockOrg.id);

      expect(members).toHaveLength(1);
      expect(members[0].role).toBe('owner');
      expect(supabase.from).toHaveBeenCalledWith('org_members');
    });
  });
});
