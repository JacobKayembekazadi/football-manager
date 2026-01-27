-- D14 Ops: Phase 1 Database Schema Additions
-- Purpose: Add task ownership, runbooks, activity log, and escalation tables
-- Date: 2026-01-21
-- 
-- IMPORTANT: This adds 5 NEW tables. Existing tables are NOT modified.

-- ============================================================================
-- 1. ops_tasks - Core task ownership table
-- ============================================================================

CREATE TABLE ops_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
  runbook_id UUID, -- Will reference matchday_runbooks after it's created
  
  -- Ownership
  title TEXT NOT NULL,
  description TEXT,
  owner_user_id UUID NOT NULL,
  created_by_user_id UUID NOT NULL,
  
  -- Timing
  due_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Status (FM-style)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed', 'missed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Dependencies
  depends_on_task_id UUID REFERENCES ops_tasks(id) ON DELETE SET NULL,
  
  -- Categorization
  category TEXT NOT NULL DEFAULT 'admin' CHECK (category IN ('matchday', 'logistics', 'content', 'facilities', 'medical', 'commercial', 'admin')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_ops_tasks_updated_at
BEFORE UPDATE ON ops_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for ops_tasks
CREATE INDEX idx_ops_tasks_org_id ON ops_tasks(org_id);
CREATE INDEX idx_ops_tasks_club_id ON ops_tasks(club_id);
CREATE INDEX idx_ops_tasks_owner_user_id ON ops_tasks(owner_user_id);
CREATE INDEX idx_ops_tasks_status ON ops_tasks(status);
CREATE INDEX idx_ops_tasks_due_at ON ops_tasks(due_at);
CREATE INDEX idx_ops_tasks_fixture_id ON ops_tasks(fixture_id);

-- ============================================================================
-- 2. matchday_runbooks - Reusable runbook templates
-- ============================================================================

CREATE TABLE matchday_runbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  
  -- Timing (relative to kickoff)
  default_lead_hours INTEGER DEFAULT 24,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_matchday_runbooks_updated_at
BEFORE UPDATE ON matchday_runbooks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Now add the foreign key to ops_tasks
ALTER TABLE ops_tasks 
ADD CONSTRAINT fk_ops_tasks_runbook 
FOREIGN KEY (runbook_id) REFERENCES matchday_runbooks(id) ON DELETE SET NULL;

-- Indexes for matchday_runbooks
CREATE INDEX idx_matchday_runbooks_org_id ON matchday_runbooks(org_id);
CREATE INDEX idx_matchday_runbooks_club_id ON matchday_runbooks(club_id);
CREATE INDEX idx_matchday_runbooks_is_template ON matchday_runbooks(is_template);

-- ============================================================================
-- 3. runbook_items - Steps within a runbook
-- ============================================================================

CREATE TABLE runbook_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  runbook_id UUID NOT NULL REFERENCES matchday_runbooks(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Role assignment (who should do this)
  default_role TEXT,
  
  -- Timing (relative to kickoff, in minutes)
  -- Negative = before kickoff, Positive = after
  relative_time_minutes INTEGER NOT NULL DEFAULT -60,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Dependencies
  depends_on_item_id UUID REFERENCES runbook_items(id) ON DELETE SET NULL,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  category TEXT NOT NULL DEFAULT 'admin' CHECK (category IN ('transport', 'kit', 'stadium', 'warmup', 'analyst', 'medical', 'volunteer', 'content', 'commercial')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for runbook_items
CREATE INDEX idx_runbook_items_runbook_id ON runbook_items(runbook_id);
CREATE INDEX idx_runbook_items_sort_order ON runbook_items(sort_order);

-- ============================================================================
-- 4. activity_log - Audit trail for all actions
-- ============================================================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  
  -- Actor
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  
  -- Action
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Details
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity_log
CREATE INDEX idx_activity_log_org_id ON activity_log(org_id);
CREATE INDEX idx_activity_log_club_id ON activity_log(club_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================================================
-- 5. escalation_rules - Notification rules for overdue tasks
-- ============================================================================

CREATE TABLE escalation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  
  -- Trigger conditions
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('task_overdue', 'task_blocked', 'task_missed')),
  trigger_delay_minutes INTEGER DEFAULT 30,
  
  -- Action
  notify_user_ids UUID[] DEFAULT '{}',
  notify_roles TEXT[] DEFAULT '{}',
  notification_channel TEXT NOT NULL DEFAULT 'in_app' CHECK (notification_channel IN ('in_app', 'email', 'both')),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for escalation_rules
CREATE INDEX idx_escalation_rules_org_id ON escalation_rules(org_id);
CREATE INDEX idx_escalation_rules_club_id ON escalation_rules(club_id);
CREATE INDEX idx_escalation_rules_is_active ON escalation_rules(is_active);

-- ============================================================================
-- Row Level Security (RLS) for all new tables
-- ============================================================================

ALTER TABLE ops_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchday_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE runbook_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;

-- ops_tasks: members read; editors+ write
CREATE POLICY "ops_tasks_select_member" ON ops_tasks
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "ops_tasks_insert_editor" ON ops_tasks
FOR INSERT WITH CHECK (is_org_editor(org_id));

CREATE POLICY "ops_tasks_update_editor" ON ops_tasks
FOR UPDATE USING (is_org_editor(org_id)) WITH CHECK (is_org_editor(org_id));

CREATE POLICY "ops_tasks_delete_admin" ON ops_tasks
FOR DELETE USING (is_org_admin(org_id));

-- matchday_runbooks: members read; editors+ write
CREATE POLICY "matchday_runbooks_select_member" ON matchday_runbooks
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "matchday_runbooks_insert_editor" ON matchday_runbooks
FOR INSERT WITH CHECK (is_org_editor(org_id));

CREATE POLICY "matchday_runbooks_update_editor" ON matchday_runbooks
FOR UPDATE USING (is_org_editor(org_id)) WITH CHECK (is_org_editor(org_id));

CREATE POLICY "matchday_runbooks_delete_admin" ON matchday_runbooks
FOR DELETE USING (is_org_admin(org_id));

-- runbook_items: access via runbook's org (join required)
CREATE POLICY "runbook_items_select_member" ON runbook_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM matchday_runbooks r 
    WHERE r.id = runbook_items.runbook_id 
    AND is_org_member(r.org_id)
  )
);

CREATE POLICY "runbook_items_insert_editor" ON runbook_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM matchday_runbooks r 
    WHERE r.id = runbook_items.runbook_id 
    AND is_org_editor(r.org_id)
  )
);

