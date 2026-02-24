-- ─── PostGIS-powered Site Discovery RPC (Phase 4) ─────────────
-- This function performs spatial queries to discover potential DC sites
-- based on acreage, zoning, substation proximity, and hazard exclusion.

CREATE OR REPLACE FUNCTION discover_dc_sites(
  min_acres FLOAT DEFAULT 50,
  max_substation_dist_meters FLOAT DEFAULT 8046.72, -- 5 miles in meters
  target_zoning TEXT[] DEFAULT ARRAY['I-1', 'I-2'],
  exclude_floodplain BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  apn TEXT,
  geom GEOMETRY,
  acres FLOAT,
  zoning TEXT,
  dist_to_sub_meters FLOAT,
  nearest_sub_name TEXT,
  nearest_sub_capacity_mw FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.apn,
    p.geom,
    p.acres,
    p.zoning,
    sub.dist AS dist_to_sub_meters,
    sub.name AS nearest_sub_name,
    sub.capacity_mw AS nearest_sub_capacity_mw
  FROM parcels p
  -- Lateral join: find nearest substation for each parcel
  CROSS JOIN LATERAL (
    SELECT
      s.name,
      s.capacity_mw,
      ST_Distance(p.geom::geography, s.geom::geography) AS dist
    FROM infrastructure_substations s
    ORDER BY p.geom <-> s.geom
    LIMIT 1
  ) sub
  WHERE
    -- Acreage filter
    p.acres >= min_acres
    -- Zoning filter
    AND p.zoning = ANY(target_zoning)
    -- Distance to substation filter
    AND sub.dist <= max_substation_dist_meters
    -- Floodplain exclusion
    AND (
      NOT exclude_floodplain
      OR NOT EXISTS (
        SELECT 1 FROM hazard_flood_zones f
        WHERE f.zone_code IN ('A', 'AE', 'AH', 'AO', 'V', 'VE')
          AND ST_Intersects(p.geom, f.geom)
      )
    )
  ORDER BY sub.dist ASC;
END;
$$ LANGUAGE plpgsql;

-- ─── Parcel Assemblage: Dissolve Adjacent Parcels ─────────────
CREATE OR REPLACE FUNCTION assemble_parcels(
  target_apns TEXT[]
)
RETURNS TABLE (
  total_acres FLOAT,
  parcel_count INT,
  dissolved_geom GEOMETRY,
  zoning_codes TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(p.acres)::FLOAT AS total_acres,
    COUNT(*)::INT AS parcel_count,
    ST_Union(p.geom) AS dissolved_geom,
    ARRAY_AGG(DISTINCT p.zoning) AS zoning_codes
  FROM parcels p
  WHERE p.apn = ANY(target_apns);
END;
$$ LANGUAGE plpgsql;
