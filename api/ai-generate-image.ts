/**
 * Vercel Serverless Function: AI Image Generation
 *
 * Uses Gemini's Imagen model for image generation
 * Set GEMINI_API_KEY in Vercel dashboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

interface RequestBody {
  prompt: string;
  referenceImageBase64?: string;
  referenceMimeType?: string;
  clubId?: string;
  action?: string;
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY not configured. Add it in Vercel Dashboard → Settings → Environment Variables'
    });
  }

  try {
    const { prompt, referenceImageBase64, referenceMimeType } =
      req.body as RequestBody;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build contents with optional reference image
    const contents: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: prompt },
    ];

    if (referenceImageBase64 && referenceMimeType) {
      contents.push({
        inlineData: {
          data: referenceImageBase64,
          mimeType: referenceMimeType,
        },
      });
    }

    // Use Gemini 2.0 Flash with image generation capability
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents,
      config: {
        responseModalities: ['Text', 'Image'],
      },
    });

    // Extract image from response
    let imageBase64 = '';
    let mimeType = 'image/png';
    let description = '';

    // Check for parts in the response
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data || '';
        mimeType = part.inlineData.mimeType || 'image/png';
      }
      if (part.text) {
        description = part.text;
      }
    }

    if (!imageBase64) {
      // Fallback: return text response
      return res.status(200).json({
        error: 'Image generation not available for this prompt',
        description: response.text || 'No response generated',
      });
    }

    return res.status(200).json({
      imageBase64,
      mimeType,
      description,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `Image generation failed: ${message}` });
  }
}
