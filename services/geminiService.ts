
import { GoogleGenAI, Type } from "@google/genai";
import { Fixture, Club, ContentType, Player, Sponsor, AdminTask, InboxEmail } from "../types";

const apiKey = process.env.API_KEY || '';
// Initial instance (mostly for text gen where key is likely pre-set or not needing user selection in some envs)
let ai = new GoogleGenAI({ apiKey });

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getCommonSystemPrompt = (club: Club) => `
    You are the Media Officer for ${club.name} (Nicknamed: ${club.nickname}).
    Tone: ${club.tone_context}
    
    Squad Context:
    ${club.players.map(p => `#${p.number} ${p.name} (${p.position})`).join(', ')}
    
    Rules:
    - Keep it punchy and engaging.
    - No robotic AI phrases like "Here is a tweet".
    - Use emojis sparingly but effectively.
    - If a player is mentioned in the prompt, refer to them by name or nickname.
`;

interface GenerationContext {
    matchType?: string; // e.g. "Derby", "Cup Final"
    vibe?: string; // e.g. "Thriller", "Boring"
    motm?: string; // Man of the Match
    managerQuote?: string;
}

export const generateContent = async (
  club: Club, 
  fixture: Fixture, 
  type: ContentType,
  extraContext?: GenerationContext
): Promise<string> => {
  if (!apiKey) return "Error: API Key missing.";

  const model = 'gemini-2.5-flash';
  const matchDetails = `
    Opponent: ${fixture.opponent}
    Venue: ${fixture.venue}
    Kickoff: ${formatDate(fixture.kickoff_time)}
    Competition: ${fixture.competition || 'League Match'}
    Stakes: ${extraContext?.matchType || 'Standard League Match'}
  `;

  let specificPrompt = "";

  if (type === 'PREVIEW') {
    specificPrompt = `
      Task: Write a 200-word match preview.
      Match: ${matchDetails}
      Context: Hype up the game. Mention our captain ${club.players.find(p => p.is_captain)?.name || 'the captain'} leading the lines.
      Call to Action: Get the fans down to the ground.
    `;
  } else if (type === 'REPORT') {
    const isHome = fixture.venue === 'Home';
    const ourScore = isHome ? fixture.result_home : fixture.result_away;
    const theirScore = isHome ? fixture.result_away : fixture.result_home;
    const result = (ourScore || 0) > (theirScore || 0) ? "WIN" : (ourScore === theirScore) ? "DRAW" : "LOSS";
    
    const scorersText = fixture.scorers && fixture.scorers.length > 0 
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
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `${getCommonSystemPrompt(club)}\n\n${specificPrompt}`,
    });
    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content.";
  }
};

export const rewriteContent = async (club: Club, originalText: string, instruction: string): Promise<string> => {
    if (!apiKey) return "Editor unavailable.";

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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || originalText;
    } catch (e) {
        return originalText;
    }
};

export const chatWithAi = async (club: Club, message: string, history: {role: string, content: string}[] = []): Promise<string> => {
  if (!apiKey) return "Error: API Key missing.";
  
  try {
    const systemInstruction = `
      ${getCommonSystemPrompt(club)}
      You are "The Gaffer", a helpful AI assistant for the club admin. 
      You help with writing captions, emails to sponsors, or tactical ideas.
      Be brief, helpful, and stay in character as a club insider.
    `;

    // Build conversation context from history
    let conversationContext = systemInstruction;
    
    if (history.length > 0) {
      const historyText = history
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');
      conversationContext += `\n\nPrevious conversation:\n${historyText}\n\nUser: ${message}`;
    } else {
      conversationContext += `\n\nUser Question: ${message}`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversationContext,
    });
    
    return response.text || "I couldn't quite get that, gaffer.";
  } catch (e) {
    console.error(e);
    return "Tactical error. Try again.";
  }
};

export const generatePlayerAnalysis = async (player: Player): Promise<string> => {
    if (!apiKey) return "Analysis unavailable.";

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

        Output Format:
        [TACTICAL PROFILE]
        (Describe their playstyle e.g., Ball-playing defender, Box-to-box midfielder, Target man, etc. and how they fit in a modern system. Analyze their metric spread.)

        [KEY STRENGTHS]
        - (Point 1 based on highest stats)
        - (Point 2)

        [AREAS FOR DEVELOPMENT]
        - (Point 1 based on lowest stats)
        - (Point 2)

        [VERDICT]
        (One clinical sentence summary of their current status and potential)
        
        Tone: Clinical, data-driven, professional football analysis. Avoid generic filler.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Analysis generation failed.";
    } catch (e) {
        console.error("Analysis Error", e);
        return "Scouting network unavailable.";
    }
};

export const generateOpponentReport = async (club: Club, opponentName: string): Promise<string> => {
    if (!apiKey) return "Intel unavailable.";
    
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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Tactical uplink failed.";
    } catch (e) {
        console.error("Opponent Analysis Error", e);
        return "Scouting network unavailable.";
    }
};

export const suggestScorers = async (
    club: Club, 
    opponent: string, 
    myScore: number, 
    notes: string
): Promise<string[]> => {
    if (!apiKey) return [];

    const prompt = `
        Role: Football Analyst.
        Context: The match ended. We scored ${myScore} goals against ${opponent}.
        Notes provided by admin: "${notes}".
        
        Squad:
        ${club.players.map(p => `- ${p.name} (${p.position}, Form: ${p.form})`).join('\n')}

        Task: 
        1. If specific scorers are mentioned in the notes (even by nickname or part of name), extract their full names from the squad list.
        2. If NOT mentioned, predict the most likely scorers based on the number of goals (${myScore}) and player form/position (High form Strikers/Forwards are most likely).
        3. Do not suggest more players than goals scored.
        
        Output: A JSON array containing ONLY the names of the players from the squad list who scored. 
        Example: ["Marcus Thorn", "Billy Bones"]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.error("Scorer Suggestion Error", e);
        return [];
    }
};

