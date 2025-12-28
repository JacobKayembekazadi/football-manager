# Data Model Documentation

**Last Updated**: 2024-12-11  
**Purpose**: Complete database schema reference  
**For LLMs**: Use this to understand database structure and relationships

## Database Overview

- **Database**: PostgreSQL (via Supabase)
- **Schema File**: `database/schema.sql`
- **Primary Keys**: All tables use UUID
- **Timestamps**: All tables have `created_at` and `updated_at` (auto-updated)

## Entity Relationship Diagram

```
clubs (1)
  ├── players (many)
  ├── fixtures (many)
  ├── content_items (many)
  ├── sponsors (many)
  ├── admin_tasks (many)
  ├── inbox_emails (many)
  └── ai_conversations (many)
        └── ai_messages (many)

fixtures (1)
  └── content_items (many)
```

## Tables

### clubs

Primary entity representing a football club.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Club name |
| nickname | TEXT | Club nickname |
| slug | TEXT | URL-friendly identifier (unique) |
| tone_context | TEXT | AI tone/voice description |
| primary_color | TEXT | Hex color code |
| secondary_color | TEXT | Hex color code |
| created_at | TIMESTAMPTZ | Auto-set on creation |
| updated_at | TIMESTAMPTZ | Auto-updated on changes |

**Relationships**: One-to-many with all other tables

### players

Player roster for a club.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| club_id | UUID | Foreign key to clubs |
| name | TEXT | Player name |
| position | TEXT | 'GK', 'DEF', 'MID', or 'FWD' |
| number | INTEGER | Kit number (unique per club) |
| is_captain | BOOLEAN | Captain status |
| image_url | TEXT | Profile image URL |
| stats | JSONB | Player stats object |
| form | NUMERIC(3,1) | Current form (0-10) |
| highlight_uri | TEXT | Video highlight URL |
| analysis | TEXT | AI-generated scouting report |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Stats JSONB Structure**:
```json
{
  "pace": 70,
  "shooting": 70,
  "passing": 70,
  "dribbling": 70,
  "defending": 70,
  "physical": 70
}
```

**Constraints**: 
- `position` must be one of: 'GK', 'DEF', 'MID', 'FWD'
- `form` must be between 0 and 10
- `(club_id, number)` must be unique

### fixtures

Match schedule and results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| club_id | UUID | Foreign key to clubs |
| opponent | TEXT | Opponent team name |
| kickoff_time | TIMESTAMPTZ | Match date/time |
| status | TEXT | 'SCHEDULED', 'COMPLETED', or 'LIVE' |
| result_home | INTEGER | Home team score |
| result_away | INTEGER | Away team score |
| key_events | TEXT | Match notes/events |
| scorers | TEXT[] | Array of scorer names |
| man_of_the_match | TEXT | MOTM player name |
| stats | JSONB | Match statistics |
| venue | TEXT | 'Home' or 'Away' |
| competition | TEXT | Competition name |
| attendance | INTEGER | Attendance number |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Stats JSONB Structure**:
```json
{
  "home_possession": 50,
  "away_possession": 50,
  "home_shots": 10,
  "away_shots": 8,
  "home_xg": 1.5,
  "away_xg": 1.2
}
```

**Constraints**:
- `status` must be one of: 'SCHEDULED', 'COMPLETED', 'LIVE'
- `venue` must be 'Home' or 'Away'

### content_items

Generated content (previews, reports, social posts, etc.).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| club_id | UUID | Foreign key to clubs |
| fixture_id | UUID | Foreign key to fixtures (nullable) |
| type | TEXT | Content type |
| platform | TEXT | Publishing platform |
| body | TEXT | Content text |
| status | TEXT | 'DRAFT', 'APPROVED', or 'PUBLISHED' |
| title | TEXT | Optional title |
| published_at | TIMESTAMPTZ | Set when status = 'PUBLISHED' |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Content Types**: 'PREVIEW', 'REPORT', 'SOCIAL', 'CAPTION', 'NEWSLETTER', 'EMAIL', 'ARTICLE', 'GRAPHIC_COPY'

**Platforms**: 'Twitter', 'Instagram', 'Website', 'Email'

**Constraints**:
- `type` must be one of the valid content types
- `platform` must be one of the valid platforms (if provided)
- `status` must be one of: 'DRAFT', 'APPROVED', 'PUBLISHED'

