/**
 * AI Key Precedence Tests
 * 
 * Tests to verify the AI key resolution precedence:
 * Club BYOK → Org BYOK → Platform Managed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock for testing precedence logic
interface AISettings {
  mode: 'managed' | 'byok' | 'inherit';
  byok_key?: string;
}

interface OrgAISettings extends AISettings {
  mode: 'managed' | 'byok' | 'hybrid';
}

interface ClubAISettings extends AISettings {
  mode: 'inherit' | 'byok';
}

// Simulated key resolution function (mirrors Edge Function logic)
function resolveAIKey(
  orgSettings: OrgAISettings | null,
  clubSettings: ClubAISettings | null,
  platformKey: string
): string {
  // Priority 1: Club BYOK
  if (clubSettings?.mode === 'byok' && clubSettings.byok_key) {
    return clubSettings.byok_key;
  }
  
  // Priority 2: Org BYOK
  if (orgSettings?.mode === 'byok' && orgSettings.byok_key) {
    return orgSettings.byok_key;
  }
  
  // Priority 3: Platform managed
  return platformKey;
}

describe('AI Key Precedence', () => {
  const platformKey = 'platform-key-123';
  const orgByokKey = 'org-byok-key-456';
  const clubByokKey = 'club-byok-key-789';

  describe('resolveAIKey', () => {
    it('should use club BYOK key when available (highest priority)', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: orgByokKey };
      const clubSettings: ClubAISettings = { mode: 'byok', byok_key: clubByokKey };

      const resolvedKey = resolveAIKey(orgSettings, clubSettings, platformKey);

      expect(resolvedKey).toBe(clubByokKey);
    });

    it('should fall back to org BYOK when club inherits', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: orgByokKey };
      const clubSettings: ClubAISettings = { mode: 'inherit' };

      const resolvedKey = resolveAIKey(orgSettings, clubSettings, platformKey);

      expect(resolvedKey).toBe(orgByokKey);
    });

    it('should fall back to org BYOK when no club settings', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: orgByokKey };

      const resolvedKey = resolveAIKey(orgSettings, null, platformKey);

      expect(resolvedKey).toBe(orgByokKey);
    });

    it('should use platform key when org is managed', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      const clubSettings: ClubAISettings = { mode: 'inherit' };

      const resolvedKey = resolveAIKey(orgSettings, clubSettings, platformKey);

      expect(resolvedKey).toBe(platformKey);
    });

    it('should use platform key when no settings exist', () => {
      const resolvedKey = resolveAIKey(null, null, platformKey);

      expect(resolvedKey).toBe(platformKey);
    });

    it('should use platform key when org BYOK has no key set', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: undefined };

      const resolvedKey = resolveAIKey(orgSettings, null, platformKey);

      expect(resolvedKey).toBe(platformKey);
    });

    it('should use club BYOK even when org is managed', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      const clubSettings: ClubAISettings = { mode: 'byok', byok_key: clubByokKey };

      const resolvedKey = resolveAIKey(orgSettings, clubSettings, platformKey);

      expect(resolvedKey).toBe(clubByokKey);
    });
  });

  describe('Business Logic Scenarios', () => {
    it('agency with managed AI - all clubs use platform', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      const club1Settings: ClubAISettings = { mode: 'inherit' };
      const club2Settings: ClubAISettings = { mode: 'inherit' };

      expect(resolveAIKey(orgSettings, club1Settings, platformKey)).toBe(platformKey);
      expect(resolveAIKey(orgSettings, club2Settings, platformKey)).toBe(platformKey);
    });

    it('agency with org BYOK - all clubs use org key', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: orgByokKey };
      const club1Settings: ClubAISettings = { mode: 'inherit' };
      const club2Settings: ClubAISettings = { mode: 'inherit' };

      expect(resolveAIKey(orgSettings, club1Settings, platformKey)).toBe(orgByokKey);
      expect(resolveAIKey(orgSettings, club2Settings, platformKey)).toBe(orgByokKey);
    });

    it('agency with hybrid - some clubs override', () => {
      // In hybrid mode, org still needs byok mode set for inheritance
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: orgByokKey };
      const club1Settings: ClubAISettings = { mode: 'inherit' }; // Uses org BYOK
      const club2Settings: ClubAISettings = { mode: 'byok', byok_key: clubByokKey }; // Uses own key

      expect(resolveAIKey(orgSettings, club1Settings, platformKey)).toBe(orgByokKey);
      expect(resolveAIKey(orgSettings, club2Settings, platformKey)).toBe(clubByokKey);
    });

    it('single club admin with managed AI', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      const clubSettings: ClubAISettings = { mode: 'inherit' };

      expect(resolveAIKey(orgSettings, clubSettings, platformKey)).toBe(platformKey);
    });

    it('single club admin with BYOK', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: orgByokKey };
      const clubSettings: ClubAISettings = { mode: 'inherit' };

      expect(resolveAIKey(orgSettings, clubSettings, platformKey)).toBe(orgByokKey);
    });
  });
});

describe('Email Inbox Precedence', () => {
  // Mock for testing precedence logic
  interface EmailConnection {
    id: string;
    org_id: string;
    club_id: string | null;
    is_master: boolean;
    visibility: 'private' | 'shared';
  }

  function findMasterConnection(
    connections: EmailConnection[],
    orgId: string,
    clubId: string
  ): EmailConnection | null {
    // Priority 1: Club master
    const clubMaster = connections.find(
      c => c.org_id === orgId && c.club_id === clubId && c.is_master && c.visibility === 'shared'
    );
    if (clubMaster) return clubMaster;

    // Priority 2: Org master
    const orgMaster = connections.find(
      c => c.org_id === orgId && c.club_id === null && c.is_master && c.visibility === 'shared'
    );
    return orgMaster || null;
  }

  const orgId = 'org-123';
  const clubId = 'club-456';

  it('should prefer club master over org master', () => {
    const connections: EmailConnection[] = [
      { id: '1', org_id: orgId, club_id: null, is_master: true, visibility: 'shared' },
      { id: '2', org_id: orgId, club_id: clubId, is_master: true, visibility: 'shared' },
    ];

    const master = findMasterConnection(connections, orgId, clubId);

    expect(master?.id).toBe('2'); // Club master
    expect(master?.club_id).toBe(clubId);
  });

  it('should fall back to org master when no club master', () => {
    const connections: EmailConnection[] = [
      { id: '1', org_id: orgId, club_id: null, is_master: true, visibility: 'shared' },
    ];

    const master = findMasterConnection(connections, orgId, clubId);

    expect(master?.id).toBe('1'); // Org master
    expect(master?.club_id).toBeNull();
  });

  it('should return null when no master exists', () => {
    const connections: EmailConnection[] = [
      { id: '1', org_id: orgId, club_id: clubId, is_master: false, visibility: 'private' },
    ];

    const master = findMasterConnection(connections, orgId, clubId);

    expect(master).toBeNull();
  });

  it('should not use private connections as master', () => {
    const connections: EmailConnection[] = [
      { id: '1', org_id: orgId, club_id: clubId, is_master: true, visibility: 'private' },
    ];

    const master = findMasterConnection(connections, orgId, clubId);

    expect(master).toBeNull();
  });
});

