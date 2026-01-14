/**
 * AI Key Resolver
 *
 * Resolves which Gemini API key to use based on precedence:
 * 1. Club BYOK (if configured)
 * 2. Org BYOK (if configured)
 * 3. Platform managed key (fallback)
 */

import { decryptSecret } from './encryption.ts';

interface AIKeyResult {
  key: string;
  source: 'club_byok' | 'org_byok' | 'platform_managed';
  orgId: string;
}

/**
 * Resolve the Gemini API key for a given club
 *
 * @param supabase - Supabase client with user's auth context
 * @param clubId - The club ID to resolve key for
 * @returns The API key, its source, and the org ID
 */
export async function resolveGeminiKey(
  supabase: any,
  clubId: string
): Promise<AIKeyResult> {
  // Determine orgId from club (RLS-protected)
  const { data: club, error: clubErr } = await supabase
    .from('clubs')
    .select('id, org_id')
    .eq('id', clubId)
    .single();

  if (clubErr || !club) {
    throw new Error('Invalid club or access denied');
  }

  const orgId = club.org_id as string;

  // Check for club-level BYOK override
  const { data: clubSettings } = await supabase
    .from('club_ai_settings')
    .select('mode, byok_key_ciphertext, byok_key_iv')
    .eq('club_id', clubId)
    .maybeSingle();

  if (
    clubSettings &&
    clubSettings.mode === 'byok' &&
    clubSettings.byok_key_ciphertext &&
    clubSettings.byok_key_iv
  ) {
    const key = await decryptSecret(
      clubSettings.byok_key_ciphertext,
      clubSettings.byok_key_iv
    );
    return { key, source: 'club_byok', orgId };
  }

  // Check for org-level BYOK
  const { data: orgSettings } = await supabase
    .from('org_ai_settings')
    .select('mode, byok_key_ciphertext, byok_key_iv')
    .eq('org_id', orgId)
    .maybeSingle();

  if (
    orgSettings &&
    (orgSettings.mode === 'byok' || orgSettings.mode === 'hybrid') &&
    orgSettings.byok_key_ciphertext &&
    orgSettings.byok_key_iv
  ) {
    const key = await decryptSecret(
      orgSettings.byok_key_ciphertext,
      orgSettings.byok_key_iv
    );
    return { key, source: 'org_byok', orgId };
  }

  // Fall back to platform managed key
  const platformKey = Deno.env.get('GEMINI_API_KEY');
  if (!platformKey) {
    throw new Error('Missing GEMINI_API_KEY (platform managed)');
  }

  return { key: platformKey, source: 'platform_managed', orgId };
}

/**
 * Call Gemini API to generate text content
 *
 * @param apiKey - Gemini API key
 * @param model - Model to use (e.g., 'gemini-2.5-flash')
 * @param prompt - Text prompt
 * @returns Generated text content
 */
export async function geminiGenerateText(
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p?.text)
      .filter(Boolean)
      .join('') ??
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    '';

  return text || 'Failed to generate content.';
}
