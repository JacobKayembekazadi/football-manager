/**
 * UUID Utilities
 *
 * Generates deterministic UUIDs for demo/mock data to ensure
 * compatibility with Supabase's UUID column types.
 */

/**
 * Generate a deterministic UUID v4-like string from a seed
 * This creates consistent IDs for mock data that are valid UUID format
 *
 * @param prefix - Category prefix (e.g., 'player', 'fixture', 'club')
 * @param index - Unique index within the category
 * @returns A valid UUID-formatted string
 */
export function generateDemoUUID(prefix: string, index: number): string {
  // Create a deterministic but valid UUID format
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is one of 8, 9, a, or b

  // Use prefix hash and index to generate deterministic values
  const prefixHash = hashString(prefix);
  const combined = prefixHash + index;

  // Generate each section deterministically
  const section1 = (combined * 2654435761) >>> 0; // Knuth's multiplicative hash
  const section2 = (combined * 2246822519) >>> 0;
  const section3 = (combined * 3266489917) >>> 0;
  const section4 = (combined * 668265263) >>> 0;

  // Format as UUID with version 4 and variant bits
  const hex1 = section1.toString(16).padStart(8, '0').slice(0, 8);
  const hex2 = section2.toString(16).padStart(4, '0').slice(0, 4);
  const hex3 = '4' + section3.toString(16).padStart(3, '0').slice(0, 3); // Version 4
  const hex4 = (8 + (section4 % 4)).toString(16) + section4.toString(16).padStart(3, '0').slice(0, 3); // Variant
  const hex5 = ((section1 ^ section2 ^ section3 ^ section4) >>> 0).toString(16).padStart(12, '0').slice(0, 12);

  return `${hex1}-${hex2}-${hex3}-${hex4}-${hex5}`;
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Pre-generated demo UUIDs for common entities
 * These are deterministic and will always be the same
 */
export const DEMO_UUIDS = {
  // Club
  club: generateDemoUUID('club', 1),

  // Players (18 players)
  players: {
    'p-1': generateDemoUUID('player', 1),
    'p-2': generateDemoUUID('player', 2),
    'p-3': generateDemoUUID('player', 3),
    'p-4': generateDemoUUID('player', 4),
    'p-5': generateDemoUUID('player', 5),
    'p-6': generateDemoUUID('player', 6),
    'p-7': generateDemoUUID('player', 7),
    'p-8': generateDemoUUID('player', 8),
    'p-9': generateDemoUUID('player', 9),
    'p-11': generateDemoUUID('player', 11),
    'p-12': generateDemoUUID('player', 12),
    'p-13': generateDemoUUID('player', 13),
    'p-14': generateDemoUUID('player', 14),
    'p-15': generateDemoUUID('player', 15),
    'p-16': generateDemoUUID('player', 16),
    'p-17': generateDemoUUID('player', 17),
    'p-18': generateDemoUUID('player', 18),
  },

  // Fixtures (15 fixtures)
  fixtures: {
    'f-1': generateDemoUUID('fixture', 1),
    'f-2': generateDemoUUID('fixture', 2),
    'f-3': generateDemoUUID('fixture', 3),
    'f-4': generateDemoUUID('fixture', 4),
    'f-5': generateDemoUUID('fixture', 5),
    'f-6': generateDemoUUID('fixture', 6),
    'f-7': generateDemoUUID('fixture', 7),
    'f-8': generateDemoUUID('fixture', 8),
    'f-9': generateDemoUUID('fixture', 9),
    'f-10': generateDemoUUID('fixture', 10),
    'f-11': generateDemoUUID('fixture', 11),
    'f-12': generateDemoUUID('fixture', 12),
    'f-13': generateDemoUUID('fixture', 13),
    'f-14': generateDemoUUID('fixture', 14),
    'f-15': generateDemoUUID('fixture', 15),
  },

  // Content items
  content: {
    'c-1': generateDemoUUID('content', 1),
    'c-2': generateDemoUUID('content', 2),
    'c-3': generateDemoUUID('content', 3),
    'c-4': generateDemoUUID('content', 4),
    'c-5': generateDemoUUID('content', 5),
    'c-6': generateDemoUUID('content', 6),
    'c-7': generateDemoUUID('content', 7),
    'c-8': generateDemoUUID('content', 8),
  },

  // Sponsors
  sponsors: {
    's-1': generateDemoUUID('sponsor', 1),
    's-2': generateDemoUUID('sponsor', 2),
    's-3': generateDemoUUID('sponsor', 3),
    's-4': generateDemoUUID('sponsor', 4),
    's-5': generateDemoUUID('sponsor', 5),
  },
} as const;

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Get a demo UUID or return the original if already valid
 */
export function ensureValidUUID(id: string, category: 'player' | 'fixture' | 'content' | 'sponsor' | 'club'): string {
  if (isValidUUID(id)) {
    return id;
  }

  // Map old-style IDs to demo UUIDs
  switch (category) {
    case 'club':
      return DEMO_UUIDS.club;
    case 'player':
      return DEMO_UUIDS.players[id as keyof typeof DEMO_UUIDS.players] || generateDemoUUID('player', hashString(id));
    case 'fixture':
      return DEMO_UUIDS.fixtures[id as keyof typeof DEMO_UUIDS.fixtures] || generateDemoUUID('fixture', hashString(id));
    case 'content':
      return DEMO_UUIDS.content[id as keyof typeof DEMO_UUIDS.content] || generateDemoUUID('content', hashString(id));
    case 'sponsor':
      return DEMO_UUIDS.sponsors[id as keyof typeof DEMO_UUIDS.sponsors] || generateDemoUUID('sponsor', hashString(id));
    default:
      return generateDemoUUID(category, hashString(id));
  }
}
