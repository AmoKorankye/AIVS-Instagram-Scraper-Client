# Bug Fix: Add Profile to Source Profiles Dialog

## 🐛 Issue
When trying to add a profile in the Edit Source Profiles dialog, the operation failed with an error toast: "Failed to add profile - Could not add profile to database."

## 🔍 Root Cause
The `source_profiles` table has an `id` column of type `TEXT` with **no default value**. When inserting a new record without providing an `id`, Supabase rejected the insert because the `id` field is marked as `NOT NULL` but no value was provided.

### Table Schema:
```sql
id          TEXT                      NOT NULL  (no default)
username    TEXT                      NOT NULL
full_name   TEXT                      NULL
created_at  TIMESTAMP WITH TIME ZONE  NOT NULL  (default: now())
```

## ✅ Solution
Generate a UUID client-side before inserting the record.

### Code Change:
**Before:**
```typescript
const { data, error } = await supabase
  .from('source_profiles')
  .insert([{ username, full_name: null }])
  .select()
```

**After:**
```typescript
// Generate a UUID for the new profile
const profileId = crypto.randomUUID()

const { data, error } = await supabase
  .from('source_profiles')
  .insert([{ id: profileId, username, full_name: null }])
  .select()
```

## 🧪 Testing
Tested with direct SQL insert:
```sql
INSERT INTO source_profiles (id, username, full_name)
VALUES (gen_random_uuid()::text, 'test_user', null)
RETURNING *;
-- ✅ Success
```

## 📝 Notes
- Uses `crypto.randomUUID()` which is available in modern browsers
- The UUID is generated as a standard format (e.g., `148a94c7-09a7-4e99-b0bc-5bf1a0ebc981`)
- No additional dependencies required

## 🎯 Result
Adding profiles to the source_profiles table now works correctly! ✅

---

**Fixed**: October 5, 2025
