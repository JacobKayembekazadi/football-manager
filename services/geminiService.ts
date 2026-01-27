import { Fixture, Club, ContentType, Player, Sponsor } from '../types';

// AI provider configuration - defaults to Gemini, can be overridden
type AIProvider = 'gemini' | 'openai' | 'anthropic';
const AI_PROVIDER: AIProvider = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'gemini';

interface GenerationContext {
  matchType?: string;
  vibe?: string;
  motm?: string;
  managerQuote?: string;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Extract JSON from AI response that may be wrapped in markdown code blocks or have extra text
 */
const extractJson = (text: string): string => {
  // Try to find JSON in markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Try to find JSON array directly
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  // Return original text as fallback
  return text.trim();
};

const getCommonSystemPrompt = (club: Club) => `
You are the Media Officer for ${club.name} (Nicknamed: ${club.nickname}).
Tone: ${club.tone_context}

Squad Context:
${club.players.map((p) => `#${p.number} ${p.name} (${p.position})`).join(', ')}

Rules:
- Keep it punchy and engaging.
- No robotic AI phrases like "Here is a tweet" or "Certainly!".
- No sci-fi language, futuristic speak, or game-like commentary.
- Write like a real grassroots football club media officer would.
- Use emojis sparingly but effectively.
- If a player is mentioned in the prompt, refer to them by name or nickname.
- Sound authentic - supporters should feel this was written by someone who cares about the club.
`;

// AI timeout in milliseconds (30 seconds)
const AI_TIMEOUT_MS = 30000;

// Maximum retry attempts for transient failures
const MAX_RETRIES = 2;

// Delay between retries (with exponential backoff)
const RETRY_DELAY_MS = 1000;

/**
 * Custom error for AI-related failures
 */
class AIError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Fetch with timeout support
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// AI invocation via Vercel serverless function with timeout and retry
const invokeAi = async (
  clubId: string,
  prompt: string,
  action: string,
  model = 'gemini-2.0-flash'
): Promise<string> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add exponential backoff delay for retries
      if (attempt > 0) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[AI] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms delay`);
        await sleep(delay);
      }

      const response = await fetchWithTimeout(
        '/api/ai-generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model,
            provider: AI_PROVIDER,
            clubId,
            action,
          }),
        },
        AI_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}`;

        // Check if error is retryable (5xx server errors, rate limits)
        const isRetryable =
          response.status >= 500 || response.status === 429;

        throw new AIError(
          errorMessage,
          getAIErrorMessage(response.status, errorMessage),
          isRetryable
        );
      }

      const data = await response.json();
      if (!data?.text) {
        throw new AIError(
          'Empty response from AI',
          'AI returned an empty response. Please try again.',
          true
        );
      }

      return data.text as string;
    } catch (error) {
      lastError = error as Error;

      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn(`[AI] Request timed out after ${AI_TIMEOUT_MS}ms`);
        lastError = new AIError(
          'AI request timed out',
          'The AI is taking too long to respond. Please try again in a moment.',
          true
        );
      }

      // Check if we should retry
      if (error instanceof AIError && !error.isRetryable) {
        break; // Non-retryable error, stop immediately
      }

      // Log retry attempt
      if (attempt < MAX_RETRIES) {
        console.warn(`[AI] Attempt ${attempt + 1} failed:`, error);
      }
    }
  }

  // All retries exhausted
  console.error('[AI] All retry attempts failed:', lastError);

  if (lastError instanceof AIError) {
    return lastError.userMessage;
  }

  return 'AI is temporarily unavailable. Please try again in a few moments.';
};

/**
 * Get user-friendly error message based on HTTP status and error details
 */
const getAIErrorMessage = (status: number, errorDetails: string): string => {
  switch (status) {
    case 401:
    case 403:
      return 'AI authentication failed. Please check your API configuration.';
    case 429:
      return 'AI rate limit reached. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'AI service is temporarily unavailable. Please try again shortly.';
    case 504:
      return 'AI request timed out. Please try a shorter request.';
    default:
      if (errorDetails.toLowerCase().includes('quota')) {
        return 'AI usage quota exceeded. Please check your billing settings.';
      }
      if (errorDetails.toLowerCase().includes('invalid')) {
        return 'Invalid AI request. Please try different content.';
      }
      return 'AI generation failed. Please try again.';
  }
};

export const generateContent = async (
  club: Club,
  fixture: Fixture,
  type: ContentType,
  extraContext?: GenerationContext
): Promise<string> => {
  const matchDetails = `
Opponent: ${fixture.opponent}
Venue: ${fixture.venue}
Kickoff: ${formatDate(fixture.kickoff_time)}
Competition: ${fixture.competition || 'League Match'}
Stakes: ${extraContext?.matchType || 'Standard League Match'}
`;

  let specificPrompt = '';

  if (type === 'PREVIEW') {
    specificPrompt = `
Task: Write a 200-word match preview.
Match: ${matchDetails}
Context: Hype up the game. Mention our captain ${club.players.find((p) => p.is_captain)?.name || 'the captain'} leading the lines.
Call to Action: Get the fans down to the ground.
`;
  } else if (type === 'REPORT') {
    const isHome = fixture.venue === 'Home';
    const ourScore = isHome ? fixture.result_home : fixture.result_away;
    const theirScore = isHome ? fixture.result_away : fixture.result_home;
    const result =
      (ourScore || 0) > (theirScore || 0) ? 'WIN' : ourScore === theirScore ? 'DRAW' : 'LOSS';

    const scorersText =
      fixture.scorers && fixture.scorers.length > 0
        ? `Goalscorers: ${fixture.scorers.join(', ')}`
        : 'No specific scorers recorded.';

    let statsText = '';
    if (fixture.stats) {
      statsText = `
