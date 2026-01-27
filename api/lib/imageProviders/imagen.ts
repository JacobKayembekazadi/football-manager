/**
 * Imagen 3 Provider
 *
 * Uses Google's Imagen 3 model via @google/genai SDK
 * Best for: Visual quality, general-purpose graphics
 */

import { GoogleGenAI, SafetyFilterLevel } from '@google/genai';
import type {
  ImageProviderAdapter,
  ImageGenerationOptions,
  ImageGenerationResult,
  ProviderConfig,
} from './types';

export const imagenProvider: ImageProviderAdapter = {
  name: 'imagen',

  async generate(
    options: ImageGenerationOptions,
    config: ProviderConfig
  ): Promise<ImageGenerationResult> {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: options.prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: options.aspectRatio || '1:1',
        safetyFilterLevel: SafetyFilterLevel.BLOCK_MEDIUM_AND_ABOVE,
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('Imagen 3 returned no images');
    }

    const generatedImage = response.generatedImages[0];
    if (!generatedImage.image?.imageBytes) {
      throw new Error('Imagen 3 image has no bytes');
    }

    return {
      imageBase64: generatedImage.image.imageBytes,
      mimeType: 'image/png',
      provider: 'imagen',
    };
  },
};
