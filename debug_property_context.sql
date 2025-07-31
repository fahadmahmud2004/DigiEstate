-- DEBUG: Property Context in Messages
-- Run these queries in Supabase SQL Editor to debug the issue

-- 1. First, check if the migration columns exist
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
AND column_name IN ('property_title', 'property_location', 'property_price', 'property_image_url')
ORDER BY column_name;

-- Expected result: Should show 4 rows with the new columns

-- 2. Check current message data
SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN property_id IS NOT NULL THEN 1 END) as messages_with_property_id,
    COUNT(CASE WHEN property_title IS NOT NULL THEN 1 END) as messages_with_cached_title,
    COUNT(CASE WHEN property_location IS NOT NULL THEN 1 END) as messages_with_cached_location
FROM public.messages;

-- 3. Show recent messages with property context
SELECT 
    id,
    LEFT(content, 50) as content_preview,
    property_id,
    property_title,
    property_location,
    property_price,
    created_at
FROM public.messages 
WHERE property_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if properties table has data
SELECT 
    COUNT(*) as total_properties,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as properties_with_title,
    COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as properties_with_location
FROM public.properties;

-- 5. Test the JOIN that should populate property context
SELECT 
    m.id as message_id,
    m.property_id,
    m.property_title as cached_title,
    p.title as current_property_title,
    p.location as current_property_location,
    CASE 
        WHEN p.id IS NULL THEN 'PROPERTY DELETED'
        WHEN m.property_title IS NULL THEN 'NO CACHED DATA'
        ELSE 'HAS CACHED DATA'
    END as status
FROM public.messages m
LEFT JOIN public.properties p ON m.property_id = p.id
WHERE m.property_id IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 10;

-- 6. If no data, let's check what messages exist at all
SELECT 
    COUNT(*) as total_messages,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message
FROM public.messages;

-- 7. Let's see a sample of all message data
SELECT 
    id,
    sender_id,
    receiver_id,
    LEFT(content, 30) as content_preview,
    property_id,
    conversation_id,
    created_at
FROM public.messages
ORDER BY created_at DESC
LIMIT 5;
