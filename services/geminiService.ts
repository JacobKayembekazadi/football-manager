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
  const systemInstruction = `
You are "The Gaffer" - a friendly, knowledgeable assistant for ${club.name} football club.

YOUR PERSONALITY:
- Speak naturally like a helpful colleague, not a robot or sci-fi character
- Be warm, direct, and professional
- You know football inside out
- Keep responses concise but useful

WHAT YOU HELP WITH:
- Writing social media posts, captions, tweets
- Drafting emails to sponsors and partners
- Match analysis and tactical ideas
- Player assessments and squad planning
- Any club admin tasks

SQUAD CONTEXT:
${club.players.map((p) => `${p.name} (#${p.number}, ${p.position})`).join(', ')}

FORMATTING (use when helpful):
- **Bold** for emphasis
- Bullet points for lists
- Tables for comparisons
- Keep it scannable

IMPORTANT: Just respond helpfully. No roleplay, no dramatic intros, no sci-fi speak.
`;

  const historyText =
    history.length > 0
      ? history.map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n\n')
      : '';

  const prompt =
    historyText.length > 0
      ? `${systemInstruction}\n\nPrevious conversation:\n${historyText}\n\nUser: ${message}`
      : `${systemInstruction}\n\nUser Question: ${message}`;

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
    return JSON.parse(text);
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
Role: Media Officer.
Task: Generate a website news article and a social media caption.
Topic: ${title}
Details: ${details}
Club Tone: ${club.tone_context}

Output JSON: { "article": "...", "social": "..." }
`;
  const text = await invokeAi(club.id, prompt, 'news_article');
  try {
    return JSON.parse(text);
  } catch {
    return { article: 'Error', social: 'Error' };
  }
};

export const generateNewsletter = async (club: Club, highlights: string[]): Promise<string> => {
  const prompt = `
Role: Media Team.
Task: Write a weekly newsletter for fans.
Highlights:
${highlights.map((h) => `- ${h}`).join('\n')}

Format: HTML-ready text (paragraphs, bolding).
`;
  return await invokeAi(club.id, prompt, 'newsletter');
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
    // Parse the JSON response
    const ideas = JSON.parse(response);
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
