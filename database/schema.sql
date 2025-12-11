-- PitchSide AI Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clubs table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tone_context TEXT NOT NULL,
    primary_color TEXT NOT NULL,
    secondary_color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
    number INTEGER NOT NULL,
    is_captain BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    stats JSONB NOT NULL DEFAULT '{"pace": 70, "shooting": 70, "passing": 70, "dribbling": 70, "defending": 70, "physical": 70}'::jsonb,
    form NUMERIC(3,1) NOT NULL DEFAULT 7.0 CHECK (form >= 0 AND form <= 10),
    highlight_uri TEXT,
    analysis TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, number)
);

-- Fixtures table
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    opponent TEXT NOT NULL,
    kickoff_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'COMPLETED', 'LIVE')),
    result_home INTEGER,
    result_away INTEGER,
    key_events TEXT,
    scorers TEXT[],
    man_of_the_match TEXT,
    stats JSONB,
    venue TEXT NOT NULL CHECK (venue IN ('Home', 'Away')),
    competition TEXT,
    attendance INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content items table
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('PREVIEW', 'REPORT', 'SOCIAL', 'CAPTION', 'NEWSLETTER', 'EMAIL', 'ARTICLE', 'GRAPHIC_COPY')),
    platform TEXT CHECK (platform IN ('Twitter', 'Instagram', 'Website', 'Email')),
    body TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'APPROVED', 'PUBLISHED')),
    title TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsors table
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('Platinum', 'Gold', 'Silver')),
    value TEXT NOT NULL,
    contract_end DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Expiring', 'Negotiating')),
    logo_initials TEXT NOT NULL,
    generated_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin tasks table
CREATE TABLE admin_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    deadline DATE NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    type TEXT NOT NULL CHECK (type IN ('League', 'Finance', 'Facilities', 'Media')),
    status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    action_plan TEXT,
    email_draft TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbox emails table
CREATE TABLE inbox_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    from_name TEXT NOT NULL,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview TEXT NOT NULL,
    body TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('League', 'Sponsor', 'Fan', 'Media')),
    is_read BOOLEAN DEFAULT FALSE,
    sentiment_score INTEGER,
    sentiment_mood TEXT,
    reply_draft TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI messages table
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_fixtures_club_id ON fixtures(club_id);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_kickoff_time ON fixtures(kickoff_time);
CREATE INDEX idx_content_items_club_id ON content_items(club_id);
CREATE INDEX idx_content_items_fixture_id ON content_items(fixture_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_sponsors_club_id ON sponsors(club_id);
CREATE INDEX idx_admin_tasks_club_id ON admin_tasks(club_id);
CREATE INDEX idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX idx_inbox_emails_club_id ON inbox_emails(club_id);
CREATE INDEX idx_inbox_emails_is_read ON inbox_emails(is_read);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_conversations_club_id ON ai_conversations(club_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON fixtures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON sponsors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_tasks_updated_at BEFORE UPDATE ON admin_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inbox_emails_updated_at BEFORE UPDATE ON inbox_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- For MVP, allow all operations (can be restricted later based on auth)
-- In production, these should be restricted based on user authentication
CREATE POLICY "Allow all operations on clubs" ON clubs FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on fixtures" ON fixtures FOR ALL USING (true);
CREATE POLICY "Allow all operations on content_items" ON content_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on sponsors" ON sponsors FOR ALL USING (true);
CREATE POLICY "Allow all operations on admin_tasks" ON admin_tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations on inbox_emails" ON inbox_emails FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_conversations" ON ai_conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_messages" ON ai_messages FOR ALL USING (true);

