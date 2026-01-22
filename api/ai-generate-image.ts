/**
 * Vercel Serverless Function: AI Image Generation
 *
 * Uses Gemini's Imagen model for image generation
 * Set GEMINI_API_KEY in Vercel dashboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { prompt, referenceImageBase64, referenceMimeType, clubId, action } =
      req.body as RequestBody;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 2.0 Flash with image generation capability
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        // @ts-expect-error - responseModalities is valid for image generation
        responseModalities: ['Text', 'Image'],
      },
    });

    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: prompt },
    ];

    // Add reference image if provided
    if (referenceImageBase64 && referenceMimeType) {
      parts.push({
        inlineData: {
          data: referenceImageBase64,
          mimeType: referenceMimeType,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = result.response;

    // Extract image from response
    let imageBase64 = '';
    let mimeType = 'image/png';
    let description = '';

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if ('inlineData' in part && part.inlineData) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
        }
        if ('text' in part && part.text) {
          description = part.text;
        }
      }
    }

    if (!imageBase64) {
      // Fallback: try text-only response
      const text = response.text();
      return res.status(200).json({
        error: 'Image generation not available for this prompt',
        description: text,
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
