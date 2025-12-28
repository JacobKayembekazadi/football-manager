# API Documentation

**Last Updated**: 2024-12-11  
**Purpose**: Complete reference for all service functions and API endpoints  
**For LLMs**: Use this to understand available functions and their signatures

## Service Functions

### Club Service (`services/clubService.ts`)

```typescript
getClub(clubId: string): Promise<Club | null>
getClubs(): Promise<Club[]>
createClub(club: Omit<Club, 'id' | 'players'>): Promise<Club>
updateClub(clubId: string, updates: Partial<Omit<Club, 'id' | 'players'>>): Promise<Club>
deleteClub(clubId: string): Promise<void>
subscribeToClub(clubId: string, callback: (club: Club | null) => void): () => void
```

### Player Service (`services/playerService.ts`)

```typescript
getPlayers(clubId: string): Promise<Player[]>
getPlayer(playerId: string): Promise<Player | null>
createPlayer(clubId: string, player: Omit<Player, 'id'>): Promise<Player>
updatePlayer(playerId: string, updates: Partial<Omit<Player, 'id'>>): Promise<Player>
deletePlayer(playerId: string): Promise<void>
subscribeToPlayers(clubId: string, callback: (players: Player[]) => void): () => void
```

### Fixture Service (`services/fixtureService.ts`)

```typescript
getFixtures(clubId: string): Promise<Fixture[]>
getFixturesByStatus(clubId: string, status: FixtureStatus): Promise<Fixture[]>
getFixture(fixtureId: string): Promise<Fixture | null>
createFixture(clubId: string, fixture: Omit<Fixture, 'id'>): Promise<Fixture>
updateFixture(fixtureId: string, updates: Partial<Omit<Fixture, 'id' | 'club_id'>>): Promise<Fixture>
deleteFixture(fixtureId: string): Promise<void>
subscribeToFixtures(clubId: string, callback: (fixtures: Fixture[]) => void): () => void
```

### Content Service (`services/contentService.ts`)

```typescript
getContentItems(clubId: string): Promise<ContentItem[]>
getContentItemsByFixture(fixtureId: string): Promise<ContentItem[]>
getContentItemsByStatus(clubId: string, status: ContentStatus): Promise<ContentItem[]>
getContentItem(contentId: string): Promise<ContentItem | null>
createContentItem(clubId: string, content: Omit<ContentItem, 'id' | 'created_at'>): Promise<ContentItem>
updateContentItem(contentId: string, updates: Partial<Omit<ContentItem, 'id' | 'created_at' | 'club_id'>>): Promise<ContentItem>
deleteContentItem(contentId: string): Promise<void>
subscribeToContentItems(clubId: string, callback: (items: ContentItem[]) => void): () => void
```

**Note**: When `status` is set to `'PUBLISHED'`, `published_at` is automatically set.

### Sponsor Service (`services/sponsorService.ts`)

```typescript
getSponsors(clubId: string): Promise<Sponsor[]>
getSponsor(sponsorId: string): Promise<Sponsor | null>
createSponsor(clubId: string, sponsor: Omit<Sponsor, 'id'>): Promise<Sponsor>
updateSponsor(sponsorId: string, updates: Partial<Omit<Sponsor, 'id'>>): Promise<Sponsor>
saveSponsorContent(sponsorId: string, content: { type: string; content: string }): Promise<Sponsor>
deleteSponsor(sponsorId: string): Promise<void>
subscribeToSponsors(clubId: string, callback: (sponsors: Sponsor[]) => void): () => void
```

### Task Service (`services/taskService.ts`)

```typescript
getTasks(clubId: string): Promise<AdminTask[]>
getTasksByStatus(clubId: string, status: AdminTask['status']): Promise<AdminTask[]>
getTask(taskId: string): Promise<AdminTask | null>
createTask(clubId: string, task: Omit<AdminTask, 'id'>): Promise<AdminTask>
updateTask(taskId: string, updates: Partial<Omit<AdminTask, 'id'>>): Promise<AdminTask>
saveTaskActionPlan(taskId: string, actionPlan: string): Promise<AdminTask>
saveTaskEmailDraft(taskId: string, emailDraft: string): Promise<AdminTask>
deleteTask(taskId: string): Promise<void>
subscribeToTasks(clubId: string, callback: (tasks: AdminTask[]) => void): () => void
```

