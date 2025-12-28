# PitchSide AI — Project Overview

**Last Updated**: January 2025  
**Version**: 3.0.2  
**Status**: Production Ready

---

## 🎯 Project Vision

**PitchSide AI** is a **Commercial & Media Operating System** specifically designed for football clubs. It's not a general admin dashboard—it's laser-focused on two core value propositions:

1. **Content Automation**: Automated matchday content campaigns that generate hype, lineups, and post-match content automatically
2. **Sponsor Revenue**: ROI tracking and partner value reporting to maximize commercial partnerships

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (glassmorphism design system)
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI**: Google Gemini 2.5 Pro (server-side)
- **Observability**: LangSmith for AI tracing
- **Background Jobs**: Inngest for durable content sequences
- **Linting**: Biome
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)

### Multi-Tenant Architecture
```
Organization (workspace)
  └── Club 1
  │     ├── Players (Squad Intel)
  │     ├── Fixtures (The Hype Engine)
  │     ├── Content Items (automated campaigns)
  │     └── Sponsors (ROI tracking)
  └── Club 2
        └── (same structure)
```

**Key Features:**
- Role-based access control (Owner, Admin, Editor, Viewer)
- Complete data isolation between organizations
- Row Level Security (RLS) policies
- Org-scoped AI keys (BYOK support)

---

## 🚀 Core Features

### 1. Content Automation (The Hype Engine)
- **Matchday Campaigns**: Automated content sequences via Inngest
  - T-24h: Pre-match hype content
  - T-1h: Lineup announcements
  - Post-match: Final score graphics and highlights
- **Content Pipeline**: Draft → Approved → Published workflow
- **Auto-Publisher**: One-click copy to clipboard and bulk ZIP download

### 2. Sponsor Revenue (Sponsor Nexus)
- **ROI Tracking**: Impressions, engagement, clicks, conversions
- **Partner Value Reports**: PDF generation with jsPDF
- **Sponsor Management**: Full CRUD operations

### 3. Squad Intelligence (Squad Intel)
- **Player Roster**: Management with narrative tags
- **AI Analysis**: Player performance insights
- **Video Generation**: Veo highlight reels (optional)

### 4. Fan Sentiment Tracking
- **Real-time Analysis**: Twitter sentiment data collection via Apify
- **Hybrid Analysis**: Keyword filtering (70%) + Gemini AI deep analysis (30%)
- **Dashboard Widget**: Dynamic sentiment gauge with refresh button
- **Historical Data**: Track sentiment trends over time
- **Automated Refreshes**: Daily sentiment updates at 9 AM UTC via Inngest

### 5. User Experience
- **Onboarding**: Welcome modal + guided tour (react-joyride)
- **Education Center**: Learning modules for new users
- **Demo Data**: Auto-seeded for new users (can be cleared)
- **Quick Start Checklist**: Dashboard progress tracking

---

## 📊 Current Status

### ✅ Completed (v3.0.2)
- Multi-tenant database with RLS
- Authentication and workspace selection
- AI-powered content generation with BYOK
- Content automation via Inngest
- Sponsor ROI tracking and PDF reports
- User onboarding and education
- Mock data system for new users
- **Fan Sentiment Tracking**: Real-time Twitter sentiment analysis via Apify
- **Recent Bug Fixes**: Logout button, Generate Matchday Graphics button

### 🚧 In Progress
- Production deployment optimization
- Enhanced monitoring and logging

### 📋 Future Enhancements
- Scheduled content generation
- Automated email syncing
- Advanced analytics dashboard
- Mobile app (React Native)

---

## 🔐 Security

- **Row Level Security**: All data is org-scoped
- **Server-Side AI**: All AI calls happen in Edge Functions
- **Encrypted Storage**: OAuth tokens and AI keys are encrypted
- **BYOK Support**: Users can bring their own AI keys
- **Role-Based Access**: Granular permissions per user

---

## 📚 Documentation

### Entry Points
- **`docs/CONTEXT.md`**: Main entry point for LLMs
- **`docs/ARCHITECTURE.md`**: System architecture details
- **`docs/UPDATE.md`**: Changelog and implementation history

### Context Engineering Files
- **`.cursor/rules.md`**: Cursor IDE rules
- **`.gemini`**: Gemini AI context
- **`.claude`**: Claude AI context

### User Documentation
- **`docs/USERGUIDE.md`**: Complete user guide
- **`docs/USECASES.md`**: All use cases
- **`docs/API_DOCUMENTATION.md`**: Service reference

---

## 🛠️ Development

### Getting Started
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

### Testing
- **Framework**: Vitest
- **Coverage**: 88 tests across 7 files
- **Run**: `npm test`

### Code Quality
- **Linter**: Biome
- **Format**: Biome formatter
- **Type Checking**: TypeScript strict mode

---

## 📈 Roadmap

### Q1 2025
- Enhanced analytics dashboard
- Advanced content scheduling
- Mobile responsiveness improvements

### Q2 2025
- Mobile app (React Native)
- Advanced AI features
- Integration marketplace

---

## 🤝 Contributing

See `docs/DEVELOPMENT_GUIDE.md` for detailed contribution guidelines.

---

## 📄 License

[License information here]

---

**PitchSide AI - Empowering Football Clubs with AI-Powered Content & Commercial Operations**
