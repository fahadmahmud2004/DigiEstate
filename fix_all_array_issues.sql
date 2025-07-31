-- Complete fix for all array/JSONB format issues in properties table
-- This addresses all data type mismatches between database schema and application logic

-- 1. Fix nearby_facilities that are stored as empty object {} instead of empty array []
UPDATE properties 
SET nearby_facilities = '[]'::jsonb 
WHERE nearby_facilities = '{}'::jsonb;

-- 2. Fix any properties where nearby_facilities is null
UPDATE properties 
SET nearby_facilities = '[]'::jsonb 
WHERE nearby_facilities IS NULL;

-- 3. Fix any properties where images is null (should be empty array)
UPDATE properties 
SET images = '{}'::text[] 
WHERE images IS NULL;

-- 4. Fix any properties where videos is null (should be empty array)
UPDATE properties 
SET videos = '{}'::text[] 
WHERE videos IS NULL;

-- 5. Fix any properties where custom_features is null (should be empty array)
UPDATE properties 
SET custom_features = '{}'::text[] 
WHERE custom_features IS NULL;

-- 6. Verify all fixes - Check data types
SELECT 
    'nearby_facilities' as field_name,
    COUNT(*) as total_properties,
    COUNT(CASE WHEN jsonb_typeof(nearby_facilities) = 'array' THEN 1 END) as correct_arrays,
    COUNT(CASE WHEN jsonb_typeof(nearby_facilities) != 'array' OR nearby_facilities IS NULL THEN 1 END) as incorrect_format
FROM properties

UNION ALL

SELECT 
    'images',
    COUNT(*),
    COUNT(CASE WHEN images IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN images IS NULL THEN 1 END)
FROM properties

UNION ALL

SELECT 
    'videos',
    COUNT(*),
    COUNT(CASE WHEN videos IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN videos IS NULL THEN 1 END)
FROM properties

UNION ALL

SELECT 
    'custom_features',
    COUNT(*),
    COUNT(CASE WHEN custom_features IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN custom_features IS NULL THEN 1 END)
FROM properties;

-- 7. Show sample of fixed data
SELECT 
    id, 
    title,
    jsonb_typeof(nearby_facilities) as nearby_facilities_type,
    jsonb_array_length(nearby_facilities) as nearby_facilities_length,
    array_length(images, 1) as images_count,
    array_length(videos, 1) as videos_count,
    array_length(custom_features, 1) as custom_features_count
FROM properties 
LIMIT 5;

-- 8. Identify any remaining problematic records
SELECT id, title, 'nearby_facilities not array' as issue
FROM properties 
WHERE jsonb_typeof(nearby_facilities) != 'array' OR nearby_facilities IS NULL

UNION ALL

SELECT id, title, 'images is null' as issue
FROM properties 
WHERE images IS NULL

UNION ALL

SELECT id, title, 'videos is null' as issue
FROM properties 
WHERE videos IS NULL

UNION ALL

SELECT id, title, 'custom_features is null' as issue
FROM properties 
WHERE custom_features IS NULL;

-- 9. Optional: Add constraints to prevent future issues
-- (Uncomment to enforce proper data types)

-- ALTER TABLE properties 
-- ADD CONSTRAINT nearby_facilities_must_be_array 
-- CHECK (jsonb_typeof(nearby_facilities) = 'array');

-- ALTER TABLE properties 
-- ADD CONSTRAINT images_not_null 
-- CHECK (images IS NOT NULL);

-- ALTER TABLE properties 
-- ADD CONSTRAINT videos_not_null 
-- CHECK (videos IS NOT NULL);

-- ALTER TABLE properties 
-- ADD CONSTRAINT custom_features_not_null 
-- CHECK (custom_features IS NOT NULL);
