-- Phase 1 capabilities foundation.
-- Adds a capability catalog and per-user overrides used to derive feature access.

CREATE TABLE IF NOT EXISTS public.capabilities (
  key TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "capabilities_select_all" ON public.capabilities;
CREATE POLICY "capabilities_select_all"
ON public.capabilities
FOR SELECT
USING (true);

INSERT INTO public.capabilities (key, description)
VALUES
  ('saved.read', 'Read saved parcels'),
  ('saved.write', 'Create/update/delete saved parcels'),
  ('collections.manage', 'Create/update/delete saved parcel collections'),
  ('feature.ai_zoning', 'Use AI zoning and score workflows'),
  ('feature.auto_comps', 'Use comparable analysis tooling'),
  ('feature.dc_scoring', 'Use data center scoring and scout workflows'),
  ('feature.entity_lookup', 'Use LLC/entity lookup features'),
  ('crm.view', 'View CRM workspace data'),
  ('crm.projects.write', 'Create/update/delete CRM projects'),
  ('crm.tasks.write', 'Create/update/delete CRM tasks'),
  ('crm.notes.write', 'Create/update/delete CRM notes'),
  ('admin.capabilities.manage', 'Manage capability overrides')
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS public.user_capability_overrides (
  user_id TEXT NOT NULL,
  capability_key TEXT NOT NULL REFERENCES public.capabilities(key) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  reason TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, capability_key)
);

CREATE INDEX IF NOT EXISTS idx_user_capability_overrides_user_id
  ON public.user_capability_overrides(user_id);

ALTER TABLE public.user_capability_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_capability_overrides_select_own" ON public.user_capability_overrides;
CREATE POLICY "user_capability_overrides_select_own"
ON public.user_capability_overrides
FOR SELECT
USING (user_id = public.current_user_id());

-- Write policies are intentionally omitted.
-- Overrides should be managed by trusted admin paths (e.g. service-role tooling).
