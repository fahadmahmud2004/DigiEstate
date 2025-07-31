-- Fix PropertyDetails nearbyFacilities issue
-- Problem: nearby_facilities stored as empty object {} instead of empty array []
-- This causes Array.isArray() to return false and breaks the frontend

-- 1. Fix the current problematic property
UPDATE properties 
SET nearby_facilities = '[]'::jsonb 
WHERE id = '49bf5ae8-089c-4c46-8f27-60fa9a7f9e12';

-- 2. Fix all properties that have empty object {} instead of empty array []
UPDATE properties 
SET nearby_facilities = '[]'::jsonb 
WHERE nearby_facilities = '{}'::jsonb;

-- 3. Fix any properties where nearby_facilities is null
UPDATE properties 
SET nearby_facilities = '[]'::jsonb 
WHERE nearby_facilities IS NULL;

-- 4. Verify the fixes
SELECT id, title, nearby_facilities, 
       jsonb_typeof(nearby_facilities) as facilities_type,
       CASE 
         WHEN jsonb_typeof(nearby_facilities) = 'array' THEN jsonb_array_length(nearby_facilities)
         ELSE NULL 
       END as array_length
FROM properties 
WHERE id = '49bf5ae8-089c-4c46-8f27-60fa9a7f9e12';

-- 5. Check all properties to ensure they have proper array format
SELECT id, title, nearby_facilities, 
       jsonb_typeof(nearby_facilities) as facilities_type
FROM properties 
WHERE jsonb_typeof(nearby_facilities) != 'array' OR nearby_facilities IS NULL;

-- 6. Optional: Add a constraint to prevent this issue in the future
-- (Uncomment if you want to enforce array format)
-- ALTER TABLE properties 
-- ADD CONSTRAINT nearby_facilities_must_be_array 
-- CHECK (jsonb_typeof(nearby_facilities) = 'array');
