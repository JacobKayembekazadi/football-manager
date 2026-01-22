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
- No robotic AI phrases like "Here is a tweet".
- Use emojis sparingly but effectively.
- If a player is mentioned in the prompt, refer to them by name or nickname.
`;

// AI invocation via Vercel serverless function
const invokeAi = async (clubId: string, prompt: string, action: string, model = 'gemini-2.0-flash'): Promise<string> => {
  try {
    const response = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model,
        provider: AI_PROVIDER,
        clubId,
        action,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI generation failed');
    }

    const data = await response.json();
    if (!data?.text) return 'Failed to generate content.';
    return data.text as string;
  } catch (error) {
    console.error('AI invocation error:', error);
    return 'AI unavailable. Please try again.';
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

export const chatWithAi = async (
  club: Club,
  message: string,
  history: { role: string; content: string }[] = []
): Promise<string> => {
  // Get current date for natural language date parsing
  const today = new Date();
  const currentDateContext = `Today is ${today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`;

  const systemInstruction = `
You are "The Gaffer" - a friendly, knowledgeable assistant for ${club.name} football club.

${currentDateContext}

YOUR PERSONALITY:
- Speak naturally like a helpful colleague, not a robot or sci-fi character
- Be warm, direct, and professional
- You know football inside out
- Keep responses concise but useful

WHAT YOU CAN DO:
1. ADVISE: Answer questions, write content, provide analysis
2. EXECUTE ACTIONS: Create fixtures, add players, manage sponsors when asked

SQUAD CONTEXT:
${club.players.map((p) => `${p.name} (#${p.number}, ${p.position}, Form: ${p.form?.toFixed(1) || '5.0'})`).join(', ')}

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

EXAMPLES:

User: "How's the squad looking?"
Response: {"response": "Looking solid! Marcus Thorn is in great form at 8.5, and the midfield is well-balanced..."}

User: "Schedule a home game against Liverpool next Saturday at 3pm"
Response: {"response": "I'll set that up for you.", "action": {"type": "CREATE_FIXTURE", "confidence": "high", "summary": "Home fixture vs Liverpool on Saturday 3pm", "data": {"opponent": "Liverpool", "kickoff_time": "2024-01-27T15:00:00", "venue": "Home", "competition": "League Match"}}}

User: "We beat Arsenal 3-1, Thorn scored twice and Bones got one"
Response: {"response": "Great result! Recording that now.", "action": {"type": "UPDATE_FIXTURE", "confidence": "high", "summary": "3-1 win vs Arsenal", "data": {"opponent": "Arsenal", "result_home": 3, "result_away": 1, "scorers": ["Marcus Thorn", "Marcus Thorn", "Billy Bones"]}}}

User: "Add a new striker"
Response: {"response": "I can add a striker to the squad. What's their name, and what number will they wear?"}
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

// Image generation via Vercel serverless function (uses Imagen 3)
const invokeImageAi = async (
  clubId: string,
  prompt: string,
  action: string,
  referenceImageBase64?: string,
  referenceMimeType?: string,
  aspectRatio: AspectRatio = '1:1'
): Promise<ImageGenerationResult> => {
  const response = await fetch('/api/ai-generate-image', {
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
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Image generation failed');
  }

  const data = await response.json();
  if (!data?.imageBase64) throw new Error('Failed to generate image.');

  return {
    imageBase64: data.imageBase64,
    mimeType: data.mimeType || 'image/png',
    description: data.description,
  };
};

export const generateMatchdayGraphic = async (
  club: Club,
  fixture: Fixture,
  style: 'hype' | 'minimal' | 'retro' | 'neon' = 'neon'
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
    neon: 'cyberpunk aesthetic, neon glow effects, dark background with bright cyan and magenta accents, futuristic',
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

DESIGN STYLE: Cyberpunk/neon aesthetic with ${result === 'WIN' ? 'celebratory, triumphant' : result === 'DRAW' ? 'neutral, balanced' : 'determined, resilient'} mood.

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

DESIGN STYLE: Modern sports card aesthetic, cyberpunk/neon elements, dark background with glowing accents.

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

DESIGN STYLE: ${typeStyles[type]}. Cyberpunk/modern aesthetic with neon accents.

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
