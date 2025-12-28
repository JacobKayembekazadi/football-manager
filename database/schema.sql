-- PitchSide AI Database Schema (Multi-tenant)
-- Supabase PostgreSQL Schema
--
-- Tenancy model:
--   orgs (workspace) -> many clubs
--   org_members controls user access + role
--   All rows are scoped by org_id (enforced with triggers)
--
-- Inbox model:
--   email_connections store per-user connections and shared master inboxes (org + club)
--   inbox_emails store normalized messages for Master/My inbox views
--
-- AI model:
--   managed AI by default (platform key via Edge Function)
--   BYOK supported at org and club levels (club overrides org)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Helpers
-- ============================================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- Core tenancy tables
-- ============================================================================

CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL, -- auth.users.id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_orgs_updated_at
BEFORE UPDATE ON orgs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- auth.users.id
  role TEXT NOT NULL CHECK (role IN ('owner','admin','editor','viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE TRIGGER update_org_members_updated_at
BEFORE UPDATE ON org_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Org membership helpers (used by RLS policies)
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_members m
    WHERE m.org_id = p_org_id
      AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION org_role(p_org_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT m.role
  FROM org_members m
  WHERE m.org_id = p_org_id
    AND m.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(org_role(p_org_id) IN ('owner','admin'), false);
$$;

CREATE OR REPLACE FUNCTION is_org_editor(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(org_role(p_org_id) IN ('owner','admin','editor'), false);
$$;

CREATE OR REPLACE FUNCTION org_has_no_members(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = p_org_id);
$$;

-- ============================================================================
-- Domain tables (org-scoped)
-- ============================================================================

CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tone_context TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_clubs_updated_at
BEFORE UPDATE ON clubs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Child tables include org_id and will be set/validated by triggers

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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

CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON players
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE fixtures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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

CREATE TRIGGER update_fixtures_updated_at
BEFORE UPDATE ON fixtures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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

CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON content_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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

CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON sponsors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE admin_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
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

CREATE TRIGGER update_admin_tasks_updated_at
BEFORE UPDATE ON admin_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Email Connections + Inbox
-- ============================================================================

CREATE TABLE email_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL, -- auth.users.id
  provider TEXT NOT NULL CHECK (provider IN ('gmail','outlook')),
  email_address TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('private','shared')),
  is_master BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','error')),
  scopes TEXT[],
  access_token_ciphertext TEXT,
  access_token_iv TEXT,
  refresh_token_ciphertext TEXT,
  refresh_token_iv TEXT,
  expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (NOT (is_master AND visibility = 'private'))
);

CREATE TRIGGER update_email_connections_updated_at
BEFORE UPDATE ON email_connections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Master inbox uniqueness (one per org/provider; one per club/provider)
CREATE UNIQUE INDEX uq_email_connections_org_master_provider
ON email_connections(org_id, provider)
WHERE (club_id IS NULL AND is_master = TRUE);

CREATE UNIQUE INDEX uq_email_connections_club_master_provider
ON email_connections(club_id, provider)
WHERE (club_id IS NOT NULL AND is_master = TRUE);

CREATE TABLE inbox_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  connection_id UUID NOT NULL REFERENCES email_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail','outlook')),
  external_id TEXT NOT NULL,
  thread_id TEXT,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_id)
);

CREATE TRIGGER update_inbox_emails_updated_at
BEFORE UPDATE ON inbox_emails
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AI Conversations
-- ============================================================================

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON ai_conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI Settings + Usage
-- ============================================================================

