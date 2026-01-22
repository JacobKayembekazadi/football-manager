/**
 * Vercel Serverless Function: AI Image Generation
 *
 * Multi-provider image generation with intelligent routing:
 * - Ideogram 2.0: Best for text-heavy graphics (scores, matchday info)
 * - Imagen 3: Best for visual quality (player cards, announcements)
 * - Gemini 2.0 Flash: Fallback option
 *
 * Environment Variables (Vercel Dashboard):
 * - GEMINI_API_KEY: Required - Used for Imagen 3 and Gemini
 * - IDEOGRAM_API_KEY: Optional - Enables Ideogram for text-heavy graphics
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateWithRouter,
  getPrimaryProvider,
  type AspectRatio,
} from './lib/imageProviders';

interface RequestBody {
  prompt: string;
  referenceImageBase64?: string;
  referenceMimeType?: string;
  clubId?: string;
  action?: string;
  aspectRatio?: AspectRatio;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return res.status(500).json({
      error:
        'GEMINI_API_KEY not configured. Add it in Vercel Dashboard → Settings → Environment Variables',
    });
  }

  const ideogramApiKey = process.env.IDEOGRAM_API_KEY;

  try {
    const {
      prompt,
      referenceImageBase64,
      referenceMimeType,
      action = 'generate_custom_image',
      aspectRatio = '1:1',
    } = req.body as RequestBody;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Log which provider will be attempted first
    const primaryProvider = getPrimaryProvider(action);
    console.log(`[ai-generate-image] Action: ${action}, Primary provider: ${primaryProvider}`);

    // Generate image using router with fallback chain
    const result = await generateWithRouter({
      action,
      options: {
        prompt,
        aspectRatio,
        referenceImageBase64,
        referenceMimeType,
      },
      config: {
        geminiApiKey,
        ideogramApiKey,
      },
    });

    console.log(`[ai-generate-image] Generated successfully with provider: ${result.provider}`);

    return res.status(200).json({
      imageBase64: result.imageBase64,
      mimeType: result.mimeType,
      description: result.description,
      provider: result.provider, // Include for debugging/analytics
    });
  } catch (error) {
    console.error('[ai-generate-image] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `Image generation failed: ${message}` });
  }
}
