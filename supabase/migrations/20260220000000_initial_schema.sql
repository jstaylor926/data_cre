-- Enable PostGIS for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Create Parcels Table
CREATE TABLE public.parcels (
  apn TEXT PRIMARY KEY,
  county TEXT,
  owner_name TEXT,
  owner_mailing_address TEXT,
  site_address TEXT,
  acres NUMERIC,
  land_use_code TEXT,
  zoning TEXT,
  assessed_total NUMERIC,
  last_sale_date DATE,
  last_sale_price NUMERIC,
  geom geometry(MultiPolygon, 4326)
);

-- Enable RLS on parcels
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users (including anonymous)
CREATE POLICY "Allow public read access to parcels"
ON public.parcels
FOR SELECT
USING (true);


-- Create Collections Table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  org_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own collections
CREATE POLICY "Users can view their own collections"
ON public.collections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
ON public.collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
ON public.collections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
ON public.collections
FOR DELETE
USING (auth.uid() = user_id);


-- Create Saved Parcels Table
CREATE TABLE public.saved_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  apn TEXT NOT NULL,
  notes TEXT,
  collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on saved_parcels
ALTER TABLE public.saved_parcels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own saved_parcels
CREATE POLICY "Users can view their own saved parcels"
ON public.saved_parcels
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved parcels"
ON public.saved_parcels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved parcels"
ON public.saved_parcels
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved parcels"
ON public.saved_parcels
FOR DELETE
USING (auth.uid() = user_id);