CREATE TABLE org_ai_settings (
  org_id UUID PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'managed' CHECK (mode IN ('managed','byok','hybrid')),
  byok_key_ciphertext TEXT,
  byok_key_iv TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_org_ai_settings_updated_at
BEFORE UPDATE ON org_ai_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE club_ai_settings (
  club_id UUID PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'inherit' CHECK (mode IN ('inherit','byok')),
  byok_key_ciphertext TEXT,
  byok_key_iv TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_club_ai_settings_updated_at
BEFORE UPDATE ON club_ai_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE ai_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  user_id UUID, -- auth.users.id
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error')),
  approx_input_chars INTEGER,
  approx_output_chars INTEGER,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Consistency triggers: set org_id from parent references
-- ============================================================================

CREATE OR REPLACE FUNCTION set_org_id_from_club()
RETURNS TRIGGER AS $$
BEGIN
  SELECT c.org_id INTO NEW.org_id FROM clubs c WHERE c.id = NEW.club_id;
  IF NEW.org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid club_id % (org_id not found)', NEW.club_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_players_org_id
BEFORE INSERT OR UPDATE OF club_id ON players
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE TRIGGER set_fixtures_org_id
BEFORE INSERT OR UPDATE OF club_id ON fixtures
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE TRIGGER set_content_items_org_id
BEFORE INSERT OR UPDATE OF club_id ON content_items
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE TRIGGER set_sponsors_org_id
BEFORE INSERT OR UPDATE OF club_id ON sponsors
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE TRIGGER set_admin_tasks_org_id
BEFORE INSERT OR UPDATE OF club_id ON admin_tasks
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE TRIGGER set_ai_conversations_org_id
BEFORE INSERT OR UPDATE OF club_id ON ai_conversations
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE TRIGGER set_club_ai_settings_org_id
BEFORE INSERT OR UPDATE OF club_id ON club_ai_settings
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE OR REPLACE FUNCTION set_inbox_email_org_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT ec.org_id INTO NEW.org_id FROM email_connections ec WHERE ec.id = NEW.connection_id;
  IF NEW.org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid connection_id % (org_id not found)', NEW.connection_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_inbox_emails_org_id
BEFORE INSERT OR UPDATE OF connection_id ON inbox_emails
FOR EACH ROW EXECUTE FUNCTION set_inbox_email_org_id();

CREATE OR REPLACE FUNCTION set_ai_message_org_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT ac.org_id INTO NEW.org_id FROM ai_conversations ac WHERE ac.id = NEW.conversation_id;
  IF NEW.org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid conversation_id % (org_id not found)', NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_ai_messages_org_id
BEFORE INSERT OR UPDATE OF conversation_id ON ai_messages
FOR EACH ROW EXECUTE FUNCTION set_ai_message_org_id();

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);

CREATE INDEX idx_clubs_org_id ON clubs(org_id);

CREATE INDEX idx_players_org_id ON players(org_id);
CREATE INDEX idx_players_club_id ON players(club_id);

CREATE INDEX idx_fixtures_org_id ON fixtures(org_id);
CREATE INDEX idx_fixtures_club_id ON fixtures(club_id);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_kickoff_time ON fixtures(kickoff_time);

CREATE INDEX idx_content_items_org_id ON content_items(org_id);
CREATE INDEX idx_content_items_club_id ON content_items(club_id);
CREATE INDEX idx_content_items_fixture_id ON content_items(fixture_id);
CREATE INDEX idx_content_items_status ON content_items(status);

CREATE INDEX idx_sponsors_org_id ON sponsors(org_id);
CREATE INDEX idx_sponsors_club_id ON sponsors(club_id);

CREATE INDEX idx_admin_tasks_org_id ON admin_tasks(org_id);
CREATE INDEX idx_admin_tasks_club_id ON admin_tasks(club_id);
CREATE INDEX idx_admin_tasks_status ON admin_tasks(status);

CREATE INDEX idx_email_connections_org_id ON email_connections(org_id);
CREATE INDEX idx_email_connections_club_id ON email_connections(club_id);
CREATE INDEX idx_email_connections_owner_user_id ON email_connections(owner_user_id);
CREATE INDEX idx_email_connections_visibility ON email_connections(visibility);

CREATE INDEX idx_inbox_emails_org_id ON inbox_emails(org_id);
CREATE INDEX idx_inbox_emails_club_id ON inbox_emails(club_id);
CREATE INDEX idx_inbox_emails_connection_id ON inbox_emails(connection_id);
CREATE INDEX idx_inbox_emails_is_read ON inbox_emails(is_read);
CREATE INDEX idx_inbox_emails_received_at ON inbox_emails(received_at);

CREATE INDEX idx_ai_conversations_org_id ON ai_conversations(org_id);
CREATE INDEX idx_ai_conversations_club_id ON ai_conversations(club_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_org_id ON ai_messages(org_id);

CREATE INDEX idx_ai_usage_events_org_id ON ai_usage_events(org_id);
CREATE INDEX idx_ai_usage_events_club_id ON ai_usage_events(club_id);
CREATE INDEX idx_ai_usage_events_created_at ON ai_usage_events(created_at);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

-- orgs: members OR creator can read; any authed user can create an org
-- Note: Using direct EXISTS check instead of is_org_member() to avoid recursion
CREATE POLICY "orgs_select_member_or_creator" ON orgs
FOR SELECT USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = orgs.id 
    AND org_members.user_id = auth.uid()
  )
);

CREATE POLICY "orgs_insert_authed" ON orgs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "orgs_update_admin" ON orgs
FOR UPDATE USING (is_org_admin(id)) WITH CHECK (is_org_admin(id));

-- Simplified SELECT to avoid recursive RLS lookups
CREATE POLICY "org_members_select_any" ON org_members
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "org_members_insert_admin_or_bootstrap_owner" ON org_members
FOR INSERT WITH CHECK (
  (is_org_admin(org_id))
  OR (org_has_no_members(org_id) AND user_id = auth.uid() AND role = 'owner')
);