### Email Service (`services/emailService.ts`)

```typescript
getEmails(clubId: string): Promise<InboxEmail[]>
getUnreadEmails(clubId: string): Promise<InboxEmail[]>
getEmail(emailId: string): Promise<InboxEmail | null>
createEmail(clubId: string, email: Omit<InboxEmail, 'id'>): Promise<InboxEmail>
updateEmail(emailId: string, updates: Partial<Omit<InboxEmail, 'id'>>): Promise<InboxEmail>
markEmailAsRead(emailId: string): Promise<InboxEmail>
saveEmailSentiment(emailId: string, sentiment: { score: number; mood: string }): Promise<InboxEmail>
saveEmailReplyDraft(emailId: string, replyDraft: string): Promise<InboxEmail>
markEmailAsSent(emailId: string): Promise<InboxEmail>
deleteEmail(emailId: string): Promise<void>
subscribeToEmails(clubId: string, callback: (emails: InboxEmail[]) => void): () => void
```

### Conversation Service (`services/conversationService.ts`)

```typescript
getConversations(clubId: string): Promise<Conversation[]>
getOrCreateLatestConversation(clubId: string): Promise<Conversation>
createConversation(clubId: string): Promise<Conversation>
getMessages(conversationId: string): Promise<Message[]>
addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<Message>
deleteConversation(conversationId: string): Promise<void>
subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void
```

### Fan Sentiment Service (`services/fanSentimentService.ts`)

```typescript
getLatestFanSentiment(clubId: string): Promise<FanSentiment | null>
refreshFanSentiment(clubId: string, clubName: string, orgId: string): Promise<FanSentiment>
getSentimentHistory(clubId: string, days?: number): Promise<FanSentiment[]>
```

**Fan Sentiment Interface**:
```typescript
interface FanSentiment {
  id: string;
  org_id: string;
  club_id: string;
  sentiment_score: number; // 0-100
  sentiment_mood: 'euphoric' | 'happy' | 'neutral' | 'worried' | 'angry';
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_mentions: number;
  keywords_analyzed?: string[];
  data_source: string; // 'twitter' | 'mock'
  snapshot_date: string;
  created_at: string;
  updated_at: string;
}
```

**Notes**:
- `getLatestFanSentiment`: Returns the most recent sentiment snapshot for a club, or mock data if Supabase not configured
- `refreshFanSentiment`: Triggers Edge Function to collect new Twitter data and analyze sentiment
- `getSentimentHistory`: Returns historical sentiment snapshots for the last N days (default: 30)

## Edge Functions

### Fan Sentiment Edge Function (`fan-sentiment`)

**Endpoint**: `/functions/v1/fan-sentiment`

**Method**: `POST`

**Headers**:
```
Authorization: Bearer <user_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "clubId": "uuid",
  "clubName": "Neon City FC",
  "orgId": "uuid"
}
```

**Response**:
```json
{
  "id": "uuid",
  "org_id": "uuid",
  "club_id": "uuid",
  "sentiment_score": 92,
  "sentiment_mood": "euphoric",
  "positive_count": 85,
  "negative_count": 5,
  "neutral_count": 10,
  "total_mentions": 100,
  "keywords_analyzed": ["happy", "amazing", "victory"],
  "data_source": "twitter",
  "snapshot_date": "2025-01-15",
  "created_at": "2025-01-15T09:00:00Z",
  "updated_at": "2025-01-15T09:00:00Z"
}
```

**Process**:
1. Uses Apify to scrape Twitter mentions of the club
2. Performs keyword-based sentiment analysis (positive/negative/neutral)
3. Samples tweets for Gemini AI deep analysis
4. Calculates weighted score (70% keyword + 30% Gemini)
5. Stores snapshot in database (upsert by club_id + snapshot_date)

**Required Environment Variables**:
- `APIFY_TOKEN`: Apify API token for Twitter scraping
- `GEMINI_API_KEY`: For deep sentiment analysis (or resolved via BYOK)

