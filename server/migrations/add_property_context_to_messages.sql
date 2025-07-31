-- Migration: Add property context columns to messages table
-- This ensures chat history preserves property information even after property deletion

-- Add columns to store property context at message creation time
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS property_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS property_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS property_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS property_image_url TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_property_context 
ON public.messages (property_id, property_title) 
WHERE property_id IS NOT NULL;

-- Backfill existing messages with property context (if property still exists)
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

-- Comment for documentation
COMMENT ON COLUMN public.messages.property_title IS 'Cached property title at time of message creation';
COMMENT ON COLUMN public.messages.property_location IS 'Cached property location at time of message creation';
COMMENT ON COLUMN public.messages.property_price IS 'Cached property price at time of message creation';
COMMENT ON COLUMN public.messages.property_image_url IS 'Cached property main image at time of message creation';