// --- OPS / ADMIN AI FUNCTIONS ---

export const generateSponsorReport = async (club: Club, sponsor: Sponsor, recentResults: string): Promise<string> => {
    if (!apiKey) return "Report generation failed.";
    
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

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Report generation failed.";
    } catch (e) {
        return "System error.";
    }
};

export const generateSponsorActivation = async (club: Club, sponsor: Sponsor): Promise<string> => {
    if (!apiKey) return "Ideation failed.";

    const prompt = `
        Role: Creative Marketing Agency for Football Club: ${club.name}.
        Task: Suggest 3 creative sponsorship activation ideas for our partner: ${sponsor.name}.
        
        Partner Context:
        - Sector: ${sponsor.sector}
        - Tier: ${sponsor.tier}
        
        Output:
        Provide 3 distinct ideas. For each, include:
        1. **The Hook** (Catchy Title)
        2. **The Concept** (What happens?)
        3. **The Value** (Why the sponsor will love it)
        
        Make them modern, digital-friendly, and exciting for fans.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Ideas unavailable.";
    } catch (e) {
        return "Brainstorming failed.";
    }
};

export const generateRenewalPitch = async (club: Club, sponsor: Sponsor): Promise<string> => {
    if (!apiKey) return "Draft failed.";

    const prompt = `
        Role: Club Chairman.
        Task: Write a high-stakes negotiation email for ${sponsor.name}.
        Goal: Pitch a contract renewal and upsell them to the next Tier (or increase value).
        
        Context:
        - Current Status: ${sponsor.status}
        - Current Value: ${sponsor.value}
        
        Strategy:
        - Thank them for the current partnership.
        - Create "FOMO" (Fear Of Missing Out) by hinting at club growth and other interest.
        - Propose a 20% increase in investment for "Exclusive Digital Rights".
        
        Tone: Persuasive, exclusive, ambitious.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Draft failed.";
    } catch (e) {
        return "Draft failed.";
    }
};


export const generateSmartReply = async (email: InboxEmail): Promise<string[]> => {
    if (!apiKey) return ["Error generating replies."];

    const prompt = `
        Role: Club Secretary.
        Task: Read the following email and provide 3 distinct, short response options.
        
        Incoming Email:
        From: ${email.from}
        Subject: ${email.subject}
        Body: ${email.body}
        
        Output: A JSON array of 3 strings.
        1. Positive/Confirming response.
        2. Holding/Delaying response.
        3. Polite Decline/Negative response.
        
        Keep them polite and professional.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return ["Response generation failed."];
    }
};

export const generateAdminEmail = async (club: Club, task: AdminTask): Promise<string> => {
    if (!apiKey) return "Draft failed.";
    
    const prompt = `
        Role: Club Admin.
        Task: Draft a formal email regarding the task: "${task.title}".
        Type: ${task.type}
        Context: The deadline is ${task.deadline}.
        
        If it's a League task, address it to the League Secretary.
        If it's Finance, address it to the Treasurer/Partner.
        
        Keep it formal and brief.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Draft failed.";
    } catch (e) {
        return "Draft failed.";
    }
};