Stats:
- Possession: ${isHome ? fixture.stats.home_possession : fixture.stats.away_possession}% (Us) vs ${isHome ? fixture.stats.away_possession : fixture.stats.home_possession}% (Them)
- Shots: ${isHome ? fixture.stats.home_shots : fixture.stats.away_shots} (Us) vs ${isHome ? fixture.stats.away_shots : fixture.stats.home_shots} (Them)
`;
    }

    specificPrompt = `
Task: Write a 250-word match report.
Match: ${matchDetails}
Result: ${result} (${ourScore}-${theirScore})
Notes: ${fixture.key_events || ''}
Man of the Match: ${extraContext?.motm || 'Not specified'}
Game Vibe: ${extraContext?.vibe || 'Standard'}
Manager Quote: "${extraContext?.managerQuote || 'We go again next week.'}"
${scorersText}
${statsText}

Narrative: Focus on the result, individual performances, and use the stats to back up the story (e.g. if we had low possession but won, call it a "smash and grab" or "defensive masterclass").
`;
  } else if (type === 'SOCIAL') {
    specificPrompt = `
Task: Write 3 distinct social media posts (Twitter/X style) for this game.
1. Pre-match hype.
2. Line-up announcement teaser.
3. ${fixture.status === 'COMPLETED' ? 'Full time score graphic text' : 'Kick-off reminder'}.

Match: ${matchDetails}
`;
  } else if (type === 'GRAPHIC_COPY') {
    specificPrompt = `
Task: Provide 3 short, punchy lines of text to be placed on a graphic image designed by a human designer.
Context: ${extraContext?.matchType || 'Matchday'}
Match: ${matchDetails}

Output format:
1. Main Headline (e.g. "DERBY DAY", "CLASH OF TITANS")
2. Sub-headline (e.g. "It all comes down to this.")
3. Footer detail (e.g. "KO 15:00 | THE CITADEL")
`;
  } else {
    specificPrompt = `Task: Generate content of type ${type}.\nMatch: ${matchDetails}`;
  }

  const prompt = `${getCommonSystemPrompt(club)}\n\n${specificPrompt}`;
  return await invokeAi(club.id, prompt, `generate_content:${type}`);
};

export const rewriteContent = async (club: Club, originalText: string, instruction: string): Promise<string> => {
  const prompt = `
Role: Senior Editor.
Task: Rewrite the following content based on this instruction: "${instruction}".

Original Content:
"${originalText}"

