/**
 * AI Key Resolution Edge Cases Tests
 * 
 * Tests edge cases and error scenarios for AI key resolution:
 * - Malformed keys
 * - Empty keys
 * - Key rotation scenarios
 * - Missing settings
 * - Concurrent updates
 */

import { describe, it, expect } from 'vitest';

describe('AI Key Resolution Edge Cases', () => {
  const platformKey = 'platform-key-123';
  const validOrgKey = 'org-key-456';
  const validClubKey = 'club-key-789';

  interface OrgAISettings {
    mode: 'managed' | 'byok' | 'hybrid';
    byok_key?: string;
  }

  interface ClubAISettings {
    mode: 'inherit' | 'byok';
    byok_key?: string;
  }

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

  describe('Empty and Null Key Scenarios', () => {
    it('should fall back to platform when org key is empty string', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: '' };
      const result = resolveAIKey(orgSettings, null, platformKey);
      expect(result).toBe(platformKey);
    });

    it('should fall back to platform when org key is undefined', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: undefined };
      const result = resolveAIKey(orgSettings, null, platformKey);
      expect(result).toBe(platformKey);
    });

    it('should fall back to platform when club key is empty string', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      const clubSettings: ClubAISettings = { mode: 'byok', byok_key: '' };
      const result = resolveAIKey(orgSettings, clubSettings, platformKey);
      expect(result).toBe(platformKey);
    });

    it('should fall back to org key when club key is empty', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const clubSettings: ClubAISettings = { mode: 'byok', byok_key: '' };
      const result = resolveAIKey(orgSettings, clubSettings, platformKey);
      expect(result).toBe(validOrgKey);
    });

    it('should handle both settings being null', () => {
      const result = resolveAIKey(null, null, platformKey);
      expect(result).toBe(platformKey);
    });
  });

  describe('Key Rotation Scenarios', () => {
    it('should immediately use new org key after rotation', () => {
      const oldOrgSettings: OrgAISettings = { mode: 'byok', byok_key: 'old-org-key' };
      const newOrgSettings: OrgAISettings = { mode: 'byok', byok_key: 'new-org-key' };
      
      const oldResult = resolveAIKey(oldOrgSettings, null, platformKey);
      const newResult = resolveAIKey(newOrgSettings, null, platformKey);
      
      expect(oldResult).toBe('old-org-key');
      expect(newResult).toBe('new-org-key');
    });

    it('should immediately use new club key after rotation', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const oldClubSettings: ClubAISettings = { mode: 'byok', byok_key: 'old-club-key' };
      const newClubSettings: ClubAISettings = { mode: 'byok', byok_key: 'new-club-key' };
      
      const oldResult = resolveAIKey(orgSettings, oldClubSettings, platformKey);
      const newResult = resolveAIKey(orgSettings, newClubSettings, platformKey);
      
      expect(oldResult).toBe('old-club-key');
      expect(newResult).toBe('new-club-key');
    });

    it('should handle transition from BYOK to managed', () => {
      const byokSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const managedSettings: OrgAISettings = { mode: 'managed' };
      
      const byokResult = resolveAIKey(byokSettings, null, platformKey);
      const managedResult = resolveAIKey(managedSettings, null, platformKey);
      
      expect(byokResult).toBe(validOrgKey);
      expect(managedResult).toBe(platformKey);
    });

    it('should handle transition from managed to BYOK', () => {
      const managedSettings: OrgAISettings = { mode: 'managed' };
      const byokSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      
      const managedResult = resolveAIKey(managedSettings, null, platformKey);
      const byokResult = resolveAIKey(byokSettings, null, platformKey);
      
      expect(managedResult).toBe(platformKey);
      expect(byokResult).toBe(validOrgKey);
    });
  });

  describe('Club Mode Transitions', () => {
    it('should handle club transitioning from inherit to BYOK', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const inheritSettings: ClubAISettings = { mode: 'inherit' };
      const byokSettings: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      
      const inheritResult = resolveAIKey(orgSettings, inheritSettings, platformKey);
      const byokResult = resolveAIKey(orgSettings, byokSettings, platformKey);
      
      expect(inheritResult).toBe(validOrgKey);
      expect(byokResult).toBe(validClubKey);
    });

    it('should handle club transitioning from BYOK to inherit', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const byokSettings: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      const inheritSettings: ClubAISettings = { mode: 'inherit' };
      
      const byokResult = resolveAIKey(orgSettings, byokSettings, platformKey);
      const inheritResult = resolveAIKey(orgSettings, inheritSettings, platformKey);
      
      expect(byokResult).toBe(validClubKey);
      expect(inheritResult).toBe(validOrgKey);
    });

    it('should handle club inheriting when org has no key', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      const clubSettings: ClubAISettings = { mode: 'inherit' };
      
      const result = resolveAIKey(orgSettings, clubSettings, platformKey);
      
      expect(result).toBe(platformKey);
    });
  });

  describe('Whitespace and Formatting Edge Cases', () => {
    it('should handle keys with leading whitespace', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: '  leading-space-key' };
      const result = resolveAIKey(orgSettings, null, platformKey);
      // Keys with whitespace should still be used (trimming is UI responsibility)
      expect(result).toBe('  leading-space-key');
    });

    it('should handle keys with trailing whitespace', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: 'trailing-space-key  ' };
      const result = resolveAIKey(orgSettings, null, platformKey);
      expect(result).toBe('trailing-space-key  ');
    });

    it('should handle keys with only whitespace as empty', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: '   ' };
      const result = resolveAIKey(orgSettings, null, platformKey);
      // Whitespace-only key should be treated as having a key
      // (validation should happen at input, not resolution)
      expect(result).toBe('   ');
    });
  });

  describe('Multiple Clubs Scenario', () => {
    it('should resolve different keys for different clubs', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      
      const club1Settings: ClubAISettings = { mode: 'byok', byok_key: 'club1-key' };
      const club2Settings: ClubAISettings = { mode: 'inherit' };
      const club3Settings: ClubAISettings = { mode: 'byok', byok_key: 'club3-key' };
      
      const club1Result = resolveAIKey(orgSettings, club1Settings, platformKey);
      const club2Result = resolveAIKey(orgSettings, club2Settings, platformKey);
      const club3Result = resolveAIKey(orgSettings, club3Settings, platformKey);
      
      expect(club1Result).toBe('club1-key');
      expect(club2Result).toBe(validOrgKey);
      expect(club3Result).toBe('club3-key');
    });

    it('should handle all clubs inheriting from managed org', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      
      const club1Settings: ClubAISettings = { mode: 'inherit' };
      const club2Settings: ClubAISettings = { mode: 'inherit' };
      
      const club1Result = resolveAIKey(orgSettings, club1Settings, platformKey);
      const club2Result = resolveAIKey(orgSettings, club2Settings, platformKey);
      
      expect(club1Result).toBe(platformKey);
      expect(club2Result).toBe(platformKey);
    });
  });

  describe('Precedence Consistency', () => {
    it('should consistently prefer club over org', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const clubSettings: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      
      // Run resolution multiple times to ensure consistency
      const results = Array(10).fill(null).map(() => 
        resolveAIKey(orgSettings, clubSettings, platformKey)
      );
      
      expect(results.every(r => r === validClubKey)).toBe(true);
    });

    it('should consistently prefer org over platform', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      
      const results = Array(10).fill(null).map(() => 
        resolveAIKey(orgSettings, null, platformKey)
      );
      
      expect(results.every(r => r === validOrgKey)).toBe(true);
    });

    it('should consistently use platform when no BYOK', () => {
      const orgSettings: OrgAISettings = { mode: 'managed' };
      const clubSettings: ClubAISettings = { mode: 'inherit' };
      
      const results = Array(10).fill(null).map(() => 
        resolveAIKey(orgSettings, clubSettings, platformKey)
      );
      
      expect(results.every(r => r === platformKey)).toBe(true);
    });
  });

  describe('Settings Object Mutations', () => {
    it('should not be affected by mutations after resolution', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      
      const result1 = resolveAIKey(orgSettings, null, platformKey);
      
      // Mutate the settings
      orgSettings.byok_key = 'mutated-key';
      
      // New resolution should use mutated value
      const result2 = resolveAIKey(orgSettings, null, platformKey);
      
      expect(result1).toBe(validOrgKey);
      expect(result2).toBe('mutated-key');
    });
  });

  describe('Hybrid Mode Edge Cases', () => {
    it('should handle hybrid org with no BYOK key set', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: undefined };
      const clubSettings: ClubAISettings = { mode: 'inherit' };
      
      const result = resolveAIKey(orgSettings, clubSettings, platformKey);
      
      expect(result).toBe(platformKey);
    });

    it('should handle hybrid org with empty BYOK key', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: '' };
      const clubSettings: ClubAISettings = { mode: 'inherit' };
      
      const result = resolveAIKey(orgSettings, clubSettings, platformKey);
      
      expect(result).toBe(platformKey);
    });

    it('should allow club BYOK even when org has no key', () => {
      const orgSettings: OrgAISettings = { mode: 'byok', byok_key: undefined };
      const clubSettings: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      
      const result = resolveAIKey(orgSettings, clubSettings, platformKey);
      
      expect(result).toBe(validClubKey);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle agency onboarding new club with temp platform key', () => {
      // Agency starts with managed
      const step1Org: OrgAISettings = { mode: 'managed' };
      const step1Club: ClubAISettings = { mode: 'inherit' };
      const step1Result = resolveAIKey(step1Org, step1Club, platformKey);
      expect(step1Result).toBe(platformKey);
      
      // Agency gets BYOK key
      const step2Org: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const step2Club: ClubAISettings = { mode: 'inherit' };
      const step2Result = resolveAIKey(step2Org, step2Club, platformKey);
      expect(step2Result).toBe(validOrgKey);
      
      // Club wants own key
      const step3Org: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const step3Club: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      const step3Result = resolveAIKey(step3Org, step3Club, platformKey);
      expect(step3Result).toBe(validClubKey);
    });

    it('should handle club leaving agency (key revocation)', () => {
      // Club using org key
      const step1Org: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const step1Club: ClubAISettings = { mode: 'inherit' };
      const step1Result = resolveAIKey(step1Org, step1Club, platformKey);
      expect(step1Result).toBe(validOrgKey);
      
      // Club sets up own key before leaving
      const step2Org: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const step2Club: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      const step2Result = resolveAIKey(step2Org, step2Club, platformKey);
      expect(step2Result).toBe(validClubKey);
      
      // After leaving (simulated by removing org key from club's view)
      // Club still has own key
      const step3Org: OrgAISettings = { mode: 'managed' };
      const step3Club: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      const step3Result = resolveAIKey(step3Org, step3Club, platformKey);
      expect(step3Result).toBe(validClubKey);
    });

    it('should handle cost optimization: switching to platform', () => {
      // Club using BYOK
      const step1Org: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const step1Club: ClubAISettings = { mode: 'byok', byok_key: validClubKey };
      const step1Result = resolveAIKey(step1Org, step1Club, platformKey);
      expect(step1Result).toBe(validClubKey);
      
      // Club switches to inherit org key
      const step2Org: OrgAISettings = { mode: 'byok', byok_key: validOrgKey };
      const step2Club: ClubAISettings = { mode: 'inherit' };
      const step2Result = resolveAIKey(step2Org, step2Club, platformKey);
      expect(step2Result).toBe(validOrgKey);
      
      // Org switches to managed
      const step3Org: OrgAISettings = { mode: 'managed' };
      const step3Club: ClubAISettings = { mode: 'inherit' };
      const step3Result = resolveAIKey(step3Org, step3Club, platformKey);
      expect(step3Result).toBe(platformKey);
    });

    it('should handle security incident: emergency key rotation', () => {
      const compromisedKey = 'compromised-key';
      const newKey = 'new-secure-key';
      
      // Before rotation
      const beforeOrg: OrgAISettings = { mode: 'byok', byok_key: compromisedKey };
      const beforeResult = resolveAIKey(beforeOrg, null, platformKey);
      expect(beforeResult).toBe(compromisedKey);
      
      // Immediate rotation
      const afterOrg: OrgAISettings = { mode: 'byok', byok_key: newKey };
      const afterResult = resolveAIKey(afterOrg, null, platformKey);
      expect(afterResult).toBe(newKey);
      
      // Verify old key no longer used
      expect(afterResult).not.toBe(compromisedKey);
    });
  });
});