export const generateActionPlan = async (club: Club, task: AdminTask): Promise<string> => {
    if (!apiKey) return "Plan unavailable.";
    
    const prompt = `
        Role: Operations Manager for ${club.name}.
        Task: Break down the admin task "${task.title}" into 3 concise, actionable sub-steps.
        Context: Deadline is ${task.deadline}. Priority: ${task.priority}.
        
        Output Format: HTML bullet points (<ul><li>...</li></ul>) without markdown code blocks.
        Tone: Efficient, imperative.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "<ul><li>Review Requirements</li><li>Execute Task</li><li>Submit</li></ul>";
    } catch (e) {
        return "<ul><li>System Error</li></ul>";
    }
};

export const analyzeEmailSentiment = async (email: InboxEmail): Promise<{score: number, mood: string}> => {
    if (!apiKey) return { score: 50, mood: "Neutral" };

    const prompt = `
        Role: Sentiment Analyst.
        Task: Analyze the tone of this email.
        Subject: ${email.subject}
        Body: ${email.body}
        
        Output JSON: { 
            "score": number (0-100, where 0 is hostile/urgent, 50 is neutral, 100 is positive/friendly), 
            "mood": string (One word e.g. "Urgent", "Friendly", "Formal", "Angry") 
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        mood: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(response.text || '{"score": 50, "mood": "Neutral"}');
    } catch (e) {
        return { score: 50, mood: "Neutral" };
    }
};

export const generateNewsArticle = async (club: Club, title: string, details: string): Promise<{article: string, social: string}> => {
    if (!apiKey) return { article: "", social: "" };

    const prompt = `
        Role: Media Officer.
        Task: Generate a website news article and a social media caption.
        Topic: ${title}
        Details: ${details}
        Club Tone: ${club.tone_context}
        
        Output JSON: { "article": "Full HTML formatted article text...", "social": "Short punchy caption..." }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        article: { type: Type.STRING },
                        social: { type: Type.STRING }
                    }
                 }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { article: "Error", social: "Error" };
    }
};

export const generateNewsletter = async (club: Club, highlights: string[]): Promise<string> => {
    if (!apiKey) return "Newsletter failed.";

    const prompt = `
        Role: Media Team.
        Task: Write a weekly newsletter for fans.
        Highlights to include:
        ${highlights.map(h => `- ${h}`).join('\n')}
        
        Structure:
        - Catchy Subject Line
        - Intro
        - The Big Story (Match/Result)
        - Player Spotlight
        - Commercial Partner Shoutout
        - Footer
        
        Format: HTML-ready text (paragraphs, bolding).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        article: { type: Type.STRING },
                        social: { type: Type.STRING }
                    }
                } // Note: This schema might not be perfect for HTML return, let's trust raw text if needed or simple structure
            }
        });
        return response.text || "Newsletter failed.";
    } catch (e) {
        return "Newsletter failed.";
    }
};

// --- Video Generation ---

export const generatePlayerVideo = async (club: Club, player: Player): Promise<string | null> => {
  // Check for API key selection (Mandatory for Veo)
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
       await win.aistudio.openSelectKey();
    }
  }
  
  // Re-init AI with env key (which should be updated by the browser environment after selection)
  const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Cinematic highlight of football player ${player.name}, wearing neon cyan and purple kit, number ${player.number}, playing in a futuristic stadium. Action shot, professional sports photography, 4k, energetic atmosphere, scoring a goal.`;

  try {
    let operation = await videoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
      operation = await videoAi.operations.getVideosOperation({operation: operation});
    }

    const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (uri) {
        // Append key for playback as per SDK instructions
        return `${uri}&key=${process.env.API_KEY}`;
    }
    return null;

  } catch (e) {
    console.error("Video Gen Error", e);
    throw e;
  }
};
