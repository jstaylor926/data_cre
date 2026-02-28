-- Harden tenant isolation and authentication policies.
-- Replaces permissive dev-mode RLS behavior with authenticated, org-scoped access.

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()::text
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.org_id = target_org_id
      AND om.user_id = public.current_user_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.org_id = target_org_id
      AND om.user_id = public.current_user_id()
      AND om.role IN ('owner', 'admin')
  )
$$;

-- Remove insecure dev defaults.
ALTER TABLE public.collections
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE public.saved_parcels
  ALTER COLUMN user_id DROP DEFAULT;

-- ── Collections / Saved Parcels ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can insert their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete their own collections" ON public.collections;
DROP POLICY IF EXISTS "Dev: allow all collection access" ON public.collections;

CREATE POLICY "collections_select_own"
ON public.collections
FOR SELECT
USING (user_id = public.current_user_id());

CREATE POLICY "collections_insert_own"
ON public.collections
FOR INSERT
WITH CHECK (
  public.current_user_id() IS NOT NULL
  AND user_id = public.current_user_id()
);

CREATE POLICY "collections_update_own"
ON public.collections
FOR UPDATE
USING (user_id = public.current_user_id())
WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "collections_delete_own"
ON public.collections
FOR DELETE
USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "Users can view their own saved parcels" ON public.saved_parcels;
DROP POLICY IF EXISTS "Users can insert their own saved parcels" ON public.saved_parcels;
DROP POLICY IF EXISTS "Users can update their own saved parcels" ON public.saved_parcels;
DROP POLICY IF EXISTS "Users can delete their own saved parcels" ON public.saved_parcels;
DROP POLICY IF EXISTS "Dev: allow all saved_parcels access" ON public.saved_parcels;

CREATE POLICY "saved_parcels_select_own"
ON public.saved_parcels
FOR SELECT
USING (user_id = public.current_user_id());

CREATE POLICY "saved_parcels_insert_own"
ON public.saved_parcels
FOR INSERT
WITH CHECK (
  public.current_user_id() IS NOT NULL
  AND user_id = public.current_user_id()
);

CREATE POLICY "saved_parcels_update_own"
ON public.saved_parcels
FOR UPDATE
USING (user_id = public.current_user_id())
WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "saved_parcels_delete_own"
ON public.saved_parcels
FOR DELETE
USING (user_id = public.current_user_id());

-- ── Phase 4 CRM Tables ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;

CREATE POLICY "organizations_select_member"
ON public.organizations
FOR SELECT
USING (public.is_org_member(id));

CREATE POLICY "organizations_insert_authenticated"
ON public.organizations
FOR INSERT
WITH CHECK (public.current_user_id() IS NOT NULL);

CREATE POLICY "organizations_update_admin"
ON public.organizations
FOR UPDATE
USING (public.is_org_admin(id))
WITH CHECK (public.is_org_admin(id));

CREATE POLICY "organizations_delete_admin"
ON public.organizations
FOR DELETE
USING (public.is_org_admin(id));

DROP POLICY IF EXISTS "organization_memberships_select_scoped" ON public.organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_insert_scoped" ON public.organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_update_admin" ON public.organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_delete_admin" ON public.organization_memberships;

CREATE POLICY "organization_memberships_select_scoped"
ON public.organization_memberships
FOR SELECT
USING (
  user_id = public.current_user_id()
  OR public.is_org_admin(org_id)
);

CREATE POLICY "organization_memberships_insert_scoped"
ON public.organization_memberships
FOR INSERT
WITH CHECK (
  public.current_user_id() IS NOT NULL
  AND (
    user_id = public.current_user_id()
    OR public.is_org_admin(org_id)
  )
);

CREATE POLICY "organization_memberships_update_admin"
ON public.organization_memberships
FOR UPDATE
USING (public.is_org_admin(org_id))
WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "organization_memberships_delete_admin"
ON public.organization_memberships
FOR DELETE
USING (public.is_org_admin(org_id));

DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Dev: allow all project access" ON public.projects;
DROP POLICY IF EXISTS "projects_select_member" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_member" ON public.projects;
DROP POLICY IF EXISTS "projects_update_member" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;

CREATE POLICY "projects_select_member"
ON public.projects
FOR SELECT
USING (public.is_org_member(org_id));

CREATE POLICY "projects_insert_member"
ON public.projects
FOR INSERT
WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "projects_update_member"
ON public.projects
FOR UPDATE
USING (public.is_org_member(org_id))
WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "projects_delete_admin"
ON public.projects
FOR DELETE
USING (public.is_org_admin(org_id));

DROP POLICY IF EXISTS "Dev: allow all task access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_member" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_admin" ON public.tasks;

CREATE POLICY "tasks_select_member"
ON public.tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = tasks.project_id
      AND public.is_org_member(p.org_id)
  )
);

CREATE POLICY "tasks_insert_member"
ON public.tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = tasks.project_id
      AND public.is_org_member(p.org_id)
  )
);

CREATE POLICY "tasks_update_member"
ON public.tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = tasks.project_id
      AND public.is_org_member(p.org_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = tasks.project_id
      AND public.is_org_member(p.org_id)
  )
);

CREATE POLICY "tasks_delete_admin"
ON public.tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = tasks.project_id
      AND public.is_org_admin(p.org_id)
  )
);

DROP POLICY IF EXISTS "Dev: allow all note access" ON public.notes;
DROP POLICY IF EXISTS "notes_select_member" ON public.notes;
DROP POLICY IF EXISTS "notes_insert_member" ON public.notes;
DROP POLICY IF EXISTS "notes_update_author_or_admin" ON public.notes;
DROP POLICY IF EXISTS "notes_delete_author_or_admin" ON public.notes;

CREATE POLICY "notes_select_member"
ON public.notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = notes.project_id
      AND public.is_org_member(p.org_id)
  )
);

CREATE POLICY "notes_insert_member"
ON public.notes
FOR INSERT
WITH CHECK (
  author_id = public.current_user_id()
  AND EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = notes.project_id
      AND public.is_org_member(p.org_id)
  )
);

CREATE POLICY "notes_update_author_or_admin"
ON public.notes
FOR UPDATE
USING (
  author_id = public.current_user_id()
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = notes.project_id
      AND public.is_org_admin(p.org_id)
  )
)
WITH CHECK (
  author_id = public.current_user_id()
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = notes.project_id
      AND public.is_org_admin(p.org_id)
  )
);

CREATE POLICY "notes_delete_author_or_admin"
ON public.notes
FOR DELETE
USING (
  author_id = public.current_user_id()
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = notes.project_id
      AND public.is_org_admin(p.org_id)
  )
);