CREATE POLICY "runbook_items_update_editor" ON runbook_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM matchday_runbooks r 
    WHERE r.id = runbook_items.runbook_id 
    AND is_org_editor(r.org_id)
  )
);

CREATE POLICY "runbook_items_delete_admin" ON runbook_items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM matchday_runbooks r 
    WHERE r.id = runbook_items.runbook_id 
    AND is_org_admin(r.org_id)
  )
);

-- activity_log: members read; members insert (for logging their actions)
CREATE POLICY "activity_log_select_member" ON activity_log
FOR SELECT USING (is_org_member(org_id));

CREATE POLICY "activity_log_insert_member" ON activity_log
FOR INSERT WITH CHECK (is_org_member(org_id));

-- escalation_rules: admin only
CREATE POLICY "escalation_rules_select_admin" ON escalation_rules
FOR SELECT USING (is_org_admin(org_id));

CREATE POLICY "escalation_rules_insert_admin" ON escalation_rules
FOR INSERT WITH CHECK (is_org_admin(org_id));

CREATE POLICY "escalation_rules_update_admin" ON escalation_rules
FOR UPDATE USING (is_org_admin(org_id)) WITH CHECK (is_org_admin(org_id));

CREATE POLICY "escalation_rules_delete_admin" ON escalation_rules
FOR DELETE USING (is_org_admin(org_id));

-- ============================================================================
-- Consistency trigger: set org_id from club_id for ops_tasks
-- ============================================================================

CREATE TRIGGER set_ops_tasks_org_id
BEFORE INSERT OR UPDATE OF club_id ON ops_tasks
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();

CREATE TRIGGER set_matchday_runbooks_org_id
BEFORE INSERT OR UPDATE OF club_id ON matchday_runbooks
FOR EACH ROW EXECUTE FUNCTION set_org_id_from_club();
