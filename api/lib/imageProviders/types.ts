/**
 * Multi-Provider Image Generation Types
 *
 * Shared interfaces for image generation providers (Imagen, Ideogram, Gemini)
 */

export type ImageProvider = 'imagen' | 'ideogram' | 'gemini';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: AspectRatio;
  referenceImageBase64?: string;
  referenceMimeType?: string;
}

export interface ImageGenerationResult {
  imageBase64: string;
  mimeType: string;
  description?: string;
  provider: ImageProvider;
}

export interface ProviderConfig {
  apiKey: string;
}

/**
 * Image provider adapter interface
 * Each provider (Imagen, Ideogram, Gemini) implements this interface
 */
export interface ImageProviderAdapter {
  name: ImageProvider;
  generate: (options: ImageGenerationOptions, config: ProviderConfig) => Promise<ImageGenerationResult>;
}

/**
 * Action types from geminiService.ts that determine routing
 */
export type ImageActionType =
  | 'generate_matchday_graphic'
  | 'generate_result_graphic'
  | 'generate_player_spotlight'
  | 'generate_announcement'
  | 'generate_custom_image';

/**
 * Parse action string to determine image type
 * Actions come in format: "generate_matchday_graphic:neon" or "generate_result_graphic"
 */
export function parseActionType(action: string): ImageActionType {
  const baseAction = action.split(':')[0];

  const validActions: ImageActionType[] = [
    'generate_matchday_graphic',
    'generate_result_graphic',
    'generate_player_spotlight',
    'generate_announcement',
    'generate_custom_image',
  ];

  if (validActions.includes(baseAction as ImageActionType)) {
    return baseAction as ImageActionType;
  }

  // Default to custom for unknown actions
  return 'generate_custom_image';
}
