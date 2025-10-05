# Edit Source Profiles - Quick Reference

## 🎯 What You Get

A complete modal dialog for managing Instagram source profiles with:
- ✅ Add profiles (username or URL)
- ✅ Remove individual profiles
- 🔒 Password-protected "Clear All" function
- 💾 Real-time Supabase sync
- 🎨 Beautiful ShadCN UI design

---

## 🚀 Quick Start

### 1. Install Dependencies (if not already done)
```bash
cd client
npm install @supabase/supabase-js
```

### 2. Start Dev Server
```bash
npm run dev
```

### 3. Test the Feature
1. Navigate to your app
2. Find the Dependencies Card
3. Click the **3-dot menu** (⋮) in top-right corner
4. Click **"Edit source profiles"**
5. Try the features!

---

## 🎨 UI Preview

### Main Dependencies Card
```
┌──────────────────────────────────────────┐
│ Find Instagram Accounts            ⋮    │ ← Click here
│ Type in the search bar...                │
├──────────────────────────────────────────┤
│ [Input field]                       [+]  │
│                                          │
│ Added Accounts                           │
│ • @user1                           [X]   │
│ • @user2                           [X]   │
│                                          │
│ [Find Accounts]                          │
└──────────────────────────────────────────┘
```

### Dropdown Menu (when you click ⋮)
```
┌─────────────────────────┐
│ Load source profiles    │
│ Edit source profiles    │ ← Opens the dialog
└─────────────────────────┘
```

### Edit Dialog
```
┌─────────────────────────────────────────────┐
│ Edit Source Profiles                    [X] │
│ Add or remove Instagram accounts...        │
├─────────────────────────────────────────────┤
│                                             │
│ Add New Profile                             │
│ ┌─────────────────────────────────┐  [+]   │
│ │ Enter Instagram username or URL │        │
│ └─────────────────────────────────┘        │
│                                             │
│ Source Profiles (3)          [Clear All]   │
│                                             │
│ 👤 @cristiano                         [X]  │
│ 👤 @therock                           [X]  │
│ 👤 @kyliejenner                       [X]  │
│    Kylie Jenner                            │
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancel]  [Save Changes] │
└─────────────────────────────────────────────┘
```

### Clear All - Password Prompt
```
┌────────────────────────────────────────────┐
│ ⚠️ This will delete all 3 source profiles │
│    permanently.                            │
│                                            │
│ ┌──────────────────┐ [Confirm] [Cancel]   │
│ │ Enter password   │                       │
│ └──────────────────┘                       │
│                                            │
│ Password hint: delete123                   │
└────────────────────────────────────────────┘
```

---

## 📝 Usage Examples

### Add a Profile
```
Option 1 - Username:
Type: "cristiano"
Press: Enter or click +
Result: ✅ Added to database

Option 2 - URL:
Paste: "https://instagram.com/therock"
Press: Enter
Result: ✅ Extracts "therock" and adds
```

### Remove a Profile
```
Action: Click [X] button next to any profile
Result: ✅ Instantly deleted from database
Toast: "Profile removed"
```

### Clear All Profiles
```
Step 1: Click "Clear All" button
Step 2: Enter password: "delete123"
Step 3: Click "Confirm Delete"
Result: ✅ All profiles deleted
Toast: "All profiles cleared"
```

---

## 🔑 Important Info

### Password
- **Default**: `delete123`
- **Location**: `/client/components/edit-source-profiles-dialog.tsx` (line ~210)
- **Change it**: Search for `correctPassword` in the file

### Keyboard Shortcuts
- **Enter** in input field → Add profile
- **Enter** in password field → Confirm delete
- **ESC** → Close dialog

### Database Table
- **Table**: `source_profiles`
- **Columns**: `id`, `username`, `full_name`, `created_at`
- **Location**: Supabase (https://vfixvelgubfcznsyinhe.supabase.co)

---

## 🔄 Complete Workflow

```
1. Click ⋮ menu → "Edit source profiles"
   ↓
2. Dialog opens + auto-loads profiles from DB
   ↓
3. Add profiles (instantly saved to DB)
   ↓
4. Remove profiles (instantly deleted from DB)
   ↓
5. Click "Save Changes"
   ↓
6. Dialog closes + profiles reload in main card
   ↓
7. Click ⋮ menu → "Load source profiles"
   ↓
8. All saved profiles appear in the list ✅
```

---

## 📦 Files Changed

### New Files:
```
/client/components/edit-source-profiles-dialog.tsx  (NEW - 400 lines)
/client/EDIT_SOURCE_PROFILES_FEATURE.md            (NEW - docs)
/client/EDIT_SOURCE_PROFILES_QUICK_REFERENCE.md    (NEW - this file)
```

### Modified Files:
```
/client/components/dependencies-card.tsx
  - Added import: EditSourceProfilesDialog
  - Added state: isEditDialogOpen
  - Added handler: opens dialog instead of toast
  - Added component: <EditSourceProfilesDialog />
```

---

## ✅ Features Checklist

- [x] Add profile by username
- [x] Add profile by Instagram URL
- [x] Remove individual profile
- [x] Clear all profiles (password-protected)
- [x] Input validation
- [x] Duplicate prevention
- [x] Real-time database sync
- [x] Loading states
- [x] Toast notifications
- [x] Keyboard shortcuts
- [x] Responsive design
- [x] Accessibility support
- [x] TypeScript type safety
- [x] Error handling

---

## 🐛 Troubleshooting

### Dialog Won't Open
**Problem**: Clicking "Edit source profiles" does nothing  
**Solution**: Check console for errors, ensure Supabase client is installed

### Can't Add Profiles
**Problem**: Click + button but nothing happens  
**Solution**: Check if username is valid format (alphanumeric + . _)

### Wrong Password Error
**Problem**: Can't clear all profiles  
**Solution**: Password is `delete123` (case-sensitive)

### Profiles Not Loading
**Problem**: Dialog opens but shows empty  
**Solution**: Check Supabase connection, verify table name is `source_profiles`

---

## 🎓 Tips

1. **Test with URLs**: Paste full Instagram URLs, it extracts the username
2. **Keyboard lover?**: Use Enter key to add profiles quickly
3. **Bulk operations**: Add multiple profiles, then click Save once
4. **Safety first**: Password prevents accidental Clear All clicks
5. **Instant sync**: Add/remove happens immediately (no need to Save)

---

## 📞 Need Help?

Check these files for details:
- **Full documentation**: `/client/EDIT_SOURCE_PROFILES_FEATURE.md`
- **Implementation guide**: `/client/DEPENDENCIES_CARD_IMPLEMENTATION.md`
- **Component code**: `/client/components/edit-source-profiles-dialog.tsx`

---

**Ready to test!** 🚀

Just make sure you've installed `@supabase/supabase-js` and the dev server is running.

---

**Last Updated**: October 5, 2025  
**Status**: ✅ Complete & Ready
