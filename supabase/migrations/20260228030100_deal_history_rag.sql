-- ─── Phase 2.4: Deal History RAG (Firm Intelligence) ─────────────────────────

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create Deal Documents table for RAG
CREATE TABLE public.deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- Link to specific project/deal if available
  filename TEXT NOT NULL,
  content TEXT NOT NULL, -- The chunk text
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(3072), -- text-embedding-3-large
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

-- Multi-tenant RLS Policies
CREATE POLICY "deal_documents_select_member"
ON public.deal_documents
FOR SELECT
USING (public.is_org_member(org_id));

CREATE POLICY "deal_documents_insert_admin"
ON public.deal_documents
FOR INSERT
WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "deal_documents_update_admin"
ON public.deal_documents
FOR UPDATE
USING (public.is_org_admin(org_id))
WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "deal_documents_delete_admin"
ON public.deal_documents
FOR DELETE
USING (public.is_org_admin(org_id));

-- Index for vector search (ivfflat or hnsw)
-- text-embedding-3-large is 3072 dims
-- HNSW is generally better for performance but more resource intensive
CREATE INDEX ON public.deal_documents USING hnsw (embedding vector_cosine_ops);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_deal_documents (
  query_embedding VECTOR(3072),
  match_threshold FLOAT,
  match_count INT,
  filter_org_id UUID
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dd.id,
    dd.project_id,
    dd.content,
    dd.metadata,
    1 - (dd.embedding <=> query_embedding) AS similarity
  FROM public.deal_documents dd
  WHERE dd.org_id = filter_org_id
    AND 1 - (dd.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