Constraints:
- Maintain the club's tone: ${club.tone_context}.
- Keep the factual details (dates, names, scores) accurate.
- Return ONLY the rewritten text.
`;
  return await invokeAi(club.id, prompt, 'rewrite_content');
};

/** Extended context for AI chat with full app data */
export interface AIChatContext {
  fixtures?: Fixture[];
  contentItems?: { id: string; type: string; status: string; fixture_id?: string; title?: string }[];
  sponsors?: { name: string; tier: string; status: string; value: string; sector: string }[];
}

export const chatWithAi = async (
  club: Club,
  message: string,
  history: { role: string; content: string }[] = [],
  context?: AIChatContext
): Promise<string> => {
  // Get current date for natural language date parsing
  const today = new Date();
  const currentDateContext = `Today is ${today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;

  // Build fixtures context
  const upcomingFixtures = context?.fixtures
    ?.filter(f => f.status === 'SCHEDULED')
    ?.slice(0, 5)
    ?.map(f => {
      const date = new Date(f.kickoff_time);
      return `- vs ${f.opponent} (${f.venue}) - ${date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    })
    ?.join('\n') || 'No upcoming fixtures scheduled.';

  const recentResults = context?.fixtures
    ?.filter(f => f.status === 'COMPLETED')
    ?.slice(0, 5)
    ?.map(f => {
      const isHome = f.venue === 'Home';
      const ourScore = isHome ? f.result_home : f.result_away;
      const theirScore = isHome ? f.result_away : f.result_home;
      const result = (ourScore || 0) > (theirScore || 0) ? 'W' : ourScore === theirScore ? 'D' : 'L';
      return `- ${result} ${ourScore}-${theirScore} vs ${f.opponent}${f.scorers?.length ? ` (${f.scorers.join(', ')})` : ''}`;
    })
    ?.join('\n') || 'No recent results.';

  // Build content context
  const contentSummary = context?.contentItems
    ? `- Drafts: ${context.contentItems.filter(c => c.status === 'DRAFT').length}
- Approved (ready to post): ${context.contentItems.filter(c => c.status === 'APPROVED').length}
- Published: ${context.contentItems.filter(c => c.status === 'PUBLISHED').length}`
    : 'Content data not available.';

  const draftContent = context?.contentItems
    ?.filter(c => c.status === 'DRAFT')
    ?.slice(0, 5)
    ?.map(c => `- ${c.type}${c.title ? `: ${c.title}` : ''}`)
    ?.join('\n') || 'None';

  const approvedContent = context?.contentItems
    ?.filter(c => c.status === 'APPROVED')
    ?.slice(0, 5)
    ?.map(c => `- ${c.type}${c.title ? `: ${c.title}` : ''}`)
    ?.join('\n') || 'None';

  // Build sponsors context
  const sponsorsList = context?.sponsors
    ?.map(s => `- ${s.name} (${s.tier} tier, ${s.status}) - ${s.value}/year - ${s.sector}`)
    ?.join('\n') || 'No sponsors data available.';

  const systemInstruction = `
You are "The Gaffer" - a friendly, knowledgeable assistant for ${club.name} football club.

${currentDateContext}

YOUR PERSONALITY:
- Speak naturally like a helpful colleague at a football club
- Be warm, direct, and professional - no robotic or sci-fi language
- You know football inside out
- Keep responses concise but useful
- When asked about data, use the REAL data provided below - never make things up

WHAT YOU CAN DO:
1. ANSWER QUESTIONS: Use the real data below to answer questions about fixtures, content, sponsors, players
2. ANALYZE: Provide insights based on actual squad, results, and content status
3. CREATE CONTENT: Draft tweets, announcements, reports based on real data
4. EXECUTE ACTIONS: Create fixtures, add players, manage sponsors when asked

=== REAL CLUB DATA (USE THIS - DO NOT INVENT DATA) ===

SQUAD (${club.players.length} players):
${club.players.map((p) => `- ${p.name} (#${p.number}, ${p.position}, Form: ${p.form?.toFixed(1) || '5.0'})`).join('\n')}

UPCOMING FIXTURES:
${upcomingFixtures}

RECENT RESULTS:
${recentResults}

CONTENT STATUS:
${contentSummary}

Content in Draft:
${draftContent}

Content Approved (ready to post):
${approvedContent}

SPONSORS:
${sponsorsList}

=== END OF REAL DATA ===

ACTION DETECTION:
When the user asks you to CREATE, ADD, UPDATE, CHANGE, DELETE, or REMOVE something in the system, include an "action" object in your response.

AVAILABLE ACTIONS:
- CREATE_FIXTURE: Schedule a new match (opponent, date/time, venue, competition)
- UPDATE_FIXTURE: Record result or update match details (opponent, scores, scorers)
- DELETE_FIXTURE: Cancel a scheduled match
- CREATE_PLAYER: Add player to squad (name, position, number)
- UPDATE_PLAYER: Update player details (name, form, stats)
- DELETE_PLAYER: Remove player from squad
- CREATE_SPONSOR: Add new sponsor (name, sector, tier, annual_value)
- UPDATE_SPONSOR: Update sponsorship (tier, value)
- DELETE_SPONSOR: End sponsorship partnership
- CREATE_CONTENT: Save drafted content (type, body)
- UPDATE_CONTENT: Change content status (DRAFT/APPROVED/PUBLISHED)

DATE PARSING:
- "next Saturday" = the coming Saturday from today
- "this weekend" = the upcoming Saturday or Sunday
- "tomorrow" = the day after today
- Always convert to ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
- Default time is 15:00 if not specified
- Default venue is "Home" if not specified

RESPONSE FORMAT:
You MUST respond with ONLY valid JSON in this exact format:
{
  "response": "Your friendly conversational message here",
  "action": {
    "type": "CREATE_FIXTURE",
    "confidence": "high",
    "summary": "Create home fixture vs Arsenal on Saturday at 3pm",
    "data": {
      "opponent": "Arsenal",
      "kickoff_time": "2024-01-27T15:00:00",
      "venue": "Home",
      "competition": "League Match"
    }
  }
}

RULES:
1. If NO action is needed, omit the "action" field entirely: {"response": "Your message here"}
2. ALWAYS include a friendly "response" message
3. Set confidence to "high" for clear requests, "medium" if inferring details, "low" if uncertain
4. If details are missing or unclear, ask for clarification in your response (no action)
5. For result updates: use opponent name to identify the fixture
6. CRITICAL: When asked about fixtures, content, or sponsors - use the REAL DATA above. Never invent sponsors or fixtures.
7. You CAN create tables using markdown when asked - use | for columns
8. If data is not available (shows "not available"), say so honestly rather than making things up

EXAMPLES:

User: "How's the squad looking?"
Response: {"response": "Looking solid! Based on current form, Marcus Thorn is leading the way at 8.5, and the midfield core of De Bruyne and Modrić is in excellent shape..."}

User: "How many pieces of content are pending review?"
Response: {"response": "You have 3 pieces of content in draft that need review, and 2 approved pieces ready to post. Want me to list them?"}

User: "Show me our sponsors"
Response: {"response": "Here are your current sponsors:\\n\\n| Sponsor | Tier | Status | Value |\\n|---------|------|--------|-------|\\n| TechPro Solutions | Platinum | Active | £150k |\\n..."}

User: "Schedule a home game against Liverpool next Saturday at 3pm"
Response: {"response": "I'll set that up for you.", "action": {"type": "CREATE_FIXTURE", "confidence": "high", "summary": "Home fixture vs Liverpool on Saturday 3pm", "data": {"opponent": "Liverpool", "kickoff_time": "2024-01-27T15:00:00", "venue": "Home", "competition": "League Match"}}}

User: "We beat Arsenal 3-1, Thorn scored twice and Bones got one"
Response: {"response": "Great result! Recording that now.", "action": {"type": "UPDATE_FIXTURE", "confidence": "high", "summary": "3-1 win vs Arsenal", "data": {"opponent": "Arsenal", "result_home": 3, "result_away": 1, "scorers": ["Marcus Thorn", "Marcus Thorn", "Billy Bones"]}}}
`;

  const historyText =
    history.length > 0
      ? history.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n\n')
      : '';

  const prompt =
    historyText.length > 0
      ? `${systemInstruction}\n\nPrevious conversation:\n${historyText}\n\nUser: ${message}\n\nRespond with JSON only:`
      : `${systemInstruction}\n\nUser: ${message}\n\nRespond with JSON only:`;

  return await invokeAi(club.id, prompt, 'chat');
};

export const generatePlayerAnalysis = async (club: Club, player: Player): Promise<string> => {
  const prompt = `
Role: Chief Football Scout at a top-tier high-performance academy.
Task: Generate a comprehensive "Deep Dive" scouting report for: ${player.name} (${player.position}, #${player.number}).

Player Bio-Metrics (0-99 scale):
- Pace: ${player.stats.pace}
- Shooting: ${player.stats.shooting}
- Passing: ${player.stats.passing}
- Dribbling: ${player.stats.dribbling}
- Defending: ${player.stats.defending}
- Physical: ${player.stats.physical}

Current Form Index: ${player.form}/10.
${player.narrative_tags && player.narrative_tags.length > 0 ? `Narrative Tags: ${player.narrative_tags.join(', ')}` : ''}

Output Format:
[TACTICAL PROFILE]
[KEY STRENGTHS]
[AREAS FOR DEVELOPMENT]
[VERDICT]

Tone: Clinical, data-driven, professional football analysis. Avoid generic filler.
`;
  return await invokeAi(club.id, prompt, 'player_analysis');
};

export const generateOpponentReport = async (club: Club, opponentName: string): Promise<string> => {
  const prompt = `
Role: Chief Scout for ${club.name}.
Task: Provide a high-stakes, tactical analysis of upcoming opponent: "${opponentName}".
Context: We need to know their likely playstyle, key threats (invent 1-2 key players for them), and recommended counter-tactics for our team.
Tone: Professional, military-style briefing. Concise and actionable.
Format: Return as Markdown.
- **Threat Level**: [Low/Medium/High]
- **Key Intel**: [Analysis]
- **Suggested Tactic**: [Recommendation]
`;
  return await invokeAi(club.id, prompt, 'opponent_report');
};

export const suggestScorers = async (club: Club, opponent: string, myScore: number, notes: string): Promise<string[]> => {
  const prompt = `
Role: Football Analyst.
Context: The match ended. We scored ${myScore} goals against ${opponent}.
Notes provided by admin: "${notes}".

Squad:
${club.players.map((p) => `- ${p.name} (${p.position}, Form: ${p.form})`).join('\n')}

Task:
1. If specific scorers are mentioned in the notes (even by nickname or part of name), extract their full names from the squad list.
2. If NOT mentioned, predict the most likely scorers based on the number of goals (${myScore}) and player form/position.
3. Do not suggest more players than goals scored.

Output: A JSON array containing ONLY the names of the players from the squad list who scored.
Example: ["Marcus Thorn", "Billy Bones"]
`;

  const text = await invokeAi(club.id, prompt, 'suggest_scorers');
  try {
    const jsonStr = extractJson(text);
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
};

// --- OPS / ADMIN AI FUNCTIONS (all routed through ai-generate) ---

export const generateSponsorReport = async (club: Club, sponsor: Sponsor, recentResults: string): Promise<string> => {
  const prompt = `
Role: Commercial Director of ${club.name}.
Task: Draft an email to our partner, ${sponsor.name}.
Goal: Prove value of the sponsorship (${sponsor.tier} Tier) ahead of contract renewal/review.

Key Info:
- Recent Performance: ${recentResults}
- Sponsor Sector: ${sponsor.sector}
- Tone: Professional, grateful, but confident about the club's growth.

Structure:
- Subject Line
- Warm greeting
- Highlight of recent club success (connect it to their brand exposure)
- Call to action (schedule a review meeting)
`;
  return await invokeAi(club.id, prompt, 'sponsor_report');
};

export const generateSponsorActivation = async (club: Club, sponsor: Sponsor): Promise<string> => {
  const prompt = `
Role: Creative Marketing Agency for Football Club: ${club.name}.
Task: Suggest 3 creative sponsorship activation ideas for our partner: ${sponsor.name}.

Partner Context:
- Sector: ${sponsor.sector}
- Tier: ${sponsor.tier}

Output:
Provide 3 distinct ideas. For each, include:
1. The Hook (Catchy Title)
2. The Concept (What happens?)
3. The Value (Why the sponsor will love it)
`;
  return await invokeAi(club.id, prompt, 'sponsor_activation');
};

export const generateRenewalPitch = async (club: Club, sponsor: Sponsor): Promise<string> => {
  const prompt = `
Role: Club Chairman.
Task: Write a high-stakes negotiation email for ${sponsor.name}.
Goal: Pitch a contract renewal and upsell them to the next Tier (or increase value).

Context:
- Current Status: ${sponsor.status}
- Current Value: ${sponsor.value}

Strategy:
- Thank them for the current partnership.
- Create "FOMO" by hinting at club growth and other interest.
- Propose a 20% increase in investment for "Exclusive Digital Rights".

Tone: Persuasive, exclusive, ambitious.
`;
  return await invokeAi(club.id, prompt, 'renewal_pitch');
};


export const generateNewsArticle = async (club: Club, title: string, details: string): Promise<{ article: string; social: string }> => {
  const prompt = `
You are the Media Officer for ${club.name} (${club.nickname}).

TASK: Write an official club news article and matching social media post.

TOPIC TYPE: ${title}
KEY DETAILS: ${details}

CLUB TONE: ${club.tone_context}

ARTICLE REQUIREMENTS:
- 150-250 words
- Professional football club news style
- Include a strong opening hook
- Reference the club by name where appropriate
- End with a call-to-action or forward-looking statement

SOCIAL POST REQUIREMENTS:
- Twitter/X style (max 280 chars)
- Include 2-3 relevant emojis
- Include relevant hashtags
- Make it shareable and engaging

CRITICAL: You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{"article": "Your article text here with proper paragraphs...", "social": "Your social caption here 🔥 #Hashtag"}
`;

  const text = await invokeAi(club.id, prompt, 'news_article');
  try {
    const jsonStr = extractJson(text);
    const parsed = JSON.parse(jsonStr);
    if (parsed.article && parsed.social) {
      return parsed;
    }
    throw new Error('Invalid structure');
  } catch (error) {
    console.error('News article JSON parse error:', error, 'Raw:', text);
    // Fallback: if we got text but couldn't parse JSON, use it as article
    if (text && text.length > 50 && !text.includes('Error')) {
      return {
        article: text,
        social: `📰 News from ${club.name}! Check our website for the full story. #${club.name.replace(/\s+/g, '')}`
      };
    }
    return { article: 'Generation failed. Please try again.', social: 'Generation failed.' };
  }
};

