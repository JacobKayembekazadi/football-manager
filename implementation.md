# PitchSide AI — Implementation Guide

## Overview

PitchSide AI is a comprehensive SaaS platform for football club media management, built with modern web technologies and AI-powered content generation. The application supports multi-tenant organizations with role-based access control.

## Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: Google Gemini 2.5 Pro via server-side Edge Functions
- **Email**: Gmail/Outlook OAuth integration
- **Hosting**: Vercel (frontend), Supabase (backend)

### Key Components

#### Database Schema
- **Multi-tenant**: Organizations → Clubs → Users
- **RLS Policies**: Strict row-level security with org_id scoping
- **Tables**: orgs, clubs, players, fixtures, content_items, sponsors, admin_tasks, email_connections, user_onboarding_state

#### Service Layer
```
services/
├── supabaseClient.ts     # Client initialization + config
├── authService.ts        # Authentication (signup/signin)
├── orgService.ts         # Organization management
├── clubService.ts        # Club CRUD operations
├── fixtureService.ts     # Match fixtures + results
├── contentService.ts     # AI-generated content
├── sponsorService.ts     # Sponsor partnerships
├── taskService.ts        # Admin task management
├── emailService.ts       # Email records
├── geminiService.ts      # AI generation (calls Edge Functions)
└── onboardingService.ts  # User onboarding state
```

#### Edge Functions
```
supabase/functions/
├── ai-generate/          # Content generation with BYOK
├── ai-settings/          # AI key management (encrypted)
├── email-oauth-start/    # OAuth authorization URL
├── email-oauth-exchange/ # Token exchange
├── email-sync/           # Email synchronization
└── email-send/           # Send replies
```

## Core Features

### 1. Multi-Tenant Organization Management
- **Org Creation**: Users can create organizations (clubs or agencies)
- **Club Management**: Organizations can have multiple clubs
- **Role System**: Owner, Admin, Editor, Viewer permissions
- **Workspace Switching**: Switch between orgs and clubs

### 2. AI-Powered Content Generation
- **BYOK Support**: Bring Your Own Key (Club → Org → Platform fallback)
- **Content Types**: Match previews, reports, social posts, sponsor content
- **Edge Functions**: Server-side AI calls for security
- **Usage Tracking**: AI usage events logged per org/club

### 3. Email Integration
- **OAuth Connect**: Gmail and Outlook OAuth flows
- **Master Inbox**: Club-level shared connections
- **Personal Inbox**: User-level private connections
- **Smart Replies**: AI-generated response suggestions
- **Sentiment Analysis**: Email mood detection

### 4. CRUD Operations (All Entities)
- **Fixtures**: Schedule, log results, generate reports
- **Players**: Roster management, AI analysis, video generation
- **Sponsors**: Partnership tracking, ROI reports, content generation
- **Content**: Pipeline management, status workflow
- **Tasks**: Admin task tracking, AI action plans, email drafts

### 5. User Experience
- **Onboarding**: Welcome tour + guided setup
- **Education**: Interactive learning modules
- **Quick Start**: Dashboard checklist for new users
- **Empty States**: Actionable CTAs when no data exists

## Development Setup

### Prerequisites
```bash
Node.js 18+
npm or yarn
Supabase CLI
Vercel CLI (for deployment)
```

### Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Local overrides (not in git)
.env.local with real secrets
```

### Supabase Setup
```bash
# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Apply schema
supabase db push

# Deploy functions
supabase functions deploy ai-generate
supabase functions deploy ai-settings
# ... deploy all functions

# Set secrets
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set APP_ENCRYPTION_KEY=your_32byte_key
# ... set all secrets
```

### Testing
```bash
# Unit tests
npm test

# Integration tests
npm test -- --run tests/integration/

# RLS policy tests
npm test -- --run tests/integration/rls-isolation.test.ts
```

## Deployment

### Production Setup
1. **Supabase Project**: Create production project
2. **Database**: Apply schema.sql to production DB
3. **Edge Functions**: Deploy all functions with secrets
4. **OAuth Apps**: Register Gmail/Outlook apps with production redirects
5. **Vercel**: Deploy frontend with production env vars

### Environment Configuration
- **Frontend**: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- **Backend**: GEMINI_API_KEY, encryption keys, OAuth credentials

### Monitoring
- **Error Tracking**: Supabase logs for Edge Functions
- **Performance**: Vercel analytics
- **Usage**: Custom AI usage events table

## Security Architecture

### Row Level Security (RLS)
- All tables scoped by `org_id`
- Helper functions: `is_org_member()`, `org_role()`
- Strict policies prevent cross-org data access

### AI Security
- Server-side generation only
- Encrypted BYOK storage
- API keys never exposed to frontend

### Email Security
- OAuth tokens encrypted at rest
- Server-side email operations
- Secure token refresh flows

## Testing Strategy

### Test Categories
- **Unit Tests**: Service functions, utilities
- **Integration Tests**: End-to-end workflows
- **RLS Tests**: Multi-tenant isolation
- **AI Tests**: Key precedence, edge cases

### Test Coverage
- 88 tests across 7 test files
- All services tested
- Critical RLS policies verified
- AI key precedence validated

## Future Enhancements

### Immediate Opportunities
- **Inngest Integration**: Background job orchestration
- **Scheduled Content**: Auto-generate pre-match content
- **Email Automation**: Automatic inbox syncing
- **Deadline Notifications**: Task reminder system

### Scaling Considerations
- **Database**: Connection pooling, query optimization
- **AI**: Rate limiting, cost monitoring
- **Email**: Bulk operations, threading
- **Frontend**: Code splitting, lazy loading

## Development Workflow

### Code Organization
- **Components**: Feature-based organization
- **Services**: Single responsibility per file
- **Types**: Centralized in types.ts
- **Hooks**: Custom React hooks for data fetching

### Git Workflow
- **Main Branch**: Production-ready code
- **Feature Branches**: New features
- **PR Reviews**: Required for all changes
- **Testing**: All PRs must pass tests

### Documentation
- **docs/CONTEXT.md**: LLM context entry point
- **docs/ARCHITECTURE.md**: System architecture
- **docs/USERGUIDE.md**: User-facing documentation
- **docs/USECASES.md**: Functional requirements

## Troubleshooting

### Common Issues
- **RLS Errors**: Check org_id scoping in queries
- **Auth Issues**: Verify Supabase configuration
- **AI Failures**: Check Edge Function logs
- **Email Problems**: Verify OAuth token refresh

### Debug Commands
```bash
# Check Supabase status
supabase status

# View function logs
supabase functions logs ai-generate

# Test local functions
supabase functions serve
```

## Performance Optimization

### Frontend
- React 19 with concurrent features
- Lazy loading for heavy components
- Optimized re-renders with proper memoization

### Database
- Efficient queries with proper indexing
- Connection pooling for Edge Functions
- Cached frequently accessed data

### AI Operations
- Rate limiting per org/club
- Cost monitoring and alerts
- Usage analytics for optimization

---

*This implementation guide provides the foundation for understanding and extending PitchSide AI. For detailed API documentation, see the individual service files and the comprehensive docs/ folder.*

