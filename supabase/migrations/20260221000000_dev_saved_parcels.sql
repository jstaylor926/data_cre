-- Dev-friendly saved parcels and collections tables
-- Uses TEXT user_id instead of UUID REFERENCES auth.users
-- This allows development without Supabase Auth configured
-- TODO: Migrate to auth.users FK when authentication is added

-- Drop existing tables if they exist (from initial migration)
DROP TABLE IF EXISTS public.saved_parcels CASCADE;
DROP TABLE IF EXISTS public.collections CASCADE;

-- Collections table (dev mode: no auth FK)
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'dev-user',
  name TEXT NOT NULL,
  org_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS but allow all access in dev
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: allow all collection access"
ON public.collections FOR ALL
USING (true)
WITH CHECK (true);

-- Saved parcels table (dev mode: no auth FK)
CREATE TABLE public.saved_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'dev-user',
  apn TEXT NOT NULL,
  notes TEXT,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, apn)
);

ALTER TABLE public.saved_parcels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: allow all saved_parcels access"
ON public.saved_parcels FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_saved_parcels_user_apn ON public.saved_parcels(user_id, apn);
CREATE INDEX idx_collections_user ON public.collections(user_id);
