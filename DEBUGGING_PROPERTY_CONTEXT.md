# 🔍 DEBUGGING CHECKLIST: Property Context Box Not Appearing

## Step 1: Check Database Migration
Run in Supabase SQL Editor:

```sql
-- Check if columns exist
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
AND column_name IN ('property_title', 'property_location', 'property_price', 'property_image_url');
```
✅ Expected: 4 rows showing the new columns

## Step 2: Check Existing Messages
```sql
-- Check message data
SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN property_id IS NOT NULL THEN 1 END) as messages_with_property_id,
    COUNT(CASE WHEN property_title IS NOT NULL THEN 1 END) as messages_with_cached_title
FROM public.messages;
```

## Step 3: Check if Properties Exist
```sql
-- Check properties table
SELECT COUNT(*) as total_properties FROM public.properties;
SELECT id, title, location FROM public.properties LIMIT 3;
```

## Step 4: Test Creating New Message with Property Context

### A. In your app:
1. Go to a property details page
2. Click "Contact Owner" or "Send Message"
3. Send a test message
4. Check browser console for logs
5. Check server logs for property context logs

### B. Check the database after sending:
```sql
-- Check latest message
SELECT 
    id, content, property_id, property_title, property_location, property_price
FROM public.messages 
ORDER BY created_at DESC 
LIMIT 5;
```

## Step 5: Frontend Debugging

### A. Open Browser Developer Tools (F12)
1. Go to Console tab
2. Look for messages like:
   - "Messages with property context found: [...]"
   - "No messages with property context found"

### B. Check Network Tab
1. Look for `/api/messages` requests
2. Check if `propertyId` is being sent
3. Check response data for property context fields

## Step 6: Backend Debugging

### A. Check Server Logs
Look for logs like:
- `[MessageService] Fetching property details for propertyId: xxx`
- `[MessageService] Property context cached: {...}`
- `[MessageService] No propertyId provided`

### B. If no logs appear:
- The `propertyId` is not being sent from frontend
- Check how messages are being created in your app

## Step 7: Common Issues & Solutions

### ❌ Issue: Columns don't exist
**Solution:** Run the migration in Supabase SQL Editor

### ❌ Issue: No propertyId in messages
**Solution:** Check how messages are created - propertyId needs to be passed

### ❌ Issue: propertyId exists but no cached data
**Solution:** 
1. Check if properties exist in database
2. Check server logs for property fetch errors
3. Run backfill query manually

### ❌ Issue: Backend works but frontend doesn't show box
**Solution:**
1. Check browser console for property context logs
2. Verify Message interface has new fields
3. Check if `message.propertyId` condition is working

## Step 8: Manual Test Insert
If nothing works, try inserting a test message manually:

```sql
-- Get actual IDs first
SELECT id FROM public.users LIMIT 2;
SELECT id FROM public.properties LIMIT 1;

-- Insert test message (replace UUIDs with real ones)
INSERT INTO public.messages (
    id, sender_id, receiver_id, content, conversation_id,
    property_id, property_title, property_location, property_price,
    created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'REPLACE_WITH_USER_ID_1',
    'REPLACE_WITH_USER_ID_2', 
    'Test message with property context',
    'conv_debug_test',
    'REPLACE_WITH_PROPERTY_ID',
    'Debug Test Property',
    'Test Location',
    100000,
    NOW(),
    NOW()
);
```

Then check if this message shows the property box in your app.

## Expected Results:
- ✅ Database has new columns
- ✅ New messages get property context cached
- ✅ Frontend shows property context box
- ✅ Clicking property link shows appropriate message
- ✅ Property context persists even after property deletion
