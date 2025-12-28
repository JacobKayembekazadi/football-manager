-- Migration: Fix missing tables for fresh deployments
-- Version: 3.0.3
-- Date: 2024-12-28

-- ============================================================================
-- User Onboarding State (already exists in some deployments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_onboarding_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  welcome_completed BOOLEAN DEFAULT FALSE,
  tour_completed BOOLEAN DEFAULT FALSE,
  completed_modules TEXT[] DEFAULT '{}',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Enable RLS
ALTER TABLE user_onboarding_state ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_onboarding_state_org_user 
  ON user_onboarding_state(org_id, user_id);

-- Policies (using DROP IF EXISTS + CREATE pattern for idempotency)
DROP POLICY IF EXISTS "user_onboarding_state_select_own" ON user_onboarding_state;
CREATE POLICY "user_onboarding_state_select_own" ON user_onboarding_state
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_onboarding_state_insert_own" ON user_onboarding_state;
CREATE POLICY "user_onboarding_state_insert_own" ON user_onboarding_state
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_onboarding_state_update_own" ON user_onboarding_state;
CREATE POLICY "user_onboarding_state_update_own" ON user_onboarding_state
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- Fan Sentiment Snapshots (already exists in some deployments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fan_sentiment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable RLS
ALTER TABLE fan_sentiment_snapshots ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fan_sentiment_club_date 
  ON fan_sentiment_snapshots(club_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_fan_sentiment_org 
  ON fan_sentiment_snapshots(org_id);

-- Policies
DROP POLICY IF EXISTS "fan_sentiment_select_member" ON fan_sentiment_snapshots;
CREATE POLICY "fan_sentiment_select_member" ON fan_sentiment_snapshots
  FOR SELECT USING (is_org_member(org_id));

DROP POLICY IF EXISTS "fan_sentiment_insert_member" ON fan_sentiment_snapshots;
CREATE POLICY "fan_sentiment_insert_member" ON fan_sentiment_snapshots
  FOR INSERT WITH CHECK (is_org_member(org_id));

DROP POLICY IF EXISTS "fan_sentiment_update_member" ON fan_sentiment_snapshots;
CREATE POLICY "fan_sentiment_update_member" ON fan_sentiment_snapshots
  FOR UPDATE USING (is_org_member(org_id));

-- ============================================================================
-- Update trigger for updated_at columns
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers (using DROP IF EXISTS + CREATE pattern)
DROP TRIGGER IF EXISTS update_user_onboarding_state_updated_at ON user_onboarding_state;
CREATE TRIGGER update_user_onboarding_state_updated_at
  BEFORE UPDATE ON user_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fan_sentiment_snapshots_updated_at ON fan_sentiment_snapshots;
CREATE TRIGGER update_fan_sentiment_snapshots_updated_at
  BEFORE UPDATE ON fan_sentiment_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
