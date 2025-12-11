# Context Guide for LLMs

**Last Updated**: 2024-12-11  
**Purpose**: Main entry point for LLM context about PitchSide AI codebase  
**For LLMs**: Read this file first to understand the system architecture and common patterns

## Quick Start

1. **System Overview**: PitchSide AI is a React/TypeScript web application for football club media management
2. **Architecture**: Frontend (React) + Backend (Supabase/PostgreSQL) + AI (Google Gemini)
3. **Key Files**: 
   - `App.tsx` - Main application component
   - `services/` - All data operations and AI integrations
   - `components/` - UI components
   - `types.ts` - TypeScript type definitions

## System Architecture

### Technology Stack
- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Tailwind CSS (via CDN)

### Data Flow
```
User Action → Component → Service Layer → Supabase → Database
                                    ↓
                              AI Service (Gemini)
```

### Service Layer Pattern
All database operations go through service modules in `services/`:
- `clubService.ts` - Club data
- `playerService.ts` - Player roster
- `fixtureService.ts` - Match fixtures
- `contentService.ts` - Generated content
- `sponsorService.ts` - Sponsor management
- `taskService.ts` - Admin tasks
- `emailService.ts` - Email inbox
- `conversationService.ts` - AI chat history

Each service follows this pattern:
```typescript
export const getItems = async (clubId: string): Promise<Item[]>
export const createItem = async (clubId: string, item: Omit<Item, 'id'>): Promise<Item>
export const updateItem = async (id: string, updates: Partial<Item>): Promise<Item>
export const deleteItem = async (id: string): Promise<void>
export const subscribeToItems = (clubId: string, callback: (items: Item[]) => void)
```

## Common Patterns

### Data Fetching
Use `useSupabaseQuery` hook for fetching data:
```typescript
const { data, loading, error, refetch } = useSupabaseQuery(
  () => getPlayers(clubId),
  [clubId]
);
```

### Real-time Updates
Use `useRealtimeSubscription` hook:
```typescript
useRealtimeSubscription(
  (callback) => subscribeToPlayers(clubId, callback),
  (players) => setPlayers(players),
  [clubId]
);
```

### AI Content Generation
All AI operations are in `services/geminiService.ts`:
- `generateContent()` - Main content generation
- `chatWithAi()` - Conversational AI
- `generatePlayerAnalysis()` - Player scouting reports
- `generateOpponentReport()` - Tactical analysis

### Error Handling
- Services throw errors that components catch
- Show user-friendly error messages
- Log errors to console for debugging

## File Organization

```
/
├── App.tsx                 # Main app component with routing
├── types.ts                # TypeScript type definitions
├── services/               # Service layer (data + AI)
│   ├── supabaseClient.ts  # Supabase initialization
│   ├── *Service.ts        # Data services
│   └── geminiService.ts   # AI service
├── components/            # React components
│   ├── Layout.tsx         # Main layout with navigation
│   └── *.tsx              # Feature components
├── hooks/                 # Custom React hooks
│   ├── useSupabaseQuery.ts
│   └── useRealtimeSubscription.ts
├── database/              # Database schema
│   ├── schema.sql         # SQL migration
│   └── README.md          # Schema docs
└── docs/                  # Documentation
    ├── CONTEXT.md         # This file
    ├── ARCHITECTURE.md    # Detailed architecture
    ├── API_DOCUMENTATION.md
    ├── DATA_MODEL.md
    ├── AI_PROMPTS.md
    ├── DEPLOYMENT.md
    └── DEVELOPMENT_GUIDE.md
```

## Key Concepts

### Club ID
- Currently hardcoded to `MOCK_CLUB.id` in `App.tsx`
- In production, would come from authentication
- All data is scoped to a club

### Content Workflow
1. **DRAFT** - Initial generation
2. **APPROVED** - Reviewed and approved
3. **PUBLISHED** - Published (sets `published_at` timestamp)

### AI Conversations
- Each club has conversations stored in `ai_conversations` table
- Messages stored in `ai_messages` table
- Conversation history is loaded when AI assistant opens

## When Making Changes

1. **Update Types**: If adding new fields, update `types.ts` first
2. **Update Schema**: If database changes, update `database/schema.sql`
3. **Update Service**: Add service functions for new operations
4. **Update Component**: Use service functions in components
5. **Update Docs**: Keep documentation files up-to-date

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed system architecture
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Service function reference
- [DATA_MODEL.md](DATA_MODEL.md) - Database schema details
- [AI_PROMPTS.md](AI_PROMPTS.md) - AI prompt engineering
- [DEPLOYMENT.md](DEPLOYMENT.md) - Setup and deployment
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Developer onboarding

## Notes for LLMs

- Always check `types.ts` for type definitions
- Service functions handle all database operations
- Components should not directly access Supabase client
- AI operations are centralized in `geminiService.ts`
- Error handling should be user-friendly
- Loading states should be shown for async operations

