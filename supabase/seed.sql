-- Seed data for some mock parcels to use during Phase 1 development
INSERT INTO public.parcels (apn, county, owner_name, owner_mailing_address, site_address, acres, land_use_code, zoning, assessed_total, last_sale_date, last_sale_price) VALUES
('APN-001', 'Fulton', 'ACME REALTY LLC', '123 MAIN ST, ATLANTA, GA 30303', '456 PEACHTREE ST, ATLANTA, GA 30308', 2.5, 'C', 'C-2', 1500000.00, '2022-05-14', 1200000.00),
('APN-002', 'Fulton', 'JOHN DOE PROPERTIES', '789 OAK LN, ATLANTA, GA 30306', '101 PONCE DE LEON AVE, ATLANTA, GA 30308', 1.2, 'R', 'R-4', 450000.00, '2019-11-20', 320000.00),
('APN-003', 'Gwinnett', 'TECH PARK HOLDINGS', 'PO BOX 555, DULUTH, GA 30097', '2000 SUGARLOAF PKWY, DULUTH, GA 30097', 15.0, 'I', 'M-1', 4500000.00, '2021-03-01', 4000000.00);

-- Note: we are excluding geom for the mock inserts unless we define proper postgis MultiPolygon strings
-- We could add them later using ST_GeomFromText('MULTIPOLYGON(((...)))', 4326)
