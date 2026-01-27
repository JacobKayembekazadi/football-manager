/**
 * Image Provider Router
 *
 * Routes image generation requests to the appropriate provider based on:
 * 1. Action type (matchday graphics need text accuracy, etc.)
 * 2. Fallback chain when primary provider fails
 */

import type {
  ImageProvider,
  ImageActionType,
  ImageGenerationOptions,
  ImageGenerationResult,
  ProviderConfig,
  ImageProviderAdapter,
} from './types';
import { parseActionType } from './types';
import { imagenProvider } from './imagen';
import { geminiProvider } from './gemini';
import { ideogramProvider } from './ideogram';

/**
 * Routing configuration: which provider to use for each action type
 *
 * Strategy:
 * - Text-heavy graphics (scores, matchday) → Ideogram (best text rendering)
 * - Visual-quality graphics (player cards) → Imagen 3 (high quality)
 * - General/custom → Imagen 3 (good balance)
 */
const ROUTING_CONFIG: Record<ImageActionType, ImageProvider[]> = {
  // Text-heavy: Ideogram primary for accurate score/date rendering
  generate_result_graphic: ['ideogram', 'imagen', 'gemini'],
  generate_matchday_graphic: ['ideogram', 'imagen', 'gemini'],

  // Visual-quality: Imagen primary for best visual output
  generate_player_spotlight: ['imagen', 'gemini'],
  generate_announcement: ['imagen', 'ideogram', 'gemini'],

  // General purpose: Imagen primary, good balance of quality/cost
  generate_custom_image: ['imagen', 'gemini'],
};

/**
 * Provider registry
 */
const PROVIDERS: Record<ImageProvider, ImageProviderAdapter> = {
  imagen: imagenProvider,
  ideogram: ideogramProvider,
  gemini: geminiProvider,
};

export interface RouterConfig {
  geminiApiKey: string;
  ideogramApiKey?: string;
}

export interface GenerationContext {
  action: string;
  options: ImageGenerationOptions;
  config: RouterConfig;
}

/**
 * Generate an image using the appropriate provider with fallback
 */
export async function generateWithRouter(
  context: GenerationContext
): Promise<ImageGenerationResult> {
  const actionType = parseActionType(context.action);
  const providerChain = ROUTING_CONFIG[actionType];

  let lastError: Error | null = null;

  for (const providerName of providerChain) {
    // Skip Ideogram if no API key configured
    if (providerName === 'ideogram' && !context.config.ideogramApiKey) {
      console.log(`[Router] Skipping Ideogram (no API key configured)`);
      continue;
    }

    const provider = PROVIDERS[providerName];
    const providerConfig: ProviderConfig = {
      apiKey:
        providerName === 'ideogram'
          ? context.config.ideogramApiKey!
          : context.config.geminiApiKey,
    };

    try {
      console.log(`[Router] Trying provider: ${providerName} for action: ${actionType}`);
      const result = await provider.generate(context.options, providerConfig);
      console.log(`[Router] Success with provider: ${providerName}`);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[Router] Provider ${providerName} failed: ${lastError.message}`);
    }
  }

  throw lastError || new Error('All providers failed');
}

/**
 * Get the primary provider for an action type (for logging/debugging)
 */
export function getPrimaryProvider(action: string): ImageProvider {
  const actionType = parseActionType(action);
  return ROUTING_CONFIG[actionType][0];
}
