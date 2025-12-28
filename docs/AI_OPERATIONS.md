# PitchSide AI — AI Operations Guide

> AI architecture, key management, usage tracking, and optimization

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Key Management](#3-key-management)
4. [AI Actions](#4-ai-actions)
5. [Usage Tracking](#5-usage-tracking)
6. [Prompts & Templates](#6-prompts--templates)
7. [Performance Optimization](#7-performance-optimization)
8. [Cost Management](#8-cost-management)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Overview

PitchSide AI uses Google's Gemini API for all AI-powered features:
- Content generation (match reports, social posts, weekly protocols)
- Player analysis and scouting reports
- Smart email replies
- Task action plans
- Opponent intelligence
- Chat assistant

### Key Features

- **Server-side Processing:** All AI calls via Edge Functions
- **Managed + BYOK:** Platform key or user's own key
- **Usage Tracking:** All calls logged for billing/analytics
- **Precedence System:** Club → Org → Platform key resolution

---

## 2. Architecture

### Data Flow

```
┌─────────────┐     ┌────────────────┐     ┌─────────────┐
│   Client    │────▶│  ai-generate   │────▶│  Gemini API │
│   (React)   │     │ Edge Function  │     │             │
└─────────────┘     └────────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Supabase   │
                    │  ai_usage_  │
                    │   events    │
                    └─────────────┘
```

### Components

| Component | Role |
|-----------|------|
| `geminiService.ts` | Client-side service (calls Edge Function) |
| `ai-generate` Edge Function | Server-side AI processing |
| `ai-settings` Edge Function | Key management |
| `ai_usage_events` | Usage logging table |
| `org_ai_settings` | Org-level AI configuration |
| `club_ai_settings` | Club-level AI configuration |

---

## 3. Key Management

### 3.1 Key Types

| Type | Location | Priority |
|------|----------|----------|
| Platform Key | Edge Function secret | Lowest |
| Org BYOK | `org_ai_settings.byok_key_ciphertext` | Middle |
| Club BYOK | `club_ai_settings.byok_key_ciphertext` | Highest |

### 3.2 Key Resolution

```typescript
// ai-generate Edge Function
async function resolveApiKey(orgId: string, clubId?: string): Promise<string> {
  // 1. Check club BYOK (highest priority)
  if (clubId) {
    const clubSettings = await supabase
      .from('club_ai_settings')
      .select('mode, byok_key_ciphertext, byok_key_iv')
      .eq('club_id', clubId)
      .single();
    
    if (clubSettings.data?.mode === 'byok' && clubSettings.data.byok_key_ciphertext) {
      return decrypt(clubSettings.data.byok_key_ciphertext, clubSettings.data.byok_key_iv);
    }
  }
  
  // 2. Check org BYOK
  const orgSettings = await supabase
    .from('org_ai_settings')
    .select('mode, byok_key_ciphertext, byok_key_iv')
    .eq('org_id', orgId)
    .single();
  
  if (orgSettings.data?.mode === 'byok' && orgSettings.data.byok_key_ciphertext) {
    return decrypt(orgSettings.data.byok_key_ciphertext, orgSettings.data.byok_key_iv);
  }
  
  // 3. Fall back to platform managed key
  return Deno.env.get('GEMINI_API_KEY')!;
}
```

### 3.3 Mode Options

**Org Settings (`org_ai_settings.mode`):**
- `managed` — Use platform key (default)
- `byok` — Use org's own API key
- `hybrid` — Allow clubs to override

**Club Settings (`club_ai_settings.mode`):**
- `inherit` — Use org's setting (default)
- `byok` — Use club's own API key

### 3.4 Key Storage (Encrypted)

```sql
-- Org AI settings
CREATE TABLE org_ai_settings (
  org_id UUID PRIMARY KEY REFERENCES orgs(id),
  mode TEXT NOT NULL DEFAULT 'managed',
  byok_key_ciphertext TEXT,  -- AES-256-GCM encrypted
  byok_key_iv TEXT,          -- Initialization vector
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club AI settings (overrides)
CREATE TABLE club_ai_settings (
  club_id UUID PRIMARY KEY REFERENCES clubs(id),
  org_id UUID NOT NULL REFERENCES orgs(id),
  mode TEXT NOT NULL DEFAULT 'inherit',
  byok_key_ciphertext TEXT,
  byok_key_iv TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Settings UI

```typescript
// SettingsView.tsx - AI Settings section
<div>
  <h3>AI Configuration</h3>
  
  <Toggle
    label="Use Own API Key (BYOK)"
    checked={settings.mode === 'byok'}
    onChange={() => toggleByok()}
  />
  
  {settings.mode === 'byok' && (
    <Input
      label="Gemini API Key"
      type="password"
      value={apiKey}
      onChange={setApiKey}
      placeholder="Enter your Gemini API key"
    />
  )}
  
  <Button onClick={saveSettings}>Save AI Settings</Button>
</div>
```

---

## 4. AI Actions

### 4.1 Available Actions

| Action | Description | Input | Output |
|--------|-------------|-------|--------|
| `playerAnalysis` | Generate player scouting report | Player data | Markdown report |
| `matchReport` | Generate match report | Match data, stats | Full article |
| `socialPost` | Generate social content | Context, platform | Post text |
| `weeklyProtocol` | Generate weekly content pack | Fixtures, context | Multiple items |
| `smartReply` | Generate email replies | Email content | Reply options |
| `actionPlan` | Generate task action plan | Task details | Step-by-step plan |
| `opponentReport` | Analyze opponent | Opponent name | Intelligence report |
| `sponsorContent` | Generate sponsor content | Sponsor, type | Branded content |
| `chat` | General assistant | User message | AI response |

### 4.2 Request Format

```typescript
// Client-side (geminiService.ts)
const response = await supabase.functions.invoke('ai-generate', {
  body: {
    orgId: currentOrg.id,
    clubId: currentClub?.id,
    action: 'playerAnalysis',
    payload: {
      player: selectedPlayer,
      club: currentClub,
    },
  },
});

// Edge Function receives
interface AIGenerateRequest {
  orgId: string;
  clubId?: string;
  action: string;
  payload: Record<string, any>;
}
```

### 4.3 Response Format

```typescript
interface AIGenerateResponse {
  success: boolean;
  data?: any;          // Generated content
  error?: string;      // Error message if failed
  usage?: {
    inputChars: number;
    outputChars: number;
    model: string;
  };
}
```

---

## 5. Usage Tracking

### 5.1 Usage Events Table

```sql
CREATE TABLE ai_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  club_id UUID REFERENCES clubs(id),
  user_id UUID,                    -- auth.users.id
  action TEXT NOT NULL,            -- e.g., 'playerAnalysis'
  status TEXT NOT NULL,            -- 'success' or 'error'
  approx_input_chars INTEGER,      -- Request size
  approx_output_chars INTEGER,     -- Response size
  meta JSONB,                      -- Additional metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Logging Usage

```typescript
// In ai-generate Edge Function
async function logUsage(params: {
  orgId: string;
  clubId?: string;
  userId?: string;
  action: string;
  status: 'success' | 'error';
  inputChars?: number;
  outputChars?: number;
  meta?: Record<string, any>;
}) {
  await supabase.from('ai_usage_events').insert({
    org_id: params.orgId,
    club_id: params.clubId,
    user_id: params.userId,
    action: params.action,
    status: params.status,
    approx_input_chars: params.inputChars,
    approx_output_chars: params.outputChars,
    meta: params.meta,
  });
}
```

### 5.3 Usage Queries

```sql
-- Usage by org (last 30 days)
SELECT 
  org_id,
  action,
  COUNT(*) as call_count,
  SUM(approx_input_chars) as total_input,
  SUM(approx_output_chars) as total_output
FROM ai_usage_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY org_id, action;

-- Daily usage trend
SELECT 
  DATE(created_at) as date,
  COUNT(*) as calls,
  SUM(approx_input_chars + approx_output_chars) as total_chars
FROM ai_usage_events
WHERE org_id = $1
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Error rate by action
SELECT 
  action,
  COUNT(*) FILTER (WHERE status = 'success') as successes,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / COUNT(*), 2) as error_rate
FROM ai_usage_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action;
```

---

## 6. Prompts & Templates

### 6.1 System Prompt Template

```typescript
const baseSystemPrompt = `You are an AI assistant for ${club.name} (${club.nickname}).

Club Context:
- Tone: ${club.tone_context}
- Primary Color: ${club.primary_color}
- Competition: ${currentCompetition}

Guidelines:
- Match the club's voice and personality
- Be professional but engaging
- Use football/soccer terminology appropriate for the region
- Reference recent events when relevant
`;
```

### 6.2 Player Analysis Prompt

```typescript
const playerAnalysisPrompt = `
Analyze this player for ${club.name}'s scouting department:

Player: ${player.name}
Position: ${player.position}
Age: ${player.age}
Nationality: ${player.nationality}
Current Value: ${player.value}

Stats:
- Pace: ${player.pace}/100
- Shooting: ${player.shooting}/100
- Passing: ${player.passing}/100
- Defending: ${player.defending}/100
- Physical: ${player.physical}/100

Provide:
1. Overall Assessment (2-3 sentences)
2. Key Strengths (3 bullet points)
3. Areas for Development (2-3 bullet points)
4. Tactical Fit for ${club.nickname}
5. Development Potential
6. Recommended Training Focus

Format as markdown with headers.
`;
```

### 6.3 Match Report Prompt

```typescript
const matchReportPrompt = `
Generate a match report for ${club.name}:

Match: ${club.name} vs ${opponent}
Result: ${homeScore} - ${awayScore}
Venue: ${venue}
Competition: ${competition}

Scorers: ${scorers.join(', ')}
Man of the Match: ${motm}

Key Events:
${keyEvents}

Stats:
- Possession: ${stats.possession}%
- Shots on Target: ${stats.shotsOnTarget}
- Corners: ${stats.corners}

Manager Quote: "${managerQuote}"

Vibe: ${matchVibe}

Write a 400-600 word match report including:
1. Opening hook
2. Match narrative
3. Key moments
4. Player highlights
5. Tactical observations
6. Manager reaction
7. What's next

Tone: ${club.tone_context}
`;
```

### 6.4 Smart Reply Prompt

```typescript
const smartReplyPrompt = `
Generate 3 professional reply options for this email:

From: ${email.from}
Subject: ${email.subject}
Body:
${email.body}

Context: You are replying on behalf of ${club.name}.

Generate 3 different reply options:
1. Brief and direct
2. Detailed and helpful
3. Warm and personal

Each reply should be professional and match the club's tone.
Return as JSON array: ["reply1", "reply2", "reply3"]
`;
```

---

## 7. Performance Optimization

### 7.1 Model Selection

| Use Case | Recommended Model | Reason |
|----------|-------------------|--------|
| Quick responses | gemini-1.5-flash | Fast, cost-effective |
| Complex analysis | gemini-1.5-pro | Better reasoning |
| Long content | gemini-1.5-pro | Larger context window |

### 7.2 Prompt Optimization

**Do:**
- Be specific about output format
- Include relevant context only
- Use structured prompts
- Set clear constraints

**Don't:**
- Include unnecessary information
- Use vague instructions
- Ask for multiple unrelated things
- Ignore token limits

### 7.3 Caching Strategies

```typescript
// Cache opponent reports (they don't change often)
const cacheKey = `opponent:${opponent}:${Date.now() / (1000 * 60 * 60)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const report = await generateOpponentReport(opponent);
await redis.set(cacheKey, JSON.stringify(report), 'EX', 3600);
return report;
```

### 7.4 Streaming Responses

```typescript
// For long-form content, consider streaming
const stream = await genAI.generateContentStream({
  model: 'gemini-1.5-pro',
  prompt: longPrompt,
});

for await (const chunk of stream) {
  // Send chunk to client
  controller.enqueue(encoder.encode(chunk.text()));
}
```

---

## 8. Cost Management

### 8.1 Gemini Pricing (Approximate)

| Model | Input | Output |
|-------|-------|--------|
| gemini-1.5-flash | $0.075/1M chars | $0.30/1M chars |
| gemini-1.5-pro | $1.25/1M chars | $5.00/1M chars |

### 8.2 Cost Estimation

```typescript
function estimateCost(inputChars: number, outputChars: number, model: string): number {
  const rates = {
    'gemini-1.5-flash': { input: 0.075 / 1000000, output: 0.30 / 1000000 },
    'gemini-1.5-pro': { input: 1.25 / 1000000, output: 5.00 / 1000000 },
  };
  
  const rate = rates[model] || rates['gemini-1.5-flash'];
  return (inputChars * rate.input) + (outputChars * rate.output);
}
```

### 8.3 Usage Alerts

```sql
-- Alert if org exceeds daily threshold
SELECT org_id, SUM(approx_input_chars + approx_output_chars) as chars_today
FROM ai_usage_events
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY org_id
HAVING SUM(approx_input_chars + approx_output_chars) > 1000000;
```

### 8.4 Rate Limiting

```typescript
// Simple rate limiting per org
const key = `ai_rate:${orgId}:${Math.floor(Date.now() / 60000)}`;
const count = await redis.incr(key);
await redis.expire(key, 60);

if (count > 100) {
  throw new Error('Rate limit exceeded (100 requests/minute)');
}
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "API key invalid" | Wrong key format | Verify key in Google Cloud |
| "Quota exceeded" | Too many requests | Wait or upgrade quota |
| "Context too long" | Prompt too large | Reduce context |
| "Timeout" | Slow generation | Use faster model |
| "Empty response" | Prompt issue | Review prompt format |

### 9.2 Debug Logging

```typescript
// Enable detailed logging
const DEBUG = Deno.env.get('AI_DEBUG') === 'true';

if (DEBUG) {
  console.log('AI Request:', {
    action,
    inputChars: prompt.length,
    model,
    orgId,
    clubId,
  });
}
```

### 9.3 Testing Keys

```bash
# Test Gemini key directly
curl -X POST \
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### 9.4 Fallback Behavior

```typescript
// If AI fails, provide graceful fallback
try {
  const result = await generateContent(prompt);
  return { success: true, data: result };
} catch (error) {
  // Log error
  await logUsage({ ...params, status: 'error', meta: { error: error.message } });
  
  // Return fallback
  return {
    success: false,
    error: 'AI generation temporarily unavailable. Please try again.',
    fallback: getFallbackContent(action),
  };
}
```

---

## Quick Reference

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /functions/v1/ai-generate` | Generate AI content |
| `GET /functions/v1/ai-settings` | Get AI settings |
| `PUT /functions/v1/ai-settings` | Update AI settings |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Platform managed API key |
| `AI_DEBUG` | Enable debug logging |
| `AI_MODEL_DEFAULT` | Default model to use |

---

*Last Updated: December 2024*








