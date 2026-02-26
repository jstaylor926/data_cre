-- ─── Phase 4: Firm Intelligence Platform ──────────────────────────────────────

-- 1. Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own organizations
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations
FOR SELECT
USING (true); -- TODO: Link with auth.users and membership table


-- 2. Organization Memberships table
CREATE TABLE public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Dev mode: TEXT, will migrate to UUID auth.users
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;


-- 3. Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Multi-tenant RLS Policy for projects
CREATE POLICY "Users can view projects in their organization"
ON public.projects
FOR SELECT
USING (org_id IN (
  SELECT org_id FROM public.organization_memberships WHERE user_id = current_setting('request.jwt.claims', true)::jsonb->>'sub' -- JWT sub for dev-user is handled by our TEXT id
));

-- Simplified RLS for dev mode (mirroring collections)
CREATE POLICY "Dev: allow all project access"
ON public.projects FOR ALL
USING (true)
WITH CHECK (true);


-- 4. Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: allow all task access"
ON public.tasks FOR ALL
USING (true)
WITH CHECK (true);


-- 5. Notes table (linked to parcels)
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  apn TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: allow all note access"
ON public.notes FOR ALL
USING (true)
WITH CHECK (true);


-- Update existing collections to use organization if needed
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
