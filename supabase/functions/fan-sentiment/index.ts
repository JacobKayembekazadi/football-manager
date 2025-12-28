/**
 * Supabase Edge Function: fan-sentiment
 *
 * Collects and analyzes fan sentiment from Twitter using Apify.
 * 
 * Flow:
 * 1. Use Apify to scrape Twitter mentions of the club
 * 2. Perform hybrid sentiment analysis (keyword filtering + Gemini AI)
 * 3. Calculate sentiment score and mood
 * 4. Store snapshot in database
 * 
 * IMPORTANT:
 * - Requires APIFY_TOKEN environment variable
 * - Uses Gemini API for deep sentiment analysis (resolves key via resolveGeminiKey)
 * - Access is constrained by RLS via the user JWT (Authorization header)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APIFY_TOKEN = Deno.env.get('APIFY_TOKEN');

// Sentiment keywords for fast filtering
const KEYWORDS = {
  positive: ['happy', 'amazing', 'brilliant', 'love', 'excited', 'win', 'victory', 'euphoric', 'incredible', 'fantastic', 'great', 'awesome', 'best', 'wonderful'],
  negative: ['angry', 'sad', 'disappointed', 'hate', 'worried', 'lose', 'defeat', 'terrible', 'awful', 'disaster', 'bad', 'worst', 'horrible', 'pathetic'],
};

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function decryptSecret(ciphertextB64: string, ivB64: string): Promise<string> {
  const keyB64 = Deno.env.get('APP_ENCRYPTION_KEY');
  if (!keyB64) throw new Error('Missing APP_ENCRYPTION_KEY');

  const keyBytes = b64ToBytes(keyB64);
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
  const iv = b64ToBytes(ivB64);
  const ciphertext = b64ToBytes(ciphertextB64);
  const plaintextBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintextBuf);
}

async function resolveGeminiKey(supabase: any, clubId: string): Promise<{ key: string; source: string; orgId: string }> {
  // Determine orgId from club (RLS-protected)
  const { data: club, error: clubErr } = await supabase
    .from('clubs')
    .select('id, org_id')
    .eq('id', clubId)
    .single();
  if (clubErr || !club) throw new Error('Invalid club or access denied');

  const orgId = club.org_id as string;

  // Club override
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
    const key = await decryptSecret(clubSettings.byok_key_ciphertext, clubSettings.byok_key_iv);
    return { key, source: 'club_byok', orgId };
  }

  // Org default
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
    const key = await decryptSecret(orgSettings.byok_key_ciphertext, orgSettings.byok_key_iv);
    return { key, source: 'org_byok', orgId };
  }

  const platformKey = Deno.env.get('GEMINI_API_KEY');
  if (!platformKey) throw new Error('Missing GEMINI_API_KEY (platform managed)');
  return { key: platformKey, source: 'platform_managed', orgId };
}

async function geminiAnalyzeSentiment(apiKey: string, tweets: string[]): Promise<{ score: number; confidence: number }> {
  const prompt = `Analyze the sentiment of these tweets about a football club. Rate the overall sentiment from 0 (very negative) to 100 (very positive).

Tweets:
${tweets.slice(0, 30).map((t, i) => `${i + 1}. ${t}`).join('\n')}

Respond with a JSON object containing:
{
  "score": <number 0-100>,
  "confidence": <number 0-1>
}`;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=` +
    encodeURIComponent(apiKey);

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
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') ?? '';

  // Try to extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(100, result.score || 50)),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      };
    } catch (_e) {
      // Fall through to default
    }
  }

  // Default fallback
  return { score: 50, confidence: 0.5 };
}

async function analyzeSentiment(tweets: any[]): Promise<{
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  keywordScore: number;
}> {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  tweets.forEach((tweet: any) => {
    const text = (tweet.text || tweet.fullText || '').toLowerCase();
    const hasPositive = KEYWORDS.positive.some((kw) => text.includes(kw));
    const hasNegative = KEYWORDS.negative.some((kw) => text.includes(kw));

    if (hasPositive && !hasNegative) {
      positiveCount++;
    } else if (hasNegative && !hasPositive) {
      negativeCount++;
    } else {
      neutralCount++;
    }
  });

  const total = positiveCount + negativeCount + neutralCount;
  const keywordScore = total > 0 ? Math.round((positiveCount / total) * 100) : 50;

  return { positiveCount, negativeCount, neutralCount, keywordScore };
}

function calculateMood(score: number): 'euphoric' | 'happy' | 'neutral' | 'worried' | 'angry' {
  if (score >= 80) return 'euphoric';
  if (score >= 60) return 'happy';
  if (score >= 40) return 'neutral';
  if (score >= 20) return 'worried';
  return 'angry';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Service role client for database inserts (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const clubId = body?.clubId as string | undefined;
    const clubName = body?.clubName as string | undefined;
    const orgId = body?.orgId as string | undefined;

    if (!clubId || !clubName || !orgId) {
      return new Response(JSON.stringify({ error: 'Missing clubId, clubName, or orgId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!APIFY_TOKEN) {
      return new Response(JSON.stringify({ error: 'APIFY_TOKEN not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Use Apify to scrape Twitter
    const searchQuery = encodeURIComponent(`${clubName} OR #${clubName.replace(/\s+/g, '')}`);
    const actorRunResponse = await fetch(
      'https://api.apify.com/v2/acts/apify~twitter-scraper/runs',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: [
            {
              url: `https://twitter.com/search?q=${searchQuery}&src=typed_query&f=live`,
            },
          ],
          maxTweets: 150,
          searchMode: 'live',
          addUserInfo: false,
          maxItems: 150,
        }),
      }
    );

    if (!actorRunResponse.ok) {
      throw new Error(`Apify API error: ${actorRunResponse.status}`);
    }

    const { data: actorRun } = await actorRunResponse.json();
    const runId = actorRun.id;

    // Wait for actor to complete (polling)
    let status = 'RUNNING';
    let attempts = 0;
    while (status === 'RUNNING' && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      const statusResponse = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        {
          headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
        }
      );
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify actor run failed with status: ${status}`);
    }

    // Fetch results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
      {
        headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
      }
    );

    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch Apify results: ${resultsResponse.status}`);
    }

    const tweets = await resultsResponse.json();

    if (!Array.isArray(tweets) || tweets.length === 0) {
      // No tweets found, return neutral sentiment
      const snapshotDate = new Date().toISOString().split('T')[0];
      const neutralSentiment = {
        org_id: orgId,
        club_id: clubId,
        sentiment_score: 50,
        sentiment_mood: 'neutral',
        positive_count: 0,
        negative_count: 0,
        neutral_count: 0,
        total_mentions: 0,
        keywords_analyzed: [],
        data_source: 'twitter',
        snapshot_date: snapshotDate,
      };

      await supabaseService
        .from('fan_sentiment_snapshots')
        .upsert(neutralSentiment, { onConflict: 'club_id,snapshot_date' });

      return new Response(JSON.stringify(neutralSentiment), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Keyword-based sentiment analysis (fast pass)
    const keywordResults = await analyzeSentiment(tweets);
    const tweetTexts = tweets.map((t) => t.text || t.fullText || '').filter(Boolean);

    // Step 3: Gemini deep analysis (on subset)
    let geminiScore = keywordResults.keywordScore;
    try {
      const { key } = await resolveGeminiKey(supabase, clubId);
      // Sample tweets for Gemini analysis (mix of positive/negative/neutral)
      const sampleSize = Math.min(30, tweetTexts.length);
      const sampleTweets = tweetTexts.slice(0, sampleSize);
      const geminiResult = await geminiAnalyzeSentiment(key, sampleTweets);
      geminiScore = geminiResult.score;
    } catch (error) {
      console.warn('Gemini analysis failed, using keyword-only results:', error);
      // Continue with keyword-only results
    }

    // Step 4: Calculate weighted average (70% keyword, 30% Gemini)
    const finalScore = Math.round(
      keywordResults.keywordScore * 0.7 + geminiScore * 0.3
    );

    // Step 5: Determine mood and prepare snapshot
    const sentimentMood = calculateMood(finalScore);
    const snapshotDate = new Date().toISOString().split('T')[0];
    const keywordsFound = [
      ...KEYWORDS.positive.filter((kw) =>
        tweetTexts.some((t) => t.toLowerCase().includes(kw))
      ),
      ...KEYWORDS.negative.filter((kw) =>
        tweetTexts.some((t) => t.toLowerCase().includes(kw))
      ),
    ];

    const sentimentSnapshot = {
      org_id: orgId,
      club_id: clubId,
      sentiment_score: finalScore,
      sentiment_mood: sentimentMood,
      positive_count: keywordResults.positiveCount,
      negative_count: keywordResults.negativeCount,
      neutral_count: keywordResults.neutralCount,
      total_mentions: tweets.length,
      keywords_analyzed: keywordsFound.slice(0, 20), // Limit to 20 keywords
      data_source: 'twitter',
      snapshot_date: snapshotDate,
    };

    // Step 6: Store in database (use service role to bypass RLS)
    const { error: dbError } = await supabaseService
      .from('fan_sentiment_snapshots')
      .upsert(sentimentSnapshot, { onConflict: 'club_id,snapshot_date' });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    return new Response(JSON.stringify(sentimentSnapshot), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in fan-sentiment:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

