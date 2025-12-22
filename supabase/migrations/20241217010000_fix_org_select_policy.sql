-- Fix: Allow users to SELECT orgs they created (needed for INSERT...RETURNING)
-- The original policy only allowed members, but when creating a new org,
-- the user isn't a member yet until the bootstrap flow completes.
-- Note: Using direct EXISTS check instead of is_org_member() to avoid recursion

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "orgs_select_member" ON orgs;

-- Create new policy: members OR creator can read (non-recursive)
CREATE POLICY "orgs_select_member_or_creator" ON orgs
FOR SELECT USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = orgs.id 
    AND org_members.user_id = auth.uid()
  )
);

