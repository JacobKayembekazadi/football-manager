# Architecture Documentation

**Last Updated**: 2024-12-11  
**Purpose**: Complete system architecture documentation  
**For LLMs**: Use this to understand the overall system design and data flow

## System Overview

PitchSide AI is a full-stack web application for football club media management, powered by AI content generation. The system uses React for the frontend, Supabase (PostgreSQL) for data persistence, and Google Gemini AI for content generation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Application (Vite)                │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  App.tsx │  │Components│  │  Hooks   │          │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │   │
│  └───────┼─────────────┼──────────────┼─────────────────┘   │
│          │             │              │                      │
│          └─────────────┼──────────────┘                      │
│                        │                                     │
│          ┌─────────────▼─────────────┐                       │
│          │    Service Layer          │                       │
│          │  ┌─────────────────────┐  │                       │
│          │  │  Data Services      │  │                       │
│          │  │  (Supabase)        │  │                       │
│          │  └─────────────────────┘  │                       │
│          │  ┌─────────────────────┐  │                       │
│          │  │  AI Service         │  │                       │
│          │  │  (Gemini)           │  │                       │
│          │  └─────────────────────┘  │                       │
│          └─────────────┬─────────────┘                       │
└─────────────────────────┼─────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │ Google Gemini │  │ Email Service│
│  (PostgreSQL)│  │      API      │  │  (Future)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Technology Stack

### Frontend
- **React 19.2.1** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool and dev server
- **Tailwind CSS** - Styling (via CDN)
- **Lucide React** - Icons
- **Framer Motion** - Animations (minimal)

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Edge Functions (for email sending)

### AI Integration
- **Google Gemini 2.5 Flash** - Text generation
- **Google Veo 3.1** - Video generation
- **@google/genai SDK** - AI client

## Data Flow

### Content Generation Flow

```
User Action
    ↓
Component (e.g., Dashboard)
    ↓
App.tsx Handler
    ↓
geminiService.generateContent()
    ↓
Google Gemini API
    ↓
Generated Content
    ↓
contentService.createContentItem()
    ↓
Supabase Database
    ↓
Real-time Update
    ↓
Component Re-render
```

### Data Fetching Flow

```
Component Mount
    ↓
useSupabaseQuery Hook
    ↓
Service Function (e.g., getPlayers)
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
Data Returned
    ↓
Component State Updated
    ↓
UI Renders
```

### Real-time Updates Flow

```
Database Change
    ↓
Supabase Realtime
    ↓
Service Subscription Callback
    ↓
Component State Update
    ↓
UI Re-renders
```

## Component Architecture

### Layout Structure

```
Layout (Main Container)
├── Sidebar Navigation
├── Header (HUD Bar)
└── Main Content Area
    ├── Dashboard
    ├── FixturesView
    ├── SquadView
    ├── ContentPipeline
    ├── SponsorNexus
    ├── AdminSentinel
    ├── CommsArray
    └── AiAssistant (Floating)
```

### Component Hierarchy

- **App.tsx** - Root component, manages routing and global state
- **Layout.tsx** - Main layout with navigation
- **Feature Components** - Individual feature views
- **Modal Components** - Overlays for editing/viewing
- **Card Components** - Reusable display components

## Service Layer Architecture

### Data Services

All data operations go through service modules:

```
services/
├── supabaseClient.ts      # Database client initialization
├── clubService.ts         # Club operations
├── playerService.ts       # Player CRUD
├── fixtureService.ts      # Match management
├── contentService.ts      # Content management
├── sponsorService.ts      # Sponsor operations
├── taskService.ts         # Admin tasks
├── emailService.ts        # Email inbox
└── conversationService.ts # AI chat history
```

**Pattern**: Each service provides:
- `get*()` - Fetch single or multiple items
- `create*()` - Create new item
- `update*()` - Update existing item
- `delete*()` - Delete item
- `subscribeTo*()` - Real-time updates

### AI Service

`services/geminiService.ts` centralizes all AI operations:
- Content generation (previews, reports, social posts)
- Content editing/rewriting
- Conversational AI
- Player analysis
- Opponent scouting
- Sponsor communications
- Admin assistance

## Database Architecture

### Schema Design

- **Normalized Structure**: Related data in separate tables
- **Foreign Keys**: All tables reference `clubs.id`
- **JSONB Fields**: Complex data (stats, generated content)
- **UUID Primary Keys**: All tables use UUID
- **Timestamps**: Auto-managed `created_at` and `updated_at`

### Relationships

- One-to-Many: Club → Players, Fixtures, Content, etc.
- One-to-Many: Fixture → Content Items
- One-to-Many: Conversation → Messages

### Indexes

Indexes on:
- Foreign keys for join performance
- Status fields for filtering
- Timestamps for sorting
- Frequently queried fields

## State Management

### Current Approach

- **React Hooks**: `useState` for local component state
- **Custom Hooks**: `useSupabaseQuery` for data fetching
- **Service Layer**: All persistent data in Supabase
- **Real-time**: Supabase subscriptions for live updates