export const generateNewsletter = async (club: Club, highlights: string[]): Promise<string> => {
  const primaryColor = club.primary_color || '#10b981';
  const secondaryColor = club.secondary_color || '#1e293b';

  const prompt = `
You are the Newsletter Editor for ${club.name} (${club.nickname}).

TASK: Create a beautifully formatted weekly fan newsletter.

CLUB BRAND COLORS:
- Primary: ${primaryColor}
- Secondary: ${secondaryColor}

HIGHLIGHTS TO COVER:
${highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

CLUB TONE: ${club.tone_context}

FORMAT REQUIREMENTS:
Generate HTML with inline styles. Use this structure:

1. HEADER SECTION
   - Club name as main title styled with primary color
   - "WEEKLY BRIEFING" subtitle
   - Current week indicator

2. MAIN CONTENT
   - Each highlight gets its own section with:
     - Bold heading styled with primary color
     - 2-3 sentences of engaging content
     - Use <hr> dividers between sections

3. SIGN-OFF
   - Encouraging message to fans
   - "See you at the ground!" or similar

STYLING RULES:
- Use inline CSS only (style="...")
- Primary color (${primaryColor}) for: headings, borders, accent elements
- Use bold (<strong>) for emphasis
- Add padding and margins for readability
- Font: system-ui, sans-serif

EXAMPLE OUTPUT FORMAT:
<div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
  <h1 style="color: ${primaryColor}; margin-bottom: 5px;">${club.name}</h1>
  <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Weekly Briefing</p>
  <hr style="border: none; border-top: 2px solid ${primaryColor}; margin: 20px 0;">

  <h2 style="color: ${primaryColor}; font-size: 18px;">📰 Headline Here</h2>
  <p style="color: #334155; line-height: 1.6;">Content paragraph...</p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

  <p style="color: ${primaryColor}; font-weight: bold; text-align: center;">See you at the ground! 💪</p>
</div>

Generate the complete newsletter HTML now. Only output the HTML, no explanation.
`;

  const result = await invokeAi(club.id, prompt, 'newsletter');

  // If AI didn't wrap in a container div, wrap it
  if (!result.trim().startsWith('<div')) {
    return `<div style="font-family: system-ui, sans-serif; line-height: 1.6;">${result}</div>`;
  }

  return result;
};

