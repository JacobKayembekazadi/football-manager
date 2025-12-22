# Database Schema Documentation

## Overview

This directory contains the database schema for PitchSide AI. The application uses Supabase (PostgreSQL) for data persistence.

## Schema Files

- `schema.sql` - Complete database schema with tables, indexes, triggers, and RLS policies

## Database Structure

### Core Tables

#### Tenancy

1. **orgs** - Workspace/account (multi-tenant boundary)
2. **org_members** - Workspace membership and role (owner/admin/editor/viewer)

#### Domain

3. **clubs** - Clubs within an org
4. **players** - Player roster with stats and form
5. **fixtures** - Match schedule and results
6. **content_items** - Generated content (previews, reports, social posts)
7. **sponsors** - Sponsor relationships and contracts
8. **admin_tasks** - Administrative task management

#### Inbox + Integrations

9. **email_connections** - Gmail/Outlook OAuth connections (per-user + shared master)
10. **inbox_emails** - Normalized email inbox items (Master/My inbox)

#### AI

11. **org_ai_settings** - Org AI mode and optional BYOK key
12. **club_ai_settings** - Club-level override for BYOK
13. **ai_usage_events** - Usage logging (quotas, cost visibility)
14. **ai_conversations** - AI assistant conversation sessions
15. **ai_messages** - Individual messages in conversations

### Relationships

```
orgs (1) ──< (many) clubs
orgs (1) ──< (many) org_members

clubs (1) ──< (many) players
clubs (1) ──< (many) fixtures
clubs (1) ──< (many) content_items
clubs (1) ──< (many) sponsors
clubs (1) ──< (many) admin_tasks
clubs (1) ──< (many) ai_conversations

fixtures (1) ──< (many) content_items

ai_conversations (1) ──< (many) ai_messages

email_connections (1) ──< (many) inbox_emails
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

RLS is enabled and enforced using `org_members` membership and role checks. Access is scoped by `org_id`, with private/shared inbox rules enforced through `email_connections`.

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



