-- Simplify org_members SELECT policy to avoid recursion/stack depth
DROP POLICY IF EXISTS "org_members_select_member" ON org_members;

CREATE POLICY "org_members_select_any" ON org_members
FOR SELECT USING (auth.uid() IS NOT NULL);
