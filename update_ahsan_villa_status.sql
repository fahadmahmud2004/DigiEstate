-- Update Ahsan Villa status from "Pending Verification" to "Active"
UPDATE properties 
SET status = 'Active', 
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(title) LIKE '%ahsan villa%' 
  AND status = 'Pending Verification';

-- Verify the update
SELECT id, title, status, updated_at 
FROM properties 
WHERE LOWER(title) LIKE '%ahsan villa%';
