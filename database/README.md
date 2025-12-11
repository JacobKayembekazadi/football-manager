# Database Schema Documentation

## Overview

This directory contains the database schema for PitchSide AI. The application uses Supabase (PostgreSQL) for data persistence.

## Schema Files

- `schema.sql` - Complete database schema with tables, indexes, triggers, and RLS policies

## Database Structure

### Core Tables

1. **clubs** - Club information and branding
2. **players** - Player roster with stats and form
3. **fixtures** - Match schedule and results
4. **content_items** - Generated content (previews, reports, social posts)
5. **sponsors** - Sponsor relationships and contracts
6. **admin_tasks** - Administrative task management
7. **inbox_emails** - Email inbox management
8. **ai_conversations** - AI assistant conversation sessions
9. **ai_messages** - Individual messages in conversations

### Relationships

```
clubs (1) ──< (many) players
clubs (1) ──< (many) fixtures
clubs (1) ──< (many) content_items
clubs (1) ──< (many) sponsors
clubs (1) ──< (many) admin_tasks
clubs (1) ──< (many) inbox_emails
clubs (1) ──< (many) ai_conversations

fixtures (1) ──< (many) content_items

ai_conversations (1) ──< (many) ai_messages
```

## Setup Instructions

1. Create a Supabase project at https://supabase.com
2. Run the SQL in `schema.sql` in the Supabase SQL Editor
3. Copy your Supabase URL and anon key to `.env.local`

## Data Types

- **UUID** - Primary keys (using uuid-ossp extension)
- **JSONB** - For complex nested data (player stats, match stats, sponsor generated content)
- **TEXT[]** - Arrays (e.g., scorers array)
- **TIMESTAMPTZ** - Timestamps with timezone
- **ENUM-like** - Using CHECK constraints for type safety

## Row Level Security (RLS)

Currently, RLS is enabled but policies allow all operations for MVP. In production, these should be restricted based on user authentication.

## Indexes

Indexes are created on:
- Foreign keys (club_id, fixture_id, conversation_id)
- Frequently queried fields (status, kickoff_time, is_read)
- Composite indexes where needed

## Triggers

Automatic `updated_at` timestamp updates are handled by triggers on all tables.

## Notes

- All tables use UUID primary keys
- Soft deletes can be added later if needed
- JSONB fields allow flexible schema evolution
- Timestamps are stored in UTC (TIMESTAMPTZ)

