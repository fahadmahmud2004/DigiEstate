-- SUPABASE MIGRATION: Add property context to messages table
-- Run this in your Supabase SQL Editor (Project Settings > SQL Editor)

-- Step 1: Add property context columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS property_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS property_location VARCHAR(255), 
ADD COLUMN IF NOT EXISTS property_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS property_image_url TEXT;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_property_context 
ON public.messages (property_id, property_title) 
WHERE property_id IS NOT NULL;

-- Step 3: Backfill existing messages with property context (if property still exists)
UPDATE public.messages m
SET 
    property_title = p.title,
    property_location = p.location,
    property_price = p.price,
    property_image_url = CASE 
        WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 
        THEN p.images[1] 
        ELSE NULL 
    END
FROM public.properties p
WHERE m.property_id = p.id 
AND m.property_title IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.messages.property_title IS 'Cached property title at time of message creation - preserves context even after property deletion';
COMMENT ON COLUMN public.messages.property_location IS 'Cached property location at time of message creation';
COMMENT ON COLUMN public.messages.property_price IS 'Cached property price at time of message creation';
COMMENT ON COLUMN public.messages.property_image_url IS 'Cached property main image URL at time of message creation';

-- Step 5: Verify the migration worked correctly
-- Run these queries one by one to debug:

-- 5a. Check if columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5b. Check total message counts and property context
SELECT 
    COUNT(*) as total_messages,
    COUNT(property_id) as messages_with_property_id,
    COUNT(property_title) as messages_with_property_title,
    COUNT(property_location) as messages_with_property_location,
    COUNT(property_price) as messages_with_property_price
FROM public.messages;

-- 5c. Show actual message data with property context (limit 10)
SELECT 
    id, 
    sender_id, 
    content, 
    property_id, 
    property_title, 
    property_location, 
    property_price,
    created_at
FROM public.messages 
WHERE property_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5d. Check if any properties exist that could be used for backfill
SELECT COUNT(*) as total_properties FROM public.properties;

-- 5e. Check specific messages that should have property context
SELECT 
    m.id,
    m.property_id,
    m.property_title,
    p.title as actual_property_title,
    p.location as actual_property_location
FROM public.messages m
LEFT JOIN public.properties p ON m.property_id = p.id
WHERE m.property_id IS NOT NULL
LIMIT 5;

-- 5f. Check if any messages were updated by the backfill
SELECT 
    COUNT(*) as messages_updated_by_backfill
FROM public.messages 
WHERE property_id IS NOT NULL AND property_title IS NOT NULL;
