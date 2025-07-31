-- SQL command to change property status from pending to active
-- Run this in your Supabase SQL Editor

-- First, let's find the property to make sure we target the right one
SELECT id, title, status, owner_id, created_at 
FROM public.properties 
WHERE LOWER(title) LIKE '%lalbag kella%';

-- Update the property status to 'Active'
UPDATE public.properties 
SET 
    status = 'Active',
    updated_at = NOW()
WHERE LOWER(title) LIKE '%lalbag kella%'
AND status = 'Pending Verification';

-- Verify the update worked
SELECT id, title, status, updated_at 
FROM public.properties 
WHERE LOWER(title) LIKE '%lalbag kella%';
