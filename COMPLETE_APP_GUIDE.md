# Instagram Marketing Automation - Complete Application Guide

**Version:** 1.0  
**Last Updated:** October 6, 2025  
**Tech Stack:** Next.js 14 + TypeScript + Supabase + Flask API

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Features & Workflows](#features--workflows)
5. [Component Reference](#component-reference)
6. [Database Schema](#database-schema)
7. [API Integration](#api-integration)
8. [Environment Setup](#environment-setup)
9. [Troubleshooting](#troubleshooting)
10. [Development Notes](#development-notes)

---

## 🎯 Overview

This is an Instagram marketing automation platform that scrapes Instagram followers, filters them by gender, and distributes them to Virtual Assistants (VAs) via Airtable for outreach campaigns.

### **Core Functionality**

1. **Scrape Instagram Followers** - Extract followers from source accounts
2. **Gender Filtering** - Identify male profiles using name-based detection
3. **Database Management** - Store and deduplicate profiles in Supabase
4. **Campaign Creation** - Select daily batches of unused profiles
5. **VA Distribution** - Distribute profiles across 80 VA Airtable tables
6. **Airtable Sync** - Push profiles to Airtable for VA access
7. **Lifecycle Management** - Track and cleanup 7-day old campaigns

### **Key Metrics**

- **Daily Target:** 14,400 unique male profiles
- **VA Count:** 80 virtual assistants
- **Profiles per VA:** 180 per day
- **Campaign Lifecycle:** 7 days
- **Total Capacity:** 1.008M profiles/week (14,400 × 7 days)

---

## 🚀 Quick Start

### **Prerequisites**

```bash
# Required
- Node.js 18+ 
- npm or yarn
- Supabase account (database)
- Python 3.9+ (for backend API)
- Apify account (for scraping)
- Airtable account (for VA workspace)
```

### **Installation**

```bash
# 1. Clone and navigate
cd client

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

### **First Time Setup**

1. **Login:** Navigate to `/callum` route
   - Username: (from env `NEXT_PUBLIC_USERNAME`)
   - Password: (from env `NEXT_PUBLIC_PASSWORD`)
   - OTP: (from env `NEXT_PUBLIC_OTP`)

2. **Add Source Accounts:** Click "Edit Source Profiles" in Dependencies Card
   - Add Instagram usernames or URLs
   - Saves to Supabase `source_profiles` table

3. **Run Scraping:** Click "Find Accounts" button
   - Scrapes followers from source accounts
   - Auto-ingests to database
   - Shows progress bar (scraping → ingesting → complete)

4. **Assign to VAs:** Click "Assign to VAs" button
   - Creates campaign and selects 14,400 profiles
   - Distributes to 80 VA tables (180 each)
   - Syncs to Airtable
   - Shows progress bar (creating → distributing → syncing → complete)

---

## 🏗️ Architecture

### **Tech Stack**

**Frontend:**
- Next.js 14.2.25 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN UI (Radix UI primitives)
- Supabase Client

**Backend:**
- Flask API (Python)
- Apify (Instagram scraping)
- Supabase (PostgreSQL database)
- Airtable API

**Database:**
- Supabase PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions

### **Application Flow**

```
┌─────────────────┐
│  Source Profiles │
│  (Instagram IDs) │
└────────┬─────────┘
         │
         ▼
┌─────────────────────┐
│  Apify Scraper      │
│  (Extract Followers)│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Gender Detection   │
│  (Filter Males)     │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Supabase Storage   │
│  (Deduplication)    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Daily Selection    │
│  (14,400 profiles)  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  VA Distribution    │
│  (80 tables × 180)  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Airtable Sync      │
│  (VA Access)        │
└─────────────────────┘
```

---

## ✨ Features & Workflows

### **1. Instagram Account Management**

**Component:** `dependencies-card.tsx`

**Features:**
- Add Instagram accounts (username or URL)
- Remove individual accounts
- Edit source profiles (dialog)
- Load profiles from database
- Validate Instagram URLs

**Database Table:** `source_profiles`

**Workflow:**
1. Click "Edit Source Profiles" button
2. Enter Instagram username or URL
3. Press Enter or click + button
4. Profile saved to Supabase
5. Appears in source accounts list

**Clear All Profiles:**
- Click "Clear All" button
- Enter password: `delete123` (configurable via env)
- Confirm deletion
- All profiles removed from database

---

### **2. Follower Scraping & Auto-Ingest**

**Component:** `dependencies-card.tsx`

**Features:**
- Scrape followers from source accounts
- Gender filtering (male profiles only)
- Auto-ingest to database
- Progress tracking
- Duplicate detection

**API Endpoints:**
- `/api/scrape-followers` - Scrapes Instagram followers
- `/api/ingest` - Saves to database (auto-triggered)

**Workflow:**
1. Click "Find Accounts" button
2. **Scraping Phase (10-50%):**
   - Calls Apify Instagram scraper
   - Extracts followers from all source accounts
   - Applies gender detection (male filtering)
   - Returns filtered accounts

3. **Ingesting Phase (60-80%):**
   - Auto-triggered after scraping
   - Saves to `raw_scraped_profiles` table
   - Deduplicates in `global_usernames` table
   - Marks as unused (`used: false`)

4. **Complete (100%):**
   - Shows success message
   - Displays scraped accounts in table
   - Updates username status card

**Database Tables:**
- `raw_scraped_profiles` - All scraped data
- `global_usernames` - Deduplicated usernames

---

### **3. Campaign Workflow & VA Assignment**

**Component:** `payments-table.tsx`

**Features:**
- Display scraped accounts (paginated)
- One-click campaign creation
- VA distribution
- Airtable synchronization
- Progress tracking

**API Endpoints:**
1. `/api/daily-selection` - Creates campaign, selects 14,400 profiles
2. `/api/distribute/{id}` - Distributes to 80 VA tables
3. `/api/airtable-sync/{id}` - Syncs to Airtable

**Workflow:**
1. Click "Assign to VAs" button

2. **Creating Campaign (0-33%):**
   - POST `/api/daily-selection`
   - Creates campaign in `campaigns` table
   - Selects 14,400 unused profiles
   - Saves to `daily_assignments` table
   - Marks profiles as used (`used: true`)

3. **Distributing (33-66%):**
   - POST `/api/distribute/{campaign_id}`
   - Distributes 14,400 profiles to 80 VA tables
   - Each VA gets 180 profiles
   - Saves distribution mapping

4. **Syncing to Airtable (66-100%):**
   - POST `/api/airtable-sync/{campaign_id}`
   - Pushes profiles to 80 Airtable tables
   - VAs can access via Airtable interface
   - Updates campaign status to `success`

5. **Complete:**
   - Shows success notification
   - Auto-refreshes UI components
   - New campaign appears in Campaigns tab

**Progress Messages:**
- 📋 Creating campaign and selecting profiles...
- 🎲 Distributing to VA tables...
- ☁️ Syncing to Airtable...
- ✅ Complete!

---

### **4. Campaign History**

**Component:** `campaigns-table.tsx`

**Features:**
- View all campaigns
- Color-coded status indicators
- Campaign details (date, count, status)

**Database Table:** `campaigns`

**Status Indicators:**
- 🟢 **Green (Success)** - Campaign completed successfully
- 🔴 **Red (Failed)** - Campaign failed during execution
- ⚪ **Grey (Pending)** - Campaign in progress

**Data Displayed:**
- Campaign Date
- Total Assigned (profiles count)
- Status
- Created timestamp

---

### **5. Username Pool Status**

**Component:** `username-status-card.tsx`

**Features:**
- Shows unused username count
- Daily target comparison (14,400)
- Manual refresh button
- Status warnings

**Database Query:**
```sql
SELECT COUNT(*) FROM global_usernames WHERE used = false
```

**Status Messages:**
- **Ready (Grey):** Sufficient profiles (≥14,400)
  - "You can proceed with the VA assignment."
  
- **Warning (Red):** Insufficient profiles (<14,400)
  - "Scrape additional followers before proceeding."

**Refresh:**
- Click refresh icon (↻) button
- Shows loading spinner
- Updates count from database

---

### **6. Edit Source Profiles**

**Component:** `edit-source-profiles-dialog.tsx`

**Features:**
- Bulk profile management
- Add/remove profiles
- Password-protected clear all
- Real-time database sync

**Database Table:** `source_profiles`

**Operations:**

**Add Profile:**
- Enter username or Instagram URL
- Validates format
- Checks for duplicates
- Saves to database
- Generates UUID for profile

**Remove Profile:**
- Click X button next to profile
- Deletes from database
- Updates UI immediately

**Clear All:**
- Click "Clear All" button
- Enter password: `delete123`
- Confirms deletion
- Removes all profiles from database

---

## 🗂️ Component Reference

### **Page Components**

| Component | Path | Purpose |
|-----------|------|---------|
| Login Page | `/app/callum/page.tsx` | User authentication |
| Dashboard | `/app/callum-dashboard/page.tsx` | Main application interface |

### **Feature Components**

| Component | File | Purpose |
|-----------|------|---------|
| **DependenciesCard** | `dependencies-card.tsx` | Instagram account management & scraping |
| **PaymentsTable** | `payments-table.tsx` | Scraped results & VA assignment |
| **CampaignsTable** | `campaigns-table.tsx` | Campaign history with status |
| **UsernameStatusCard** | `username-status-card.tsx` | Username pool status |
| **EditSourceProfilesDialog** | `edit-source-profiles-dialog.tsx` | Bulk profile editor |

### **UI Components** (ShadCN UI)

Located in `components/ui/`:
- `tabs.tsx` - Tab navigation
- `progress.tsx` - Progress bars
- `card.tsx` - Card containers
- `button.tsx` - Buttons
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Text inputs
- `skeleton.tsx` - Loading skeletons
- `toast.tsx` - Notifications
- `avatar.tsx` - User avatars
- `dropdown-menu.tsx` - Dropdown menus

### **Context & Hooks**

| File | Purpose |
|------|---------|
| `contexts/auth-context.tsx` | Authentication state management |
| `hooks/use-toast.ts` | Toast notification hook |

### **Utilities**

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Supabase client initialization |
| `lib/utils.ts` | Utility functions (cn for class merging) |

---

## 🗄️ Database Schema

### **Tables**

#### **1. source_profiles**
Stores Instagram accounts to scrape from.

```sql
CREATE TABLE source_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique identifier (UUID)
- `username` - Instagram username
- `created_at` - Timestamp

**RLS Policies:**
- Anon users: SELECT, INSERT, DELETE

---

#### **2. raw_scraped_profiles**
Stores all scraped Instagram profiles.

```sql
CREATE TABLE raw_scraped_profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  follower_count INTEGER,
  following_count INTEGER,
  post_count INTEGER,
  is_verified BOOLEAN,
  is_private BOOLEAN,
  biography TEXT,
  url TEXT,
  detected_gender TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` - Instagram user ID
- `username` - Instagram handle
- `full_name` - Display name
- `follower_count` - Follower count
- `following_count` - Following count
- `post_count` - Post count
- `is_verified` - Verified badge status
- `is_private` - Private account status
- `biography` - Bio text
- `url` - Profile URL
- `detected_gender` - Gender detection result
- `created_at` - Scraping timestamp

---

#### **3. global_usernames**
Deduplicated username pool.

```sql
CREATE TABLE global_usernames (
  username TEXT PRIMARY KEY,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `username` - Unique Instagram username
- `used` - Assignment status (false = available)
- `created_at` - First seen timestamp

**Purpose:**
- Deduplication across all scraping
- Track which profiles have been assigned
- Daily selection pool

**RLS Policies:**
- Anon users: SELECT

---

#### **4. campaigns**
Campaign tracking and status.

```sql
CREATE TABLE campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_date DATE NOT NULL,
  total_assigned INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `campaign_id` - Unique campaign ID
- `campaign_date` - Campaign date (YYYY-MM-DD)
- `total_assigned` - Number of profiles assigned
- `status` - Campaign status (pending/success/failed)
- `created_at` - Creation timestamp

**Status Values:**
- `pending` - Campaign in progress
- `success` - Campaign completed
- `failed` - Campaign failed

**RLS Policies:**
- Anon users: SELECT

---

#### **5. daily_assignments**
Profile-to-campaign assignments.

```sql
CREATE TABLE daily_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(campaign_id),
  username TEXT,
  va_table_number INTEGER,
  assigned_at TIMESTAMP DEFAULT NOW()
);
```

**Columns:**
- `id` - Unique assignment ID
- `campaign_id` - Foreign key to campaigns
- `username` - Assigned username
- `va_table_number` - VA table number (1-80)
- `assigned_at` - Assignment timestamp

**Purpose:**
- Track which profiles assigned to which campaign
- Map profiles to specific VA tables
- Historical record of assignments

---

## 🔌 API Integration

### **Backend API Endpoints**

**Base URL:** `http://localhost:5001` (configurable via `NEXT_PUBLIC_API_URL`)

#### **1. Scrape Followers**
```http
POST /api/scrape-followers
Content-Type: application/json

{
  "accounts": ["username1", "username2"],
  "targetGender": "male"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "totalScraped": 1000,
    "totalFiltered": 450,
    "genderDistribution": {
      "male": 450,
      "female": 400,
      "unknown": 150
    }
  }
}
```

---

#### **2. Ingest to Database**
```http
POST /api/ingest
Content-Type: application/json

{
  "profiles": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profiles ingested successfully",
  "stats": {
    "total_processed": 450,
    "new_profiles": 380,
    "duplicates": 70
  }
}
```

---

#### **3. Daily Selection**
```http
POST /api/daily-selection
Content-Type: application/json

{}
```

**Response:**
```json
{
  "success": true,
  "campaign_id": "uuid-here",
  "total_selected": 14400,
  "campaign_date": "2025-10-06"
}
```

---

#### **4. Distribute to VA Tables**
```http
POST /api/distribute/{campaign_id}
```

**Response:**
```json
{
  "success": true,
  "campaign_id": "uuid-here",
  "va_tables": 80,
  "profiles_per_table": 180
}
```

---

#### **5. Airtable Sync**
```http
POST /api/airtable-sync/{campaign_id}
```

**Response:**
```json
{
  "success": true,
  "campaign_id": "uuid-here",
  "tables_synced": 80,
  "total_records": 14400
}
```

---

#### **6. Cleanup (7-day old campaigns)**
```http
POST /api/cleanup
```

**Response:**
```json
{
  "success": true,
  "campaigns_cleaned": 5,
  "profiles_freed": 72000
}
```

**Note:** Should be run as a cron job daily:
```bash
0 2 * * * curl -X POST http://localhost:5001/api/cleanup
```

---

## ⚙️ Environment Setup

### **Required Environment Variables**

Create `.env.local` file in `/client` directory:

```bash
# Next.js App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5001

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Authentication Credentials
NEXT_PUBLIC_USERNAME=your-username
NEXT_PUBLIC_PASSWORD=your-password
NEXT_PUBLIC_OTP=123456

# Campaign Configuration
NEXT_PUBLIC_DAILY_SELECTION_TARGET=14400

# Source Profiles Management
NEXT_PUBLIC_DELETE_PASSWORD=delete123
```

### **Backend Environment Variables**

In `/server/.env`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Apify (Instagram Scraper)
APIFY_API_KEY=your-apify-key
APIFY_ACTOR_ID=your-actor-id

# Airtable
AIRTABLE_API_KEY=your-airtable-key
AIRTABLE_BASE_ID=your-base-id

# Gender Detection API (optional)
GENDER_API_KEY=your-gender-api-key
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. "Cannot connect to Supabase"**

**Problem:** Database connection failing

**Solution:**
1. Check `.env.local` has correct Supabase URL and anon key
2. Verify RLS policies are enabled for anon role
3. Check Supabase project is active (not paused)

```sql
-- Enable RLS policies for anon role
GRANT SELECT ON source_profiles TO anon;
GRANT INSERT ON source_profiles TO anon;
GRANT DELETE ON source_profiles TO anon;
GRANT SELECT ON campaigns TO anon;
GRANT SELECT ON global_usernames TO anon;
```

---

#### **2. "Scraping failed"**

**Problem:** `/api/scrape-followers` returns error

**Solution:**
1. Check backend API is running (`python api.py`)
2. Verify Apify API key is valid
3. Check Instagram accounts are public
4. Ensure Apify actor has sufficient runs quota

---

#### **3. "Campaign creation failed"**

**Problem:** Daily selection returns insufficient profiles

**Solution:**
1. Check `global_usernames` table has ≥14,400 unused profiles
2. Run scraping workflow to add more profiles
3. Verify `used` column is updating correctly

```sql
-- Check unused profile count
SELECT COUNT(*) FROM global_usernames WHERE used = false;
```

---

#### **4. "Airtable sync failed"**

**Problem:** Profiles not appearing in Airtable

**Solution:**
1. Verify Airtable API key is valid
2. Check Airtable base ID is correct
3. Ensure VA tables exist (Table 1 - Table 80)
4. Check API rate limits not exceeded

---

#### **5. TypeScript errors after changes**

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

## 🔧 Development Notes

### **Code Architecture Decisions**

1. **Component Props vs Supabase:**
   - `payments-table.tsx` receives data via props (not direct Supabase)
   - Parent dashboard manages state and passes down
   - Allows flexibility for future data sources

2. **Auto-Ingest Implementation:**
   - Scraping auto-triggers ingest (no manual step)
   - Progress bar shows both phases
   - Error handling for each phase separately

3. **Campaign Workflow:**
   - Sequential API calls (not parallel)
   - Each step validates before proceeding
   - Progress tracking for user feedback

4. **Database Deduplication:**
   - Two-table strategy: `raw_scraped_profiles` + `global_usernames`
   - Raw table keeps all data
   - Global table prevents duplicates

### **Performance Considerations**

1. **Pagination:** Payments table shows 10 accounts per page
2. **Database Limits:** Recent 100 accounts loaded from `raw_scraped_profiles`
3. **Scraping Batch Size:** Configurable in backend API
4. **Airtable Rate Limits:** Built-in delays between batch uploads

### **Future Enhancements**

- [ ] Add Supabase integration to `payments-table.tsx` for persistent data
- [ ] Implement real-time updates using Supabase subscriptions
- [ ] Add export functionality (CSV/Excel)
- [ ] Campaign analytics dashboard
- [ ] VA performance tracking
- [ ] Automated cleanup cron job
- [ ] Multi-language support
- [ ] Dark mode theme

---

## 📝 Changelog

### **Version 1.0** (October 6, 2025)
- ✅ Initial release
- ✅ Instagram scraping with gender filtering
- ✅ Auto-ingest to database
- ✅ Campaign workflow (selection → distribution → Airtable)
- ✅ Progress bars for all async operations
- ✅ Source profile management
- ✅ Campaign history with status indicators
- ✅ Username pool status card
- ✅ Authentication system
- ✅ Comprehensive error handling

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review error messages in browser console
3. Check backend logs (`server/api.py`)
4. Verify database state in Supabase dashboard
5. Test API endpoints with curl/Postman

---

## 📄 License

Proprietary - All rights reserved

---

**End of Documentation**
