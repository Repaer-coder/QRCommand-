-- Ensure blueprint instance access remains available for workspace owners, admins, and managers.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'blueprint_instances'
      AND policyname = 'owners admins managers manage blueprint_instances'
  ) THEN
    CREATE POLICY "owners admins managers manage blueprint_instances" ON public.blueprint_instances
      FOR ALL
      TO authenticated
      USING (public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']))
      WITH CHECK (public.has_org_role(organization_id, ARRAY['owner', 'admin', 'manager']));
  END IF;
END $$;
