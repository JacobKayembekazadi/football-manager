# Deployment Guide

**Last Updated**: 2024-12-11  
**Purpose**: Setup and deployment instructions  
**For LLMs**: Use this to understand deployment requirements and configuration

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Google Gemini API key
- Git (for version control)

## Local Development Setup

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Environment Variables

Create `.env.local` file in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

**Getting Supabase Credentials**:
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → API
4. Copy "Project URL" → `VITE_SUPABASE_URL`
5. Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

**Getting Gemini API Key**:
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy to `GEMINI_API_KEY`

### 3. Database Setup

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `database/schema.sql`
3. Paste and run in SQL Editor
4. Verify tables are created in Table Editor

### 4. Run Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

## Production Deployment

### Build

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy Options

#### Option 1: Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

#### Option 2: Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy`
3. Add environment variables in Netlify dashboard
4. Deploy: `netlify deploy --prod`

#### Option 3: Static Hosting

Upload `dist/` folder to:
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

**Note**: Environment variables must be set at build time for Vite.

### Environment Variables in Production

Set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (if needed client-side, though recommended to proxy)

## Supabase Edge Functions

### Deploy Email Function

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy: `supabase functions deploy send-email`

### Environment Variables for Edge Functions

Set in Supabase Dashboard → Edge Functions → Settings:
- `RESEND_API_KEY` (or your email service API key)
- `SUPABASE_SERVICE_ROLE_KEY` (for database access)

## Database Migrations

### Running Migrations

1. Open Supabase Dashboard → SQL Editor
2. Copy migration SQL from `database/schema.sql`
3. Run in SQL Editor
4. Verify in Table Editor

### Adding New Migrations

1. Create new SQL file in `database/migrations/`
2. Document changes in `database/README.md`
3. Run in Supabase SQL Editor

## Configuration

### Vite Configuration

See `vite.config.ts`:
- Port: 3000
- Host: 0.0.0.0 (for network access)
- Environment variables are injected at build time

### Supabase Configuration

- RLS policies: Currently allow all (update for production)
- Database: PostgreSQL 15+
- Region: Choose closest to users

## Troubleshooting

### Common Issues

**"Supabase credentials not found"**
- Check `.env.local` exists
- Verify variable names match exactly
- Restart dev server after adding variables

**"Database connection failed"**
- Verify Supabase URL and key
- Check Supabase project is active
- Verify RLS policies allow access

**"AI generation failed"**
- Check Gemini API key is valid
- Verify API key has sufficient quota
- Check network connectivity

**"Build fails"**
- Clear `node_modules` and reinstall
- Check Node.js version (18+)
- Verify all dependencies are installed

## Security Considerations

### Production Checklist

- [ ] Update RLS policies to restrict access
- [ ] Use service role key only server-side
- [ ] Enable CORS restrictions
- [ ] Use environment variables (never commit keys)
- [ ] Enable Supabase database backups
- [ ] Set up monitoring and alerts

### API Key Security

**Current State**: API keys are in client-side code (not secure for production)

**Recommended**:
- Proxy AI calls through backend API
- Store API keys server-side only
- Use Supabase Edge Functions for AI operations
- Implement rate limiting

## Monitoring

### Supabase Dashboard

- Monitor database usage
- Check query performance
- Review error logs
- Track API usage

### Application Monitoring

Consider adding:
- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Plausible)
- Performance monitoring (Vercel Analytics)

## Backup and Recovery

### Database Backups

Supabase provides automatic daily backups. To restore:
1. Go to Supabase Dashboard → Database → Backups
2. Select backup point
3. Restore to new database or current

### Manual Backup

Export data using Supabase Dashboard → Database → Export

## Scaling Considerations

### Database

- Monitor query performance
- Add indexes for slow queries
- Consider read replicas for high traffic

### Application

- Use CDN for static assets
- Enable caching where appropriate
- Consider server-side rendering for SEO

### AI Operations

- Implement rate limiting
- Cache AI responses where possible
- Use streaming for long responses
- Monitor API costs

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Gemini API Docs**: https://ai.google.dev/docs