// --- CONTENT TEMPLATES ---

export type ContentTemplate = 'match_report' | 'player_signing' | 'training_update';
export type ContentTone = 'normal' | 'formal' | 'casual';

export interface TemplateContext {
  // Match Report
  opponent?: string;
  score?: string;
  scorers?: string[];
  venue?: string;
  competition?: string;
  highlights?: string;
  manOfTheMatch?: string;

  // Player Signing
  playerName?: string;
  position?: string;
  previousClub?: string;
  contractLength?: string;
  transferFee?: string;
  shirtNumber?: string;

  // Training Update
  sessionType?: string;
  focusArea?: string;
  playerUpdates?: string;
  injuryNews?: string;
  managerQuotes?: string;
}

const getTemplatePrompt = (
  club: Club,
  template: ContentTemplate,
  context: TemplateContext,
  tone: ContentTone = 'normal'
): string => {
  const toneGuide = {
    normal: 'Professional but warm, like a club media officer writing for fans',
    formal: 'Official and professional, suitable for press releases and formal announcements',
    casual: 'Friendly and conversational, like chatting with supporters at the bar',
  };

  const baseContext = `
You are the Media Officer for ${club.name} (${club.nickname}).
Club tone: ${club.tone_context}
Writing style: ${toneGuide[tone]}

IMPORTANT RULES:
- Write like a real grassroots/non-league football club
- Sound authentic - like this was written by someone who works at the club
- No futuristic language, no sci-fi references, no "systems online" speak
- Use football terminology naturally
- Be genuine and relatable to supporters
`;

  if (template === 'match_report') {
    return `${baseContext}

TASK: Write a match report for our official website/social media.

MATCH DETAILS:
- Opponent: ${context.opponent || '[Opponent]'}
- Score: ${context.score || '[Score]'}
- Scorers: ${context.scorers?.join(', ') || 'None recorded'}
- Venue: ${context.venue || 'Home'}
- Competition: ${context.competition || 'League'}
${context.manOfTheMatch ? `- Man of the Match: ${context.manOfTheMatch}` : ''}
${context.highlights ? `- Key moments: ${context.highlights}` : ''}

OUTPUT FORMAT:
Write a 200-250 word match report that:
1. Opens with the result and overall narrative (dominant win, hard-fought draw, tough defeat, etc.)
2. Highlights key moments and goalscorers
3. Mentions standout performers
4. Ends with what's next for the team

Sound like a real club - not a fantasy game. Supporters should read this and feel connected to their team.
`;
  }

  if (template === 'player_signing') {
    return `${baseContext}

TASK: Write a player signing announcement for social media and website.

SIGNING DETAILS:
- Player Name: ${context.playerName || '[Player Name]'}
- Position: ${context.position || '[Position]'}
- Previous Club: ${context.previousClub || 'Undisclosed'}
${context.contractLength ? `- Contract: ${context.contractLength}` : ''}
${context.shirtNumber ? `- Shirt Number: #${context.shirtNumber}` : ''}
${context.transferFee ? `- Fee: ${context.transferFee}` : ''}

OUTPUT FORMAT:
Write a signing announcement (150-200 words) that:
1. Welcomes the player to the club
2. Briefly mentions their background/previous clubs
3. Includes a quote from the manager about why they're excited
4. Includes a quote from the player about joining
5. Notes their squad number if provided

Keep it professional but exciting - this is news supporters want to hear. Sound like a real club announcement, not a video game transfer.
`;
  }

  if (template === 'training_update') {
    return `${baseContext}

TASK: Write a training ground update for social media/website.

TRAINING DETAILS:
- Session Type: ${context.sessionType || 'Regular training'}
- Focus: ${context.focusArea || 'General preparation'}
${context.playerUpdates ? `- Player news: ${context.playerUpdates}` : ''}
${context.injuryNews ? `- Injury updates: ${context.injuryNews}` : ''}
${context.managerQuotes ? `- Manager said: "${context.managerQuotes}"` : ''}

OUTPUT FORMAT:
Write a training update (100-150 words) that:
1. Sets the scene - what the squad has been working on
2. Mentions any returning players or fitness updates
3. Builds anticipation for the next match
4. Keeps fans engaged with behind-the-scenes feel

This should feel like a peek behind the curtain for supporters. Authentic, not scripted.
`;
  }

  return baseContext;
};

/**
 * Generate content from a template with specific context
 */
export const generateFromTemplate = async (
  club: Club,
  template: ContentTemplate,
  context: TemplateContext,
  tone: ContentTone = 'normal'
): Promise<string> => {
  const prompt = getTemplatePrompt(club, template, context, tone);
  return await invokeAi(club.id, prompt, `template:${template}`);
};

/**
 * Get available content templates with descriptions
 */
export const getContentTemplates = (): { id: ContentTemplate; label: string; description: string; icon: string }[] => [
  {
    id: 'match_report',
    label: 'Match Report',
    description: 'Full-time report for website and social media',
    icon: 'clipboard',
  },
  {
    id: 'player_signing',
    label: 'Player Signing',
    description: 'New player announcement with quotes',
    icon: 'user-plus',
  },
  {
    id: 'training_update',
    label: 'Training Update',
    description: 'Behind-the-scenes training ground news',
    icon: 'dumbbell',
  },
];

// --- IMAGE GENERATION (Imagen 3) ---

export interface ImageGenerationResult {
  imageBase64: string;
  mimeType: string;
  description?: string;
}

export type ImageGenerationType =
  | 'matchday_graphic'
  | 'player_card'
  | 'social_post'
  | 'announcement'
  | 'celebration'
  | 'custom';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// Image generation timeout (60 seconds - images take longer)
const IMAGE_TIMEOUT_MS = 60000;

// Image generation via Vercel serverless function (uses Imagen 3) with timeout and retry
const invokeImageAi = async (
  clubId: string,
  prompt: string,
  action: string,
  referenceImageBase64?: string,
  referenceMimeType?: string,
  aspectRatio: AspectRatio = '1:1'
): Promise<ImageGenerationResult> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add delay for retries
      if (attempt > 0) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[Image AI] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms delay`);
        await sleep(delay);
      }

      const response = await fetchWithTimeout(
        '/api/ai-generate-image',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            referenceImageBase64,
            referenceMimeType,
            clubId,
            action,
            aspectRatio,
          }),
        },
        IMAGE_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}`;
        const isRetryable = response.status >= 500 || response.status === 429;

        throw new AIError(
          errorMessage,
          getImageErrorMessage(response.status, errorMessage),
          isRetryable
        );
      }

      const data = await response.json();
      if (!data?.imageBase64) {
        throw new AIError(
          'Empty image response',
          'Image generation returned no data. Please try again.',
          true
        );
      }

      return {
        imageBase64: data.imageBase64,
        mimeType: data.mimeType || 'image/png',
        description: data.description,
      };
    } catch (error) {
      lastError = error as Error;

      // Handle timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.warn(`[Image AI] Request timed out after ${IMAGE_TIMEOUT_MS}ms`);
        lastError = new AIError(
          'Image generation timed out',
          'Image generation is taking too long. Please try a simpler design or try again later.',
          true
        );
      }

      // Check if retryable
      if (error instanceof AIError && !error.isRetryable) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        console.warn(`[Image AI] Attempt ${attempt + 1} failed:`, error);
      }
    }
  }

  // All retries exhausted - throw the error so callers can handle it
  console.error('[Image AI] All retry attempts failed:', lastError);

  if (lastError instanceof AIError) {
    throw new Error(lastError.userMessage);
  }

  throw new Error('Image generation failed. Please try again.');
};

/**
 * Get user-friendly error message for image generation failures
 */
const getImageErrorMessage = (status: number, errorDetails: string): string => {
  switch (status) {
    case 400:
      if (errorDetails.toLowerCase().includes('safety')) {
        return 'Image request was blocked for safety reasons. Please try different content.';
      }
      return 'Invalid image request. Please try different content.';
    case 429:
      return 'Image generation rate limit reached. Please wait and try again.';
    case 500:
    case 502:
    case 503:
      return 'Image service is temporarily unavailable. Please try again shortly.';
    default:
      return 'Image generation failed. Please try again.';
  }
};

export const generateMatchdayGraphic = async (
  club: Club,
  fixture: Fixture,
  style: 'hype' | 'minimal' | 'retro' | 'neon' = 'minimal'
): Promise<ImageGenerationResult> => {
  const matchDate = new Date(fixture.kickoff_time);
  const formattedDate = matchDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = matchDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const styleGuides: Record<string, string> = {
    hype: 'bold, dynamic, high-energy with dramatic lighting, motion blur effects, and intense colors',
    minimal: 'clean, modern, minimalist design with lots of white space, simple typography',
    retro: 'vintage football poster style, textured paper effect, classic typography, muted warm colors',
    neon: 'modern sports design, bold typography, dark background with vibrant accent colors, professional',
  };

  const prompt = `
