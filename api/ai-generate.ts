/**
 * Vercel Serverless Function: AI Text Generation
 *
 * Multi-provider ready: Gemini (default), OpenAI, Anthropic
 * Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in Vercel dashboard
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

type Provider = 'gemini' | 'openai' | 'anthropic';

interface RequestBody {
  prompt: string;
  model?: string;
  provider?: Provider;
  clubId?: string;
  action?: string;
}

// Default models per provider
const DEFAULT_MODELS: Record<Provider, string> = {
  gemini: 'gemini-2.0-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
};

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

  try {
    const { prompt, model, provider = 'gemini', clubId, action } = req.body as RequestBody;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const selectedModel = model || DEFAULT_MODELS[provider];
    let text: string;

    switch (provider) {
      case 'gemini':
        text = await generateWithGemini(prompt, selectedModel);
        break;
      case 'openai':
        text = await generateWithOpenAI(prompt, selectedModel);
        break;
      case 'anthropic':
        text = await generateWithAnthropic(prompt, selectedModel);
        break;
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    return res.status(200).json({ text, provider, model: selectedModel });
  } catch (error) {
    console.error('AI generation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: `AI generation failed: ${message}` });
  }
}

async function generateWithGemini(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Add it in Vercel Dashboard → Settings → Environment Variables');
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  return response.text || '';
}

async function generateWithOpenAI(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${errorData}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generateWithAnthropic(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Anthropic API error: ${errorData}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}
