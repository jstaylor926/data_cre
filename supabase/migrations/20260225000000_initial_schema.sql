-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Parcels Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcels (
  apn TEXT PRIMARY KEY,
  county TEXT NOT NULL,
  owner_name TEXT,
  owner_mailing_address TEXT,
  site_address TEXT,
  acres FLOAT,
  land_use_code TEXT,
  zoning TEXT,
  assessed_total NUMERIC,
  assessed_land NUMERIC,
  assessed_improvement NUMERIC,
  last_sale_date DATE,
  last_sale_price NUMERIC,
  year_built INTEGER,
  building_sqft INTEGER,
  geom GEOMETRY(MultiPolygon, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parcels_zoning ON parcels (zoning);
CREATE INDEX IF NOT EXISTS idx_parcels_county ON parcels (county);
CREATE INDEX IF NOT EXISTS idx_parcels_acres ON parcels (acres);

-- ─── Infrastructure: Substations ──────────────────────────────
CREATE TABLE IF NOT EXISTS infrastructure_substations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity_mw FLOAT,
  voltage_kv FLOAT,
  geom GEOMETRY(Point, 4326) NOT NULL,
  source TEXT DEFAULT 'HIFLD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_substations_geom ON infrastructure_substations USING GIST (geom);

-- ─── Infrastructure: Transmission Lines ───────────────────────
CREATE TABLE IF NOT EXISTS infrastructure_tx_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voltage_kv FLOAT,
  owner TEXT,
  geom GEOMETRY(MultiLineString, 4326) NOT NULL,
  source TEXT DEFAULT 'HIFLD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_lines_geom ON infrastructure_tx_lines USING GIST (geom);

-- ─── Infrastructure: Fiber Routes ─────────────────────────────
CREATE TABLE IF NOT EXISTS infrastructure_fiber (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT,
  fiber_type TEXT CHECK (fiber_type IN ('long_haul', 'metro', 'last_mile')),
  geom GEOMETRY(MultiLineString, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiber_geom ON infrastructure_fiber USING GIST (geom);

-- ─── Hazard: Flood Zones ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS hazard_flood_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_code TEXT NOT NULL, -- A, AE, V, VE, X, etc.
  geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
  source TEXT DEFAULT 'FEMA',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flood_zones_geom ON hazard_flood_zones USING GIST (geom);

-- ─── Saved Parcels ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  apn TEXT NOT NULL REFERENCES parcels(apn) ON DELETE CASCADE,
  notes TEXT,
  collection_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, apn)
);

-- ─── Collections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  org_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_parcels
  ADD CONSTRAINT fk_collection
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL;

-- ─── Due Diligence Tasks (Phase 5) ───────────────────────────
CREATE TABLE IF NOT EXISTS due_diligence_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saved_parcel_id UUID NOT NULL REFERENCES saved_parcels(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  task_name TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FATAL_FLAW')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dd_tasks_saved_parcel ON due_diligence_tasks (saved_parcel_id);
