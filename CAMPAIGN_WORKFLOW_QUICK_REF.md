# Campaign Workflow - Quick Reference

## 🎯 **What Was Implemented**

**"Assign to VAs" Button** - One-click campaign automation:
1. Creates campaign
2. Selects 14,400 profiles
3. Distributes to 80 VA tables
4. Syncs to Airtable
5. Auto-refreshes UI

---

## 📍 **Button Location**

**Payments Table** → Top-right corner
- Tab: "Scraped Accounts"
- Next to card title "Extracted Accounts"

---

## 🔄 **Workflow**

```
Click "Assign to VAs"
    ↓
📋 Creating campaign... [████░░░░] 33%
    ↓
🎲 Distributing... [████████░░░░] 66%
    ↓
☁️ Syncing to Airtable... [████████████] 100%
    ↓
✅ Complete!
    ↓
Auto-refresh UI
```

---

## 📡 **API Calls**

1. `POST /api/daily-selection` → Creates campaign
2. `POST /api/distribute/{id}` → Assigns to tables
3. `POST /api/airtable-sync/{id}` → Syncs to Airtable

---

## 🎨 **Progress States**

| Step | Message | Progress | Button |
|------|---------|----------|--------|
| Idle | - | 0% | "Assign to VAs" |
| Creating | "📋 Creating campaign..." | 10-33% | "Creating Campaign..." |
| Distributing | "🎲 Distributing to VA tables..." | 40-66% | "Distributing..." |
| Syncing | "☁️ Syncing to Airtable..." | 75-100% | "Syncing to Airtable..." |
| Complete | "✅ Complete!" | 100% | "Complete!" |

---

## ✅ **What Refreshes After Completion**

1. **Username Status Card**
   - Unused count updates (e.g., 15,000 → 600)
   - Status message may change

2. **Campaigns Table**
   - New campaign appears
   - Shows date, total assigned (14,400), status

---

## 🚨 **Error Handling**

All errors:
- Reset progress bar
- Show descriptive toast
- Re-enable button

---

## 📊 **Success Message**

```
✓ Campaign completed
Successfully assigned 14,400 profiles to 80 VA tables in Airtable.
```

---

## 📦 **Files Changed**

1. `/components/payments-table.tsx` - Added workflow + progress
2. `/app/callum-dashboard/page.tsx` - Added refresh logic

---

## 🎯 **What's Left**

**Only 1 endpoint unintegrated:**
- `/api/cleanup` - 7-day lifecycle maintenance

**Can be added as:**
- Admin button
- Scheduled cron job

---

## ✅ **Integration Status**

- ✅ Scraping (`/api/scrape-followers`)
- ✅ Ingestion (`/api/ingest`)
- ✅ Daily Selection (`/api/daily-selection`)
- ✅ Distribution (`/api/distribute`)
- ✅ Airtable Sync (`/api/airtable-sync`)
- ❌ Cleanup (`/api/cleanup`) - Optional

**7/8 endpoints integrated!** 🎉

---

## 🧪 **Quick Test**

1. Scrape accounts
2. Click "Assign to VAs"
3. Watch progress: Creating → Distributing → Syncing
4. See success toast
5. Check campaigns tab (new campaign)
6. Check username status (count updated)

---

**Status:** ✅ Ready to use!
