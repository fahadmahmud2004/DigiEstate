-- TEST: Create a message with property context for debugging
-- Run this in Supabase SQL Editor to manually test the property context feature

-- Step 1: First, let's see what properties we have available
SELECT id, title, location, price, images[1] as first_image 
FROM public.properties 
WHERE status = 'Active'
ORDER BY created_at DESC 
LIMIT 5;

-- Step 2: Get some user IDs for testing
SELECT id, name, email 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 3: Manually insert a test message with property context
-- Replace the UUIDs below with actual values from steps 1 and 2
/*
INSERT INTO public.messages (
    id, 
    sender_id, 
    receiver_id, 
    content, 
    conversation_id, 
    property_id, 
    property_title, 
    property_location, 
    property_price,
    property_image_url,
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    'YOUR_SENDER_ID_HERE',     -- Replace with actual user ID
    'YOUR_RECEIVER_ID_HERE',   -- Replace with actual user ID  
    'Test message about this property',
    'conv_test_debug',
    'YOUR_PROPERTY_ID_HERE',   -- Replace with actual property ID
    'Test Property Title',
    'Test Location',
    150000.00,
    'test-image.jpg',
    NOW(),
    NOW()
);
*/

-- Step 4: After inserting, check if the message appears correctly
SELECT 
    id,
    content,
    property_id,
    property_title,
    property_location,
    property_price,
    property_image_url,
    created_at
FROM public.messages 
WHERE conversation_id = 'conv_test_debug';

-- Step 5: Check if the message service query works
SELECT 
    m.id,
    m.content,
    m.property_id,
    m.property_title,
    m.property_location,
    m.property_price,
    s.name as sender_name,
    r.name as receiver_name
FROM public.messages m
LEFT JOIN public.users s ON m.sender_id = s.id
LEFT JOIN public.users r ON m.receiver_id = r.id
WHERE m.conversation_id = 'conv_test_debug';

-- Step 6: Clean up test data (run this after testing)
-- DELETE FROM public.messages WHERE conversation_id = 'conv_test_debug';
