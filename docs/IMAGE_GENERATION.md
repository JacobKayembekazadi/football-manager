# AI Image Generation Feature

**Added:** December 2024  
**Model:** Gemini 2.5 Flash Image  
**Status:** ✅ Complete

---

## Overview

PitchSide AI now includes full AI-powered image generation for creating professional football club graphics, matchday announcements, player cards, and custom visuals.

---

## What Was Added

### 1. **Edge Function** (`supabase/functions/ai-generate-image/`)
Server-side image generation with security features:
- ✅ BYOK support (Club → Org → Platform key resolution)
- ✅ Text-to-image generation
- ✅ Image editing with reference images
- ✅ Base64 output for immediate use
- ✅ Usage logging to `ai_usage_events` table

### 2. **Service Functions** (`services/geminiService.ts`)
5 pre-configured generation types:

| Function | Purpose | Example |
|----------|---------|---------|
| `generateMatchdayGraphic()` | Pre-match hype graphics | "vs Phoenix Rising - Kickoff 3PM" |
| `generateResultGraphic()` | Full-time score cards | "FT: 3-1 - Thorn Hat-Trick!" |
| `generatePlayerSpotlight()` | Stats cards with radar visualization | "Marcus Thorn #9 - Form 9.5" |
| `generateAnnouncementGraphic()` | News/signings/events | "NEW SIGNING - Welcome!" |
| `generateCustomImage()` | Custom prompt + club branding | Your imagination |

**Style Options:** Neon (default), Hype, Minimal, Retro

### 3. **UI Components**

#### **ImageGeneratorModal** (Full-Featured Lab)
- 5-tab interface for different generation types
- Live preview of generated images
- Download as PNG with proper naming
- Copy Base64 for embedding
- Regenerate button

#### **Integration Points**
1. **Content Pipeline** → "AI Graphics" button (top-right)
2. **Squad View** → "Generate Player Card" (inside player modal)
3. **Dashboard** → "Generate Matchday Graphic" button (next match widget)

### 4. **AI Usage Analytics** (Settings View)
New dashboard showing:
- Total AI requests
- Text vs Image generation breakdown
- 7-day and 30-day activity
- Input/output volume metrics
- Visual charts and trends

---

## How to Use

### For Content Creators

1. **Generate Matchday Graphics**
   - Go to **Content Pipeline** → Click **"AI Graphics"**
   - Select **Matchday** tab
   - Choose upcoming fixture
   - Pick style (Neon/Hype/Minimal/Retro)
   - Click **"Generate Image"**
   - Download or copy base64

2. **Generate Player Stats Cards**
   - Go to **Squad View**
   - Click on any player
   - Scroll to **"AI Player Card"** section
   - Click **"Generate Player Card"**
   - Download the card

3. **Generate Result Graphics**
   - Go to **Content Pipeline** → **"AI Graphics"**
   - Select **Result** tab
   - Choose completed match
   - Generate scoreline graphic

4. **Custom Graphics**
   - Go to **Content Pipeline** → **"AI Graphics"**
   - Select **Custom** tab
   - Write your prompt (e.g., "Training session silhouette with stadium lights")
   - Club colors applied automatically

### For Admins

**Track AI Usage:**
- Go to **Settings**
- Scroll to **"AI Usage Analytics"**
- View real-time metrics:
  - Total requests
  - Text vs Image breakdown
  - Weekly/monthly trends
  - Data volume

---

## Technical Details

### Model & Endpoint
```
Model: gemini-2.5-flash-preview-05-20
Endpoint: /v1beta/models/{model}:generateContent
Response: { imageBase64, mimeType, description }
```

### API Key Resolution
```
Club BYOK → Org BYOK → Platform Managed
```

### Usage Logging
All generations logged to `ai_usage_events`:
```sql
{
  org_id,
  club_id,
  user_id,
  action: 'ai_generate_image',
  approx_input_chars: prompt_length,
  approx_output_chars: base64_length,
  meta: { model, key_source, type: 'image_generation' }
}
```

---

## Deployment

### 1. Deploy Edge Function
```bash
cd supabase/functions
supabase functions deploy ai-generate-image
```

### 2. Set Secrets (if not already set)
```bash
supabase secrets set GEMINI_API_KEY=your_platform_key
supabase secrets set APP_ENCRYPTION_KEY=your_32_byte_key
```

### 3. Test Locally
```bash
npm run dev
# Navigate to Content Pipeline → AI Graphics
# Generate a test image
```

### 4. Verify Usage Tracking
```bash
# Check that events are logged
# Settings → AI Usage Analytics should show data
```

---

## Cost Considerations

### Gemini 2.5 Flash Image Pricing (as of Dec 2024)
- **Free Tier:** 15 RPM / 1,500 RPD
- **Paid:** ~$0.002 per image (approximate)

### Recommendations
- **Test/Demo:** Use free tier
- **Production:** BYOK for privacy + higher limits
- **Enterprise:** Club-level BYOK for full isolation

---

## Troubleshooting

### "AI unavailable (Supabase not configured)"
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Ensure Supabase project is running

### "Missing GEMINI_API_KEY"
- Set in Supabase dashboard: Project Settings → Edge Functions → Secrets
- Or use BYOK in Settings

### "Failed to generate image"
- Check Edge Function logs: `supabase functions logs ai-generate-image`
- Verify API key is valid
- Check rate limits (15 RPM for free tier)

### Images not displaying
- Ensure base64 data is valid
- Check browser console for errors
- Try regenerating

---

## Future Enhancements

Potential additions:
- [ ] Image editing (upload + modify)
- [ ] Batch generation (multiple images at once)
- [ ] Template library (save/reuse prompts)
- [ ] Social media scheduling integration
- [ ] Auto-generation triggers (e.g., auto-create matchday graphic 24h before KO)
- [ ] GIF/Animation support
- [ ] Brand kit management (logos, fonts, color palettes)

---

## Examples

### Matchday Graphic Prompt (Internal)
```
Create a professional matchday announcement graphic for a football club.

CLUB: Neon City FC (The Cyberpunks)
OPPONENT: Phoenix Rising
VENUE: Away
DATE: Sat 14 Dec
KICKOFF: 15:00
COMPETITION: Cyber League

DESIGN STYLE: cyberpunk aesthetic, neon glow effects, dark background 
with bright cyan and magenta accents, futuristic

PRIMARY COLOR: #00f3ff
SECONDARY COLOR: #bc13fe

Requirements:
- Include both team names prominently
- Show date and kickoff time clearly
- Add "MATCHDAY" header
- Professional sports graphic quality
- NO real player faces - abstract imagery only
```

### Player Card Prompt (Internal)
```
Create a professional player spotlight/stats card graphic.

CLUB: Neon City FC
PLAYER: Marcus Thorn
POSITION: FWD
NUMBER: #9

STATS: Pace 88, Shooting 92, Passing 72, Dribbling 85, Defending 42, Physical 82
FORM: 9.5/10

DESIGN STYLE: Modern sports card aesthetic, cyberpunk/neon elements, 
dark background with glowing accents.

Requirements:
- Player silhouette (NO real face)
- Hexagonal radar-style stats visualization
- Player name and number prominently displayed
- Trading card / FIFA-style layout
```

---

**Questions?** Check the main docs or run the app locally to explore!





