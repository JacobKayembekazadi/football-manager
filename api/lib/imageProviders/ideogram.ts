/**
 * Ideogram Provider
 *
 * Uses Ideogram 2.0 API for image generation
 * Best for: Text-heavy graphics (scores, dates, team names)
 *
 * API Docs: https://docs.ideogram.ai/api-reference/generate-image
 */

import type {
  ImageProviderAdapter,
  ImageGenerationOptions,
  ImageGenerationResult,
  ProviderConfig,
  AspectRatio,
} from './types';

// Map our aspect ratios to Ideogram's format
const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  '1:1': 'ASPECT_1_1',
  '16:9': 'ASPECT_16_9',
  '9:16': 'ASPECT_9_16',
  '4:3': 'ASPECT_4_3',
  '3:4': 'ASPECT_3_4',
};

interface IdeogramResponse {
  data: Array<{
    url?: string;
    prompt: string;
    resolution: string;
    is_image_safe: boolean;
  }>;
}

export const ideogramProvider: ImageProviderAdapter = {
  name: 'ideogram',

  async generate(
    options: ImageGenerationOptions,
    config: ProviderConfig
  ): Promise<ImageGenerationResult> {
    const aspectRatio = ASPECT_RATIO_MAP[options.aspectRatio || '1:1'];

    const response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.apiKey,
      },
      body: JSON.stringify({
        image_request: {
          prompt: options.prompt,
          aspect_ratio: aspectRatio,
          model: 'V_2',
          magic_prompt_option: 'AUTO',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ideogram API error: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as IdeogramResponse;

    if (!result.data || result.data.length === 0 || !result.data[0].url) {
      throw new Error('Ideogram returned no images');
    }

    // Fetch the image and convert to base64
    const imageUrl = result.data[0].url;
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch Ideogram image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Determine mime type from URL or default to png
    const mimeType = imageUrl.includes('.jpg') || imageUrl.includes('.jpeg')
      ? 'image/jpeg'
      : 'image/png';

    return {
      imageBase64,
      mimeType,
      provider: 'ideogram',
    };
  },
};