## AI Service Functions (`services/geminiService.ts`)

### Content Generation

```typescript
generateContent(
  club: Club,
  fixture: Fixture,
  type: ContentType,
  extraContext?: GenerationContext
): Promise<string>
```

**Content Types**: `'PREVIEW' | 'REPORT' | 'SOCIAL' | 'GRAPHIC_COPY'`

**Generation Context**:
```typescript
interface GenerationContext {
  matchType?: string;      // e.g. "Derby", "Cup Final"
  vibe?: string;            // e.g. "Thriller", "Boring"
  motm?: string;            // Man of the Match
  managerQuote?: string;
}
```

### Content Editing

```typescript
rewriteContent(
  club: Club,
  originalText: string,
  instruction: string
): Promise<string>
```

### Conversational AI

```typescript
chatWithAi(
  club: Club,
  message: string,
  history?: {role: string, content: string}[]
): Promise<string>
```

**History Format**: Array of `{role: 'user' | 'assistant', content: string}`

### Player Analysis

```typescript
generatePlayerAnalysis(player: Player): Promise<string>
generateOpponentReport(club: Club, opponentName: string): Promise<string>
suggestScorers(
  club: Club,
  opponent: string,
  myScore: number,
  notes: string
): Promise<string[]>
```

### Sponsor Operations

```typescript
generateSponsorReport(club: Club, sponsor: Sponsor, recentResults: string): Promise<string>
generateSponsorActivation(club: Club, sponsor: Sponsor): Promise<string>
generateRenewalPitch(club: Club, sponsor: Sponsor): Promise<string>
```

### Admin Operations

```typescript
generateAdminEmail(club: Club, task: AdminTask): Promise<string>
generateActionPlan(club: Club, task: AdminTask): Promise<string>
generateSmartReply(email: InboxEmail): Promise<string[]>
analyzeEmailSentiment(email: InboxEmail): Promise<{score: number, mood: string}>
```

### Communication

```typescript
generateNewsArticle(club: Club, title: string, details: string): Promise<{article: string, social: string}>
generateNewsletter(club: Club, highlights: string[]): Promise<string>
```

### Video Generation

```typescript
generatePlayerVideo(club: Club, player: Player): Promise<string | null>
```

**Note**: Requires special API key handling for Veo model.

## Email Integration (`services/emailIntegration.ts`)

```typescript
sendEmail(
  emailId: string,
  replyContent: string,
  recipientEmail: string
): Promise<void>
```

**Note**: Currently simulates sending. In production, integrate with actual email service.

## Supabase Client (`services/supabaseClient.ts`)

```typescript
export const supabase: SupabaseClient
export const TABLES: Record<string, string>
export const isSupabaseConfigured(): boolean
```

## Custom Hooks

### useSupabaseQuery (`hooks/useSupabaseQuery.ts`)

```typescript
useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps?: React.DependencyList
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
```

### useRealtimeSubscription (`hooks/useRealtimeSubscription.ts`)

```typescript
useRealtimeSubscription<T>(
  subscribeFn: (callback: (data: T) => void) => () => void,
  callback: (data: T) => void,
  deps?: React.DependencyList
): void
```

## Error Handling

All service functions:
- Throw errors on failure
- Log errors to console
- Return `null` for "not found" cases (when appropriate)

Components should:
- Catch errors from service calls
- Show user-friendly error messages
- Handle loading states

## Response Formats

### Success
- Create/Update operations return the created/updated entity
- Get operations return the entity or array of entities
- Delete operations return `void`

### Errors
- Functions throw `Error` objects
- Check error messages for details
- Some functions return `null` for "not found" (check function docs)

## Real-time Subscriptions

All `subscribeTo*` functions:
- Return an unsubscribe function
- Call the callback when data changes
- Automatically handle reconnection

**Usage**:
```typescript
const unsubscribe = subscribeToPlayers(clubId, (players) => {
  setPlayers(players);
});

// Later, to unsubscribe:
unsubscribe();
```

## Notes

- All async functions return Promises
- All database operations are scoped to a `club_id`
- Timestamps are in ISO format (UTC)
- UUIDs are used for all IDs
- JSONB is used for complex nested data (stats, etc.)









