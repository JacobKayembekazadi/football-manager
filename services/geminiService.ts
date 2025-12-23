import { Fixture, Club, ContentType, Player, Sponsor } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// LangSmith tracing is server-side only - Edge Function handles tracing

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
- No robotic AI phrases like "Here is a tweet".
- Use emojis sparingly but effectively.
- If a player is mentioned in the prompt, refer to them by name or nickname.
`;

// LangSmith tracing happens in Edge Function (server-side)
const invokeAi = async (clubId: string, prompt: string, action: string, model = 'gemini-2.5-flash'): Promise<string> => {
  if (!supabase || !isSupabaseConfigured()) {
    return 'AI unavailable (Supabase not configured).';
  }

  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { clubId, prompt, model, action },
  });

  if (error) throw error;
  if (!data?.text) return 'Failed to generate content.';
  return data.text as string;
};

// Note: LangSmith tracing is handled server-side in the Edge Function

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
${getCommonSystemPrompt(club)}
You are "The Gaffer", a helpful AI assistant for the club admin.
You help with writing captions, emails to sponsors, or tactical ideas.
Be brief, helpful, and stay in character as a club insider.
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

// --- IMAGE GENERATION (Gemini 2.5 Flash Image) ---

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

const invokeImageAi = traceable(
  async (
    clubId: string,
    prompt: string,
    action: string,
    referenceImageBase64?: string,
    referenceMimeType?: string
  ): Promise<ImageGenerationResult> => {
    if (!supabase || !isSupabaseConfigured()) {
      throw new Error('Image generation unavailable (Supabase not configured).');
    }

    const { data, error } = await supabase.functions.invoke('ai-generate-image', {
      body: { clubId, prompt, referenceImageBase64, referenceMimeType, action },
    });

    if (error) throw error;
    if (!data?.imageBase64) throw new Error('Failed to generate image.');
    
    return {
      imageBase64: data.imageBase64,
      mimeType: data.mimeType || 'image/png',
      description: data.description,
    };
  },
  {
    name: 'gemini_image_invoke',
    run_type: 'llm',
    metadata: {
      provider: 'google',
      model_family: 'gemini',
      output_type: 'image',
    },
  }
);

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

  return await invokeImageAi(club.id, prompt, `generate_matchday_graphic:${style}`);
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

  return await invokeImageAi(club.id, prompt, 'generate_result_graphic');
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

  return await invokeImageAi(club.id, prompt, 'generate_player_spotlight');
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

  return await invokeImageAi(club.id, prompt, `generate_announcement:${type}`);
};

export const generateCustomImage = async (
  club: Club,
  customPrompt: string
): Promise<ImageGenerationResult> => {
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
- NO real player faces - use silhouettes or abstract representations
`.trim();

  return await invokeImageAi(club.id, prompt, 'generate_custom_image');
};

// Video generation is intentionally not supported in the core web app build yet.
export const generatePlayerVideo = async (_club: Club, _player: Player): Promise<string | null> => {
  return null;
};
