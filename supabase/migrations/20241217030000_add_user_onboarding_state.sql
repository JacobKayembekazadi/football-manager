-- User onboarding state table (per user + org)
-- Tracks welcome modal, tour completion, and education module progress

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

-- Enable RLS
ALTER TABLE user_onboarding_state ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_user_onboarding_state_updated_at
BEFORE UPDATE ON user_onboarding_state
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_user_onboarding_state_org_user ON user_onboarding_state(org_id, user_id);

-- RLS Policies: user can only access their own onboarding state within orgs they belong to
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



