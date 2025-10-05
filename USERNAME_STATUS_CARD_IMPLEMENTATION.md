# Username Status Card - Implementation Guide

## 📋 Overview

Added a new status card component to the `/callum-dashboard` route that displays the count of unused usernames from the `global_usernames` Supabase table and provides actionable guidance to the user.

---

## 🎯 Component Details

### File Created:
**`/client/components/username-status-card.tsx`**

### Functionality:
1. **Fetches Count**: Queries `global_usernames` table where `used = false`
2. **Compares to Target**: Checks against `NEXT_PUBLIC_DAILY_SELECTION_TARGET` (14,400)
3. **Displays Status**: Shows different messages based on comparison

---

## 🎨 UI Design

### Card Structure:
```
┌─────────────────────────────────────────┐
│ Username Status                         │
├─────────────────────────────────────────┤
│                                         │
│ 14,250  usernames remaining             │
│ ✓ You can proceed with VA assignment   │
│                                         │
│ ──────────────────────────────────────  │
│ Daily Target:          14,400           │
│ Needed:                     0           │
└─────────────────────────────────────────┘
```

### Status Messages:

#### ✅ When `unusedCount >= DAILY_SELECTION_TARGET`:
- **Message**: "You can proceed with the VA assignment."
- **Color**: Muted/grey
- **Icon**: CheckCircle2 (green check)

#### ❌ When `unusedCount < DAILY_SELECTION_TARGET`:
- **Message**: "Scrape additional followers before proceeding."
- **Color**: Red (destructive)
- **Icon**: AlertCircle (warning)

---

## 🔧 Technical Implementation

### Environment Variable:
```env
# .env.local
NEXT_PUBLIC_DAILY_SELECTION_TARGET=14400
```

### Supabase Query:
```typescript
const { count, error } = await supabase
  .from('global_usernames')
  .select('*', { count: 'exact', head: true })
  .eq('used', false)
```

### Dashboard Integration:
```tsx
// /app/callum-dashboard/page.tsx
import { UsernameStatusCard } from "@/components/username-status-card"

// Placed above existing components
<div className="mb-6">
  <UsernameStatusCard />
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <DependenciesCard />
  <PaymentsTable />
</div>
```

---

## 🔒 Database Configuration

### Table: `global_usernames`

**Schema:**
```sql
id          TEXT                      PRIMARY KEY
username    TEXT                      NOT NULL UNIQUE
full_name   TEXT                      NULL
used        BOOLEAN                   DEFAULT false
created_at  TIMESTAMP WITH TIME ZONE  DEFAULT NOW()
used_at     TIMESTAMP WITH TIME ZONE  NULL
```

### RLS Policy Added:
```sql
-- Migration: add_anon_read_policy_global_usernames
CREATE POLICY "Allow anonymous users to read global_usernames"
ON global_usernames
FOR SELECT
TO anon
USING (true);
```

**Purpose:** Allows frontend to read (but not modify) the `global_usernames` table.

---

## 📊 Features

### 1. **Real-time Count Display**
- Shows current count of unused usernames
- Large, bold number for easy visibility
- Formatted with thousand separators (e.g., "14,250")

### 2. **Contextual Status**
- Dynamic message based on comparison
- Color-coded for quick understanding
- Icon indicates status (check or warning)

### 3. **Additional Metrics**
- **Daily Target**: Shows configured target (14,400)
- **Needed**: Calculates how many more usernames are required
  - Shows 0 if target is met
  - Shows difference if target not met
  - Color-coded (green if met, orange if not)

### 4. **Loading & Error States**
- **Loading**: Shows skeleton placeholders
- **Error**: Displays error message with icon
- **Success**: Shows full card with data

---

## 🎯 User Flow

### Scenario 1: Target Met (14,400+ unused usernames)
```
User opens dashboard
  ↓
Status card loads
  ↓
Shows: "14,250 usernames remaining"
Status: "✓ You can proceed with VA assignment" (grey)
Needed: 0
  ↓
User can proceed with confidence
```

### Scenario 2: Target Not Met (< 14,400 unused usernames)
```
User opens dashboard
  ↓
Status card loads
  ↓
Shows: "8,500 usernames remaining"
Status: "⚠ Scrape additional followers before proceeding" (red)
Needed: 5,900
  ↓
User knows to scrape more followers first
```

---

## 🧪 Testing

### Test Cases:

#### 1. **Normal Operation**
```typescript
// Current unused count: 14,250
Expected:
- Count: "14,250 usernames remaining"
- Message: "You can proceed with VA assignment" (grey)
- Icon: CheckCircle2
- Needed: 0 (green)
```

#### 2. **Below Target**
```typescript
// Current unused count: 8,500
Expected:
- Count: "8,500 usernames remaining"
- Message: "Scrape additional followers before proceeding" (red)
- Icon: AlertCircle
- Needed: 5,900 (orange)
```

#### 3. **Empty Database**
```typescript
// Current unused count: 0
Expected:
- Count: "0 usernames remaining"
- Message: "Scrape additional followers before proceeding" (red)
- Icon: AlertCircle
- Needed: 14,400 (orange)
```

#### 4. **Loading State**
```typescript
// While fetching data
Expected:
- Skeleton placeholders shown
- No flickering
- Smooth transition to data
```

#### 5. **Error State**
```typescript
// If Supabase query fails
Expected:
- Error icon (AlertCircle)
- Message: "Failed to load username status"
- Count defaults to 0
```

---

## 📐 Layout & Spacing

### Position:
- Directly above `DependenciesCard` and `PaymentsTable`
- Full width of the container
- `mb-6` spacing below (24px gap)

### Card Styling:
- Uses ShadCN UI `Card` component
- Compact padding (pb-3 in header)
- Rounded corners
- Subtle border
- Consistent with other dashboard cards

### Responsive Design:
- Full width on all screen sizes
- Text remains readable on mobile
- Icons scale appropriately

---

## 🔄 Auto-Refresh

Currently, the card fetches data once on mount. Future enhancement could add:

```typescript
// Auto-refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(fetchUnusedCount, 30000)
  return () => clearInterval(interval)
}, [])
```

---

## 🎨 Component Props

The component is self-contained and requires no props:

```typescript
<UsernameStatusCard />
```

---

## 📝 Code Structure

### State Management:
```typescript
const [unusedCount, setUnusedCount] = useState<number | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

### Computed Values:
```typescript
const dailyTarget = Number(process.env.NEXT_PUBLIC_DAILY_SELECTION_TARGET) || 14400
const isReady = unusedCount !== null && unusedCount >= dailyTarget
const statusMessage = isReady ? "proceed" : "scrape more"
```

### Lifecycle:
```typescript
useEffect(() => {
  fetchUnusedCount() // Fetch on mount
}, [])
```

---

## ✅ Checklist

- [x] Component created (`username-status-card.tsx`)
- [x] Integrated into dashboard (`callum-dashboard/page.tsx`)
- [x] Environment variable added (`.env.local`)
- [x] Supabase RLS policy created
- [x] TypeScript types verified
- [x] No compilation errors
- [x] Loading states implemented
- [x] Error handling implemented
- [x] Responsive design
- [x] ShadCN UI consistency

---

## 🚀 Ready to Use

The component is fully implemented and ready to test!

### To Test:
1. Start dev server: `npm run dev`
2. Navigate to `/callum-dashboard`
3. Status card should appear above other components
4. Should show current count of unused usernames
5. Status message should match comparison logic

---

**Last Updated:** October 5, 2025  
**Status:** ✅ Complete & Ready for Testing