### sponsors

Sponsor relationships and contracts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| club_id | UUID | Foreign key to clubs |
| name | TEXT | Sponsor name |
| sector | TEXT | Industry sector |
| tier | TEXT | 'Platinum', 'Gold', or 'Silver' |
| value | TEXT | Contract value (e.g., '£150,000') |
| contract_end | DATE | Contract expiration date |
| status | TEXT | 'Active', 'Expiring', or 'Negotiating' |
| logo_initials | TEXT | Logo abbreviation |
| generated_content | JSONB | Stored generated content |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Generated Content JSONB Structure**:
```json
{
  "ROI": {
    "content": "...",
    "saved_at": "2024-12-11T10:00:00Z"
  },
  "CREATIVE": { ... },
  "NEGOTIATION": { ... }
}
```

**Constraints**:
- `tier` must be: 'Platinum', 'Gold', or 'Silver'
- `status` must be: 'Active', 'Expiring', or 'Negotiating'

### admin_tasks

Administrative tasks and deadlines.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| club_id | UUID | Foreign key to clubs |
| title | TEXT | Task title |
| deadline | DATE | Due date |
| priority | TEXT | 'High', 'Medium', or 'Low' |
| type | TEXT | 'League', 'Finance', 'Facilities', or 'Media' |
| status | TEXT | 'Pending', 'In Progress', or 'Completed' |
| action_plan | TEXT | AI-generated action plan (HTML) |
| email_draft | TEXT | Draft email for task |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Constraints**:
- `priority` must be: 'High', 'Medium', or 'Low'
- `type` must be: 'League', 'Finance', 'Facilities', or 'Media'
- `status` must be: 'Pending', 'In Progress', or 'Completed'

### inbox_emails

Email inbox management.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| club_id | UUID | Foreign key to clubs |
| from_name | TEXT | Sender name |
| from_email | TEXT | Sender email |
| subject | TEXT | Email subject |
| preview | TEXT | Email preview text |
| body | TEXT | Full email body |
| received_at | TIMESTAMPTZ | When email was received |
| category | TEXT | 'League', 'Sponsor', 'Fan', or 'Media' |
| is_read | BOOLEAN | Read status |
| sentiment_score | INTEGER | AI sentiment score (0-100) |
| sentiment_mood | TEXT | Sentiment label |
| reply_draft | TEXT | Draft reply text |
| sent_at | TIMESTAMPTZ | When reply was sent |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Constraints**:
- `category` must be: 'League', 'Sponsor', 'Fan', or 'Media'

### ai_conversations

AI assistant conversation sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| club_id | UUID | Foreign key to clubs |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Relationships**: One-to-many with `ai_messages`

### ai_messages

Individual messages in AI conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | Foreign key to ai_conversations |
| role | TEXT | 'user' or 'assistant' |
| content | TEXT | Message content |
| created_at | TIMESTAMPTZ | Auto-set |

**Constraints**:
- `role` must be: 'user' or 'assistant'

## Indexes

Indexes are created on:
- Foreign keys (`club_id`, `fixture_id`, `conversation_id`)
- Frequently queried fields (`status`, `kickoff_time`, `is_read`)
- Composite indexes where needed

## Triggers

All tables have an `updated_at` trigger that automatically updates the timestamp on row updates.

## Row Level Security (RLS)

RLS is enabled on all tables. Currently, policies allow all operations for MVP. In production, these should be restricted based on user authentication.

## Data Types Reference

- **UUID**: Primary keys (using `uuid-ossp` extension)
- **JSONB**: Complex nested data (stats, generated_content)
- **TEXT[]**: Arrays (e.g., scorers)
- **TIMESTAMPTZ**: Timestamps with timezone (UTC)
- **DATE**: Date-only values
- **BOOLEAN**: True/false values
- **NUMERIC**: Decimal numbers with precision

## Migration Notes

- Run `database/schema.sql` in Supabase SQL Editor to create schema
- Schema includes all tables, indexes, triggers, and RLS policies
- UUID extension is automatically enabled
- All timestamps are stored in UTC

## TypeScript Mappings

Database types map to TypeScript interfaces in `types.ts`:
- Database rows → TypeScript interfaces
- JSONB fields → Nested TypeScript objects
- TEXT[] → TypeScript string arrays
- ENUM-like CHECK constraints → TypeScript union types