### Data Flow Pattern

```
Supabase Database
    ↓
Service Function
    ↓
useSupabaseQuery Hook
    ↓
Component State
    ↓
UI Rendering
```

### State Types

1. **Persistent State**: Stored in Supabase (players, fixtures, content)
2. **UI State**: Component-local (modals, filters, search)
3. **Derived State**: Computed from other state (filtered lists)

## AI Integration Architecture

### Prompt Engineering

All prompts follow this structure:
1. **System Context**: Club identity, tone, squad
2. **Task Instructions**: Specific generation task
3. **Dynamic Context**: Match details, user input
4. **Output Format**: Type-specific requirements

### AI Service Functions

- **Content Generation**: `generateContent()` - Main content generator
- **Content Editing**: `rewriteContent()` - AI-powered editing
- **Conversational**: `chatWithAi()` - Chat assistant with history
- **Analysis**: Player and opponent analysis
- **Administrative**: Email drafts, action plans, sentiment analysis

### Conversation History

- Stored in `ai_conversations` and `ai_messages` tables
- Loaded when AI assistant opens
- Last 10 messages sent as context to AI
- Auto-saved after each message

## Security Architecture

### Current State (MVP)

- RLS enabled but policies allow all operations
- API keys in client-side code (not production-ready)
- No authentication system

### Production Requirements

- User authentication (Supabase Auth)
- Role-based access control
- RLS policies based on user roles
- API keys in backend only
- Rate limiting
- Input validation and sanitization

## Error Handling Architecture

### Service Layer

- Functions throw errors on failure
- Errors logged to console
- Return `null` for "not found" cases

### Component Layer

- Try-catch blocks for async operations
- User-friendly error messages
- Loading states during operations
- Fallback UI for errors

### Future Enhancements

- Error boundaries for React errors
- Centralized error handler
- Error reporting service
- Retry logic for failed operations

## Performance Architecture

### Database Optimization

- Indexes on frequently queried fields
- Efficient queries (select only needed fields)
- Connection pooling (handled by Supabase)

### Frontend Optimization

- Code splitting (Vite handles automatically)
- Lazy loading (potential for routes)
- Memoization (where needed)
- Optimistic updates (future enhancement)

### AI Optimization

- Response caching (future)
- Batch operations (where possible)
- Streaming responses (for long content)

## Deployment Architecture

### Development

- Local Vite dev server
- Local Supabase connection
- Hot module replacement

### Production

- Static build (Vite)
- CDN hosting (Vercel/Netlify)
- Supabase cloud database
- Edge functions for server-side operations

## Extension Points

### Adding New Features

1. **Database**: Add table in `schema.sql`
2. **Types**: Add interface in `types.ts`
3. **Service**: Create service file
4. **Component**: Create React component
5. **Route**: Add to `App.tsx`
6. **Docs**: Update documentation

### Adding New AI Capabilities

1. Add function to `geminiService.ts`
2. Design prompt following patterns
3. Document in `docs/AI_PROMPTS.md`
4. Add to appropriate component
5. Test with various inputs

### Adding Real-time Features

1. Use `useRealtimeSubscription` hook
2. Call service's `subscribeTo*` function
3. Update component state in callback
4. Handle cleanup on unmount

## Data Persistence Strategy

### Current Implementation

- All data in Supabase PostgreSQL
- Real-time subscriptions for live updates
- Automatic timestamp management
- Cascade deletes for related data

### Future Enhancements

- Offline support (local storage + sync)
- Data export functionality
- Backup and restore
- Data migration tools

## Integration Points

### Current Integrations

- **Supabase**: Database and real-time
- **Google Gemini**: AI content generation
- **Google Veo**: Video generation

### Future Integration Opportunities

- **Social Media APIs**: Twitter, Instagram, Facebook
- **Email Services**: SendGrid, Mailgun, Resend
- **Analytics**: Google Analytics, custom analytics
- **Calendar**: Google Calendar, Outlook
- **File Storage**: Supabase Storage, AWS S3

## Scalability Considerations

### Database Scaling

- Supabase handles scaling automatically
- Add indexes as data grows
- Consider read replicas for high traffic
- Archive old data if needed

### Application Scaling

- Stateless frontend (scales horizontally)
- CDN for static assets
- Caching strategies
- Load balancing (if needed)

### AI Scaling

- Rate limiting
- Response caching
- Batch processing
- Cost monitoring

## Monitoring and Observability

### Current Monitoring

- Supabase Dashboard (database metrics)
- Browser console (client-side errors)
- Network tab (API calls)

### Future Monitoring

- Error tracking (Sentry)
- Performance monitoring
- User analytics
- AI usage tracking
- Cost monitoring

## Related Documentation

- [CONTEXT.md](CONTEXT.md) - Quick reference guide
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Service function reference
- [DATA_MODEL.md](DATA_MODEL.md) - Database schema details
- [AI_PROMPTS.md](AI_PROMPTS.md) - AI prompt engineering
- [DEPLOYMENT.md](DEPLOYMENT.md) - Setup and deployment
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Developer guide