Create a professional matchday announcement graphic for a football club.

CLUB: ${club.name} (${club.nickname})
OPPONENT: ${fixture.opponent}
VENUE: ${fixture.venue === 'Home' ? club.name + ' Stadium' : 'Away'}
DATE: ${formattedDate}
KICKOFF: ${formattedTime}
COMPETITION: ${fixture.competition || 'League Match'}

DESIGN STYLE: ${styleGuides[style]}

PRIMARY COLOR: ${club.primary_color}
SECONDARY COLOR: ${club.secondary_color}

Requirements:
- Include both team names prominently
- Show date and kickoff time clearly
- Add "MATCHDAY" or similar header text
- Make it suitable for social media (Instagram/Twitter)
- Professional sports graphic quality
- NO real player faces or photos
- Use abstract football imagery, geometric shapes, or silhouettes
`.trim();

  // Use 1:1 for Instagram, best for social media
  return await invokeImageAi(club.id, prompt, `generate_matchday_graphic:${style}`, undefined, undefined, '1:1');
};

export const generateResultGraphic = async (
  club: Club,
  fixture: Fixture
): Promise<ImageGenerationResult> => {
  if (fixture.status !== 'COMPLETED' || fixture.result_home === undefined || fixture.result_away === undefined) {
    throw new Error('Fixture must be completed with results to generate result graphic.');
  }

  const isHome = fixture.venue === 'Home';
  const ourScore = isHome ? fixture.result_home : fixture.result_away;
  const theirScore = isHome ? fixture.result_away : fixture.result_home;
  const result = ourScore > theirScore ? 'WIN' : ourScore === theirScore ? 'DRAW' : 'LOSS';

  const resultEmoji = result === 'WIN' ? '🏆' : result === 'DRAW' ? '🤝' : '';
  const scorersText = fixture.scorers?.length ? fixture.scorers.join(', ') : '';

  const prompt = `
