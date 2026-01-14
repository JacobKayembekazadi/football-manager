/**
 * Supabase Edge Function: ai-generate-image
 *
 * Gemini 2.5 Flash Image Generation proxy:
 * - Resolves which Gemini API key to use (club BYOK > org BYOK > platform key)
 * - Calls Gemini REST API with image generation model
 * - Returns base64 image data
 * - Logs usage to ai_usage_events
 * - Includes CORS protection and rate limiting
 *
 * Model: gemini-2.5-flash-preview-05-20
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  corsJsonResponse,
  corsErrorResponse,
} from '../_shared/cors.ts';
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitExceededResponse,
  addRateLimitHeaders,
  RATE_LIMITS,
} from '../_shared/rateLimit.ts';
import { resolveGeminiKey } from '../_shared/aiKeyResolver.ts';

interface ImageGenerationResult {
  imageBase64: string;
  mimeType: string;
  description?: string;
}

async function geminiGenerateImage(
  apiKey: string,
  prompt: string,
  referenceImageBase64?: string,
  referenceMimeType?: string
): Promise<ImageGenerationResult> {
  const model = 'gemini-2.5-flash-preview-05-20';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Build parts array
  const parts: any[] = [];

  // Add reference image if provided (for image editing/style transfer)
  if (referenceImageBase64 && referenceMimeType) {
    parts.push({
      inline_data: {
        mime_type: referenceMimeType,
        data: referenceImageBase64,
      },
    });
  }

  // Add text prompt
  parts.push({ text: prompt });

  const requestBody = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini image generation error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const responseParts = json?.candidates?.[0]?.content?.parts || [];

  let imageBase64 = '';
  let mimeType = 'image/png';
  let description = '';

  for (const part of responseParts) {
    if (part.text) {
      description += part.text;
    }
    if (part.inlineData) {
      imageBase64 = part.inlineData.data;
      mimeType = part.inlineData.mimeType || 'image/png';
    }
  }

  if (!imageBase64) {
    throw new Error('No image generated in response');
  }

  return { imageBase64, mimeType, description: description.trim() || undefined };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get user for rate limiting
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Check rate limit (stricter for image generation)
    const rateLimitKey = getRateLimitKey(req, userId, 'ai-generate-image');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.AI_GENERATE_IMAGE);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult, corsHeaders);
    }

    const body = await req.json();
    const clubId = body?.clubId as string | undefined;
    const prompt = body?.prompt as string | undefined;
    const referenceImageBase64 = body?.referenceImageBase64 as string | undefined;
    const referenceMimeType = body?.referenceMimeType as string | undefined;
    const action = (body?.action as string | undefined) || 'ai_generate_image';

    if (!clubId || !prompt) {
      return corsJsonResponse({ error: 'Missing clubId or prompt' }, req, 400);
    }

    const { key, source, orgId } = await resolveGeminiKey(supabase, clubId);
    const result = await geminiGenerateImage(key, prompt, referenceImageBase64, referenceMimeType);

    // Usage logging (best-effort)
    try {
      await supabase.from('ai_usage_events').insert({
        org_id: orgId,
        club_id: clubId,
        user_id: userId ?? null,
        action,
        status: 'success',
        approx_input_chars: prompt.length + (referenceImageBase64?.length || 0),
        approx_output_chars: result.imageBase64.length,
        meta: { model: 'gemini-2.5-flash-image', key_source: source, type: 'image_generation' },
      });
    } catch (_e) {
      // ignore logging errors
    }

    // Add rate limit headers to successful response
    const responseHeaders = addRateLimitHeaders(
      { ...corsHeaders, 'Content-Type': 'application/json' },
      rateLimitResult
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Error in ai-generate-image:', error);
    return corsErrorResponse(error as Error, req, 500);
  }
});
