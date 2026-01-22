/**
 * Vercel Serverless Function: AI Image Generation
 *
 * Uses Google Imagen 3 for high-quality image generation
 * Set GEMINI_API_KEY in Vercel dashboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

interface RequestBody {
  prompt: string;
  referenceImageBase64?: string;
  referenceMimeType?: string;
  clubId?: string;
  action?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
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
    const { prompt, referenceImageBase64, referenceMimeType, aspectRatio = '1:1' } =
      req.body as RequestBody;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Try Imagen 3 first, fall back to Gemini 2.0 Flash for image generation
    let imageBase64 = '';
    let mimeType = 'image/png';
    let description = '';

    try {
      // Use Imagen 3 for best quality
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: aspectRatio,
          // Safety settings for generated content
          safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      });

      // Extract image from Imagen response
      if (response.generatedImages && response.generatedImages.length > 0) {
        const generatedImage = response.generatedImages[0];
        if (generatedImage.image?.imageBytes) {
          imageBase64 = generatedImage.image.imageBytes;
          mimeType = 'image/png';
        }
      }
    } catch (imagenError) {
      console.log('Imagen 3 not available, falling back to Gemini 2.0 Flash:', imagenError);

      // Fallback to Gemini 2.0 Flash with image generation
      const contents: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
        { text: prompt },
      ];

      // Add reference image if provided
      if (referenceImageBase64 && referenceMimeType) {
        contents.push({
          inlineData: {
            data: referenceImageBase64,
            mimeType: referenceMimeType,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Extract image from Gemini response
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
    }

    if (!imageBase64) {
      return res.status(200).json({
        error: 'Image generation not available for this prompt',
        description: 'The model could not generate an image for this request.',
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