Create a professional full-time result graphic for a football match.

CLUB: ${club.name}
OPPONENT: ${fixture.opponent}
FINAL SCORE: ${club.name} ${ourScore} - ${theirScore} ${fixture.opponent}
RESULT: ${result}
${scorersText ? `SCORERS: ${scorersText}` : ''}
${fixture.man_of_the_match ? `MAN OF THE MATCH: ${fixture.man_of_the_match}` : ''}
COMPETITION: ${fixture.competition || 'League'}

DESIGN STYLE: Modern sports design with ${result === 'WIN' ? 'celebratory, triumphant' : result === 'DRAW' ? 'neutral, balanced' : 'determined, resilient'} mood.

PRIMARY COLOR: ${club.primary_color}
SECONDARY COLOR: ${club.secondary_color}

Requirements:
- Large, bold score display
- "FULL TIME" or "FT" header
- ${result === 'WIN' ? 'Victory celebration elements' : 'Professional presentation'}
- Suitable for social media sharing
- NO real player faces - use silhouettes or abstract shapes
`.trim();

  return await invokeImageAi(club.id, prompt, 'generate_result_graphic', undefined, undefined, '1:1');
};

export const generatePlayerSpotlight = async (
  club: Club,
  player: Player
): Promise<ImageGenerationResult> => {
  const prompt = `
Create a professional player spotlight/stats card graphic.

CLUB: ${club.name}
PLAYER: ${player.name}
POSITION: ${player.position}
NUMBER: #${player.number}
${player.is_captain ? 'CAPTAIN: Yes (include captain armband symbol)' : ''}

