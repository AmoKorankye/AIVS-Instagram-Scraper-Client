# Source Profiles Table - Quick Reference

## 📊 Current Schema

```sql
CREATE TABLE source_profiles (
  id        TEXT  PRIMARY KEY,
  username  TEXT  NOT NULL UNIQUE
);
```

**That's it!** Just 2 columns. Simple and efficient.

---

## ✅ What Works

### 1. Add Username
```typescript
// Generate UUID
const profileId = crypto.randomUUID()

// Insert
await supabase
  .from('source_profiles')
  .insert([{ id: profileId, username: 'cristiano' }])
  .select()
```

### 2. Duplicate Prevention
- **Client-side check:** Checks local state before adding
- **Database-side enforcement:** UNIQUE constraint on `username`
- **Result:** Same username cannot be added twice ✅

### 3. Load All Profiles
```typescript
await supabase
  .from('source_profiles')
  .select('id, username')
  .order('username', { ascending: true })
```

### 4. Delete Profile
```typescript
await supabase
  .from('source_profiles')
  .delete()
  .eq('id', profileId)
```

---

## 🎯 Key Features

| Feature | Status | How It Works |
|---------|--------|--------------|
| Unique usernames | ✅ | Database UNIQUE constraint |
| URL extraction | ✅ | Regex patterns in client |
| Alphabetical sorting | ✅ | ORDER BY username ASC |
| UUID IDs | ✅ | crypto.randomUUID() |
| No duplicates | ✅ | Client + DB validation |

---

## 🔧 Migration Applied

**Name:** `simplify_source_profiles_table`

**Changes:**
- ❌ Removed `full_name` column
- ❌ Removed `created_at` column
- ✅ Kept `id` (primary key)
- ✅ Kept `username` (unique)

**Result:** Cleaner, faster, simpler table!

---

## 📝 Example Usage

### Add Profile via Dialog
1. Open "Edit source profiles" dialog
2. Enter: `cristiano` OR `https://instagram.com/cristiano`
3. Click + button
4. ✅ Saved with UUID: `{ id: 'abc123...', username: 'cristiano' }`

### Load Profiles to Dependencies Card
1. Click 3-dot menu
2. Click "Load source profiles"
3. ✅ All usernames loaded alphabetically

### Prevent Duplicates
1. Try to add `cristiano` again
2. ❌ Error toast: "Profile already exists"
3. ✅ Database rejects duplicate

---

## 🚀 Ready to Use!

Everything is working perfectly. The simplified schema makes the table:
- **Faster** (less data to query)
- **Cleaner** (only essential fields)
- **Safer** (UNIQUE constraint enforced)

No action needed - just start using it! 🎉