CREATE POLICY "org_members_update_admin" ON org_members
FOR UPDATE USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));

CREATE POLICY "org_members_delete_admin" ON org_members
FOR DELETE USING (is_org_admin(org_id));

-- clubs: any member can read; admin can write
CREATE POLICY "clubs_select_member" ON clubs
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "clubs_insert_admin" ON clubs
FOR INSERT WITH CHECK (is_org_admin(org_id));

CREATE POLICY "clubs_update_admin" ON clubs
FOR UPDATE USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));

CREATE POLICY "clubs_delete_admin" ON clubs
FOR DELETE USING (is_org_admin(org_id));

-- player/fixture/content/sponsor/task: members read; editors+ write; admins delete
CREATE POLICY "players_select_member" ON players
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "players_insert_editor" ON players
FOR INSERT WITH CHECK (is_org_editor(org_id));

CREATE POLICY "players_update_editor" ON players
FOR UPDATE USING (is_org_editor(org_id)) WITH CHECK (is_org_editor(org_id));

CREATE POLICY "players_delete_admin" ON players
FOR DELETE USING (is_org_admin(org_id));

CREATE POLICY "fixtures_select_member" ON fixtures
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "fixtures_insert_editor" ON fixtures
FOR INSERT WITH CHECK (is_org_editor(org_id));

CREATE POLICY "fixtures_update_editor" ON fixtures
FOR UPDATE USING (is_org_editor(org_id)) WITH CHECK (is_org_editor(org_id));

CREATE POLICY "fixtures_delete_admin" ON fixtures
FOR DELETE USING (is_org_admin(org_id));

CREATE POLICY "content_items_select_member" ON content_items
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "content_items_insert_editor" ON content_items
FOR INSERT WITH CHECK (is_org_editor(org_id));

CREATE POLICY "content_items_update_editor" ON content_items
FOR UPDATE USING (is_org_editor(org_id)) WITH CHECK (is_org_editor(org_id));

CREATE POLICY "content_items_delete_admin" ON content_items
FOR DELETE USING (is_org_admin(org_id));

CREATE POLICY "sponsors_select_member" ON sponsors
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "sponsors_insert_editor" ON sponsors
FOR INSERT WITH CHECK (is_org_editor(org_id));

CREATE POLICY "sponsors_update_editor" ON sponsors
FOR UPDATE USING (is_org_editor(org_id)) WITH CHECK (is_org_editor(org_id));

CREATE POLICY "sponsors_delete_admin" ON sponsors
FOR DELETE USING (is_org_admin(org_id));

CREATE POLICY "admin_tasks_select_member" ON admin_tasks
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "admin_tasks_insert_editor" ON admin_tasks
FOR INSERT WITH CHECK (is_org_editor(org_id));

CREATE POLICY "admin_tasks_update_editor" ON admin_tasks
FOR UPDATE USING (is_org_editor(org_id)) WITH CHECK (is_org_editor(org_id));

CREATE POLICY "admin_tasks_delete_admin" ON admin_tasks
FOR DELETE USING (is_org_admin(org_id));

-- email_connections: private only owner; shared any member (still org-scoped)
CREATE POLICY "email_connections_select_owner_or_shared_member" ON email_connections
FOR SELECT USING (
  (visibility = 'private' AND owner_user_id = auth.uid())
  OR (visibility = 'shared' AND is_org_member(org_id))
);

CREATE POLICY "email_connections_insert_owner_or_admin" ON email_connections
FOR INSERT WITH CHECK (
  (owner_user_id = auth.uid() AND is_org_member(org_id))
  AND (visibility = 'private' OR is_org_admin(org_id))
  AND (is_master = FALSE OR is_org_admin(org_id))
);

CREATE POLICY "email_connections_update_owner_or_admin" ON email_connections
FOR UPDATE USING (
  (visibility = 'private' AND owner_user_id = auth.uid())
  OR (visibility = 'shared' AND is_org_admin(org_id))
) WITH CHECK (
  (visibility = 'private' AND owner_user_id = auth.uid())
  OR (visibility = 'shared' AND is_org_admin(org_id))
);

CREATE POLICY "email_connections_delete_owner_or_admin" ON email_connections
FOR DELETE USING (
  (visibility = 'private' AND owner_user_id = auth.uid())
  OR (visibility = 'shared' AND is_org_admin(org_id))
);