STATS (0-99 scale):
- Pace: ${player.stats.pace}
- Shooting: ${player.stats.shooting}
- Passing: ${player.stats.passing}
- Dribbling: ${player.stats.dribbling}
- Defending: ${player.stats.defending}
- Physical: ${player.stats.physical}

FORM: ${player.form}/10

DESIGN STYLE: Modern sports card aesthetic, clean design, dark background with vibrant accents.

PRIMARY COLOR: ${club.primary_color}
SECONDARY COLOR: ${club.secondary_color}

Requirements:
- Player silhouette or abstract representation (NO real face)
- Hexagonal or radar-style stats visualization
- Player name and number prominently displayed
- Club branding incorporated
- Trading card / FIFA-style layout
`.trim();

  // Portrait style for player cards
  return await invokeImageAi(club.id, prompt, 'generate_player_spotlight', undefined, undefined, '3:4');
};

export const generateAnnouncementGraphic = async (
  club: Club,
  title: string,
  subtitle: string,
  type: 'signing' | 'news' | 'event' | 'achievement' = 'news'
): Promise<ImageGenerationResult> => {
  const typeStyles: Record<string, string> = {
    signing: 'exciting reveal style, dramatic lighting, "WELCOME" or "SIGNED" header',
    news: 'clean news bulletin style, professional journalism aesthetic',
    event: 'invitation/promotional style, festive or exciting mood',
    achievement: 'trophy/celebration style, golden accents, triumphant mood',
  };

  const prompt = `
Create a professional announcement graphic for a football club.

CLUB: ${club.name}
HEADLINE: ${title}
SUBTEXT: ${subtitle}
TYPE: ${type.toUpperCase()}

DESIGN STYLE: ${typeStyles[type]}. Modern professional sports aesthetic.

PRIMARY COLOR: ${club.primary_color}
SECONDARY COLOR: ${club.secondary_color}

Requirements:
- Bold, attention-grabbing headline
- Club branding visible
- Suitable for social media (square or 16:9)
- Professional sports media quality
- NO real photographs - use abstract/geometric design
`.trim();

  return await invokeImageAi(club.id, prompt, `generate_announcement:${type}`, undefined, undefined, '1:1');
};

export interface ReferenceImage {
  base64: string;
  mimeType: string;
}

/**
 * Convert a File or Blob to base64 for use as reference image
 */
export const fileToBase64 = (file: File | Blob): Promise<ReferenceImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve({
        base64,
        mimeType: file.type || 'image/png',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateCustomImage = async (
  club: Club,
  customPrompt: string,
  referenceImage?: ReferenceImage,
  aspectRatio: AspectRatio = '1:1'
): Promise<ImageGenerationResult> => {
  const referenceContext = referenceImage
    ? `\n\nREFERENCE IMAGE PROVIDED: Use the attached image as style/layout reference. Match its visual style, composition, or color scheme as specified in the user request.`
    : '';

  const prompt = `
Create a professional graphic for football club: ${club.name} (${club.nickname})

USER REQUEST: ${customPrompt}

CLUB BRAND GUIDELINES:
- Primary Color: ${club.primary_color}
- Secondary Color: ${club.secondary_color}
- Tone: ${club.tone_context}

Requirements:
- Incorporate club colors
- Professional sports media quality
- Suitable for social media
- NO real player faces - use silhouettes or abstract representations${referenceContext}
`.trim();

  return await invokeImageAi(
    club.id,
    prompt,
    'generate_custom_image',
    referenceImage?.base64,
    referenceImage?.mimeType,
    aspectRatio
  );
};

// Video generation is intentionally not supported in the core web app build yet.
export const generatePlayerVideo = async (_club: Club, _player: Player): Promise<string | null> => {
  return null;
};

/**
 * Generate viral video content ideas for the club's social media
 */
export const generateViralIdeas = async (club: Club): Promise<string[]> => {
  const prompt = `
${getCommonSystemPrompt(club)}

Task: Generate 5 creative, viral-worthy video content ideas for ${club.name}'s social media channels.

Focus on:
- Behind-the-scenes content that fans love
- Player personality showcases
- Training ground moments
- Fan engagement concepts
- Trend-worthy formats (TikTok/Reels style)

Format: Return ONLY a JSON array of 5 strings, each being a short video idea description (max 100 chars each).
Example: ["Player challenge: keepy-uppies while answering fan questions", "Time-lapse of matchday preparation"]

IMPORTANT: Return ONLY the JSON array, no other text.
`.trim();

  try {
    const response = await invokeAi(club.id, prompt, 'generate_viral_ideas');
    // Parse the JSON response (extract from code blocks if wrapped)
    const jsonStr = extractJson(response);
    const ideas = JSON.parse(jsonStr);
    if (Array.isArray(ideas) && ideas.length > 0) {
      return ideas.slice(0, 5);
    }
    return getDefaultViralIdeas();
  } catch (error) {
    console.error('Error generating viral ideas:', error);
    return getDefaultViralIdeas();
  }
};

const getDefaultViralIdeas = (): string[] => [
  'Player Spotlight: Behind-the-scenes training session with star players',
  'Matchday Atmosphere: Pre-game fan interviews and stadium walk-through',
  'Tactical Breakdown: Animated video explaining key match moments',
  'Locker Room Cam: Post-match celebrations and team reactions',
  'Youth Academy Feature: Upcoming talent showcase and development journey'
];
