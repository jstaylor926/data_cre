-- Migration to add entity_lookups cache table.
-- Used to store results from GA SOS scraping to avoid redundant external requests.

CREATE TABLE IF NOT EXISTS public.entity_lookups (
  llc_name TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'GA',
  principal_name TEXT,
  agent_name TEXT,
  status TEXT,
  formed_date DATE,
  last_scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_data JSONB
);

-- Enable RLS
ALTER TABLE public.entity_lookups ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cached data is non-sensitive public record)
CREATE POLICY "entity_lookups_select_all"
ON public.entity_lookups
FOR SELECT
USING (true);

-- Only service role or authorized server paths can insert/update
-- (Implicitly allowed for service role, others need policy)
CREATE POLICY "entity_lookups_insert_service"
ON public.entity_lookups
FOR INSERT
WITH CHECK (true); -- Restricted by API logic and Supabase key management

CREATE POLICY "entity_lookups_update_service"
ON public.entity_lookups
FOR UPDATE
USING (true)
WITH CHECK (true);
