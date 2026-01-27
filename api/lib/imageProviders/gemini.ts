/**
 * Gemini Provider (Fallback)
 *
 * Uses Gemini 2.0 Flash with image generation capability
 * Best for: Fallback when other providers fail, cost-effective option
 */

import { GoogleGenAI, Modality } from '@google/genai';
import type {
  ImageProviderAdapter,
  ImageGenerationOptions,
  ImageGenerationResult,
  ProviderConfig,
} from './types';

export const geminiProvider: ImageProviderAdapter = {
  name: 'gemini',

  async generate(
    options: ImageGenerationOptions,
    config: ProviderConfig
  ): Promise<ImageGenerationResult> {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    const contents: Array<
      { text: string } | { inlineData: { data: string; mimeType: string } }
    > = [{ text: options.prompt }];

    // Add reference image if provided
    if (options.referenceImageBase64 && options.referenceMimeType) {
      contents.push({
        inlineData: {
          data: options.referenceImageBase64,
          mimeType: options.referenceMimeType,
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
    let imageBase64 = '';
    let mimeType = 'image/png';
    let description = '';

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
      throw new Error('Gemini did not generate an image');
    }

    return {
      imageBase64,
      mimeType,
      description,
      provider: 'gemini',
    };
  },
};