-- inbox_emails: access follows connection visibility/owner
CREATE POLICY "inbox_emails_select_via_connection" ON inbox_emails
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM email_connections ec
    WHERE ec.id = inbox_emails.connection_id
      AND ec.org_id = inbox_emails.org_id
      AND (
        (ec.visibility = 'private' AND ec.owner_user_id = auth.uid())
        OR (ec.visibility = 'shared' AND is_org_member(ec.org_id))
      )
  )
);

CREATE POLICY "inbox_emails_insert_editor" ON inbox_emails
FOR INSERT WITH CHECK (is_org_member(org_id));

CREATE POLICY "inbox_emails_update_editor" ON inbox_emails
FOR UPDATE USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));

-- AI: members can read/write their org scope (chat + logs)
CREATE POLICY "ai_conversations_select_member" ON ai_conversations
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "ai_conversations_insert_member" ON ai_conversations
FOR INSERT WITH CHECK (is_org_member(org_id));

CREATE POLICY "ai_conversations_update_member" ON ai_conversations
FOR UPDATE USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));

CREATE POLICY "ai_messages_select_member" ON ai_messages
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "ai_messages_insert_member" ON ai_messages
FOR INSERT WITH CHECK (is_org_member(org_id));

-- AI settings: admin only
CREATE POLICY "org_ai_settings_select_admin" ON org_ai_settings
FOR SELECT USING (is_org_admin(org_id));

CREATE POLICY "org_ai_settings_upsert_admin" ON org_ai_settings
FOR ALL USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));

CREATE POLICY "club_ai_settings_select_admin" ON club_ai_settings
FOR SELECT USING (is_org_admin(org_id));

CREATE POLICY "club_ai_settings_upsert_admin" ON club_ai_settings
FOR ALL USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));

-- AI usage logs: admin can read; edge functions can insert as editor/member depending on design
CREATE POLICY "ai_usage_events_select_admin" ON ai_usage_events
FOR SELECT USING (is_org_admin(org_id));

CREATE POLICY "ai_usage_events_insert_member" ON ai_usage_events
FOR INSERT WITH CHECK (is_org_member(org_id));

-- ============================================================================
-- User Onboarding State (per user + org)
-- ============================================================================

CREATE TABLE user_onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- auth.users.id
  welcome_completed BOOLEAN DEFAULT FALSE,
  tour_completed BOOLEAN DEFAULT FALSE,
  completed_modules TEXT[] DEFAULT '{}',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE user_onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_user_onboarding_state_updated_at
BEFORE UPDATE ON user_onboarding_state
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_user_onboarding_state_org_user ON user_onboarding_state(org_id, user_id);

-- RLS: user can only access their own onboarding state within orgs they belong to
CREATE POLICY "user_onboarding_state_select_own" ON user_onboarding_state
FOR SELECT USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = user_onboarding_state.org_id 
    AND org_members.user_id = auth.uid()
  )
);

CREATE POLICY "user_onboarding_state_insert_own" ON user_onboarding_state
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = user_onboarding_state.org_id 
    AND org_members.user_id = auth.uid()
  )
);

CREATE POLICY "user_onboarding_state_update_own" ON user_onboarding_state
FOR UPDATE USING (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = user_onboarding_state.org_id 
    AND org_members.user_id = auth.uid()
  )
) WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = user_onboarding_state.org_id 
    AND org_members.user_id = auth.uid()
  )
);

-- ============================================================================
-- Fan Sentiment Snapshots (Twitter sentiment analysis)
-- ============================================================================

CREATE TABLE fan_sentiment_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sentiment_score INTEGER NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  sentiment_mood TEXT NOT NULL CHECK (sentiment_mood IN ('euphoric', 'happy', 'neutral', 'worried', 'angry')),
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  total_mentions INTEGER DEFAULT 0,
  keywords_analyzed TEXT[],
  data_source TEXT DEFAULT 'twitter',
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, snapshot_date)
);

CREATE INDEX idx_fan_sentiment_club_date ON fan_sentiment_snapshots(club_id, snapshot_date DESC);
CREATE INDEX idx_fan_sentiment_org ON fan_sentiment_snapshots(org_id);

CREATE TRIGGER update_fan_sentiment_snapshots_updated_at
BEFORE UPDATE ON fan_sentiment_snapshots
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fan_sentiment_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view sentiment for their org
CREATE POLICY "fan_sentiment_snapshots_select_member" ON fan_sentiment_snapshots
FOR SELECT USING (is_org_member(org_id));

-- RLS: Service role can insert/update (Edge Functions use service role)
CREATE POLICY "fan_sentiment_snapshots_insert_service" ON fan_sentiment_snapshots
FOR INSERT WITH CHECK (true);

CREATE POLICY "fan_sentiment_snapshots_update_service" ON fan_sentiment_snapshots
FOR UPDATE USING (true) WITH CHECK (true);
