# College Bus Schedule System Guide

## 🎯 Overview

The BusNotify system now supports a comprehensive scheduling system designed specifically for college buses with **two-level timing management**:

1. **Global Schedule Settings** - Default timings that apply to all routes
2. **Route-Specific Overrides** - Custom timings for individual routes

---

## 🌍 Global Schedule Settings

### Location
Navigate to: **Admin Dashboard → Global Schedule Tab**

### Features

#### Fixed Timing
- **Morning Trip**: Fixed at `7:00 AM` for all buses (cannot be changed)
  - All buses depart at the same time in the morning
  - This ensures synchronized college start times

#### Configurable Timings
Admin can set default timings for:
- **Half Day Trip**: Early dismissal time (default: `1:00 PM`)
- **Evening Trip - Normal**: Regular college days (default: `4:45 PM`)
- **Evening Trip - Exam Days**: When exams are scheduled (default: `5:20 PM`)

### Actions

1. **Save Global Settings**
   - Updates default timings for NEW routes
   - Existing routes with custom timings are NOT affected

2. **Apply to All Routes**
   - Updates ALL existing routes with global timings
   - ⚠️ Warning: Overwrites any custom route timings
   - Confirmation dialog appears before applying

---

## 🚌 Route Management

### Location
Navigate to: **Admin Dashboard → Routes Tab**

### Creating a New Route

When creating a route, you'll see the **College Bus Trip Timings** section with a toggle:

#### Option 1: Use Global Timings (Default) 🌍
- Toggle is **ON** (blue)
- Route automatically uses global schedule settings
- Timing fields are disabled and show global values
- Easy management - update global settings to update all routes at once

#### Option 2: Custom Timings ✏️
- Toggle is **OFF** (gray)
- Enable custom timing inputs for this specific route
- Set unique times for:
  - Half Day Trip
  - Evening Normal Trip
  - Evening Exam Trip
- ⚠️ Note: Morning time remains fixed at 7:00 AM

### Visual Indicators

**When using Global Timings:**
- Gray background on timing fields
- Fields are disabled
- Info box shows current global timings
- 🌍 Globe icon in toggle label

**When using Custom Timings:**
- Colored backgrounds (Orange, Purple, Red)
- Fields are editable
- ✏️ Pencil icon in toggle label

---

## 📋 How It Works

### Scenario 1: All Routes Use Same Timings

1. Admin sets global schedule:
   - Half Day: 1:00 PM
   - Evening Normal: 4:45 PM
   - Evening Exam: 5:20 PM

2. All new routes automatically use these timings

3. To change timing for ALL buses:
   - Update Global Schedule
   - Click "Apply to All Routes"
   - Done! All routes updated instantly

### Scenario 2: Some Routes Need Different Timings

**Example**: Most routes end at 4:45 PM, but Route "Engineering Block" needs 5:00 PM

1. Create/Edit "Engineering Block" route
2. Turn OFF "Use Global Timings" toggle
3. Set Evening Normal to `5:00 PM`
4. Other routes continue using global timings

### Scenario 3: Change Half-Day Timing

**College announces early dismissal at 12:30 PM instead of 1:00 PM**

**Option A - Update All Routes:**
1. Go to Global Schedule Settings
2. Change Half Day to `12:30 PM`
3. Click "Apply to All Routes"
4. All routes updated (including custom ones)

**Option B - Update Only Global Default:**
1. Go to Global Schedule Settings
2. Change Half Day to `12:30 PM`
3. Click "Save Global Settings"
4. Only NEW routes use 12:30 PM
5. Existing routes keep their current times

---

## 🔧 API Endpoints

### Backend Implementation

```python
# Get global schedule
GET /api/admin/global-schedule

# Save global schedule
POST /api/admin/global-schedule
Body: {
  "morningTripTime": "7:00 AM",
  "halfDayTripTime": "1:00 PM",
  "eveningTripTime": "4:45 PM",
  "examEveningTime": "5:20 PM"
}

# Apply global schedule to all routes
POST /api/admin/apply-global-schedule
```

### Database Structure

**Collection: `global_schedule`**
```json
{
  "morningTripTime": "7:00 AM",
  "halfDayTripTime": "1:00 PM",
  "eveningTripTime": "4:45 PM",
  "examEveningTime": "5:20 PM",
  "updated_at": "2025-11-08T10:30:00Z"
}
```

**Collection: `routes`**
```json
{
  "name": "Route 1",
  "useGlobalSchedule": true,
  "morningTripTime": "7:00 AM",
  "halfDayTripTime": "1:00 PM",
  "eveningTripTime": "4:45 PM",
  "examEveningTime": "5:20 PM",
  ...
}
```

---

## 📱 Student View

### Schedule Page Behavior

Students see the schedule page with 4 schedule type buttons:
- **Regular Day**: Shows Morning + Evening Normal timings
- **Half Day**: Shows Morning + Half Day timings
- **Exam Day**: Shows Morning + Evening Exam timings
- **Holiday**: Shows "No buses scheduled"

The timings displayed come from:
1. Route's custom timings (if `useGlobalSchedule: false`)
2. Global schedule timings (if `useGlobalSchedule: true`)

---

## ✅ Best Practices

### For Daily Operations
1. Set up Global Schedule first
2. Create routes with "Use Global Timings" enabled
3. Only use custom timings for exceptional routes

### For Schedule Changes
1. **Regular changes** (affects all buses):
   - Update Global Schedule
   - Apply to All Routes

2. **One-time changes** (specific route):
   - Edit route individually
   - Toggle to Custom Timings

### For Administrators
- **Morning Time**: Never changes (7:00 AM fixed)
- **Half Day**: Can vary by semester/season
- **Evening Normal**: Standard college end time
- **Evening Exam**: Usually 30-45 minutes later than normal

---

## 🚀 Advantages

1. **Centralized Management**: Update all routes from one place
2. **Flexibility**: Individual routes can have custom timings
3. **Consistency**: Most routes follow same schedule automatically
4. **Easy Updates**: Change all buses at once or individually
5. **Clear UI**: Visual indicators show global vs custom timings
6. **Safety**: Confirmation dialogs prevent accidental overwrites

---

## 📝 Example Workflow

### Setting Up a New College Semester

1. **Set Global Defaults**
   ```
   Morning: 7:00 AM (fixed)
   Half Day: 1:00 PM
   Evening Normal: 4:30 PM (new semester timing)
   Evening Exam: 5:15 PM
   ```

2. **Create Routes**
   - Route "Main Campus" → Use Global ✓
   - Route "Engineering" → Use Global ✓
   - Route "Medical" → Custom (ends at 5:00 PM)
   - Route "Arts" → Use Global ✓

3. **Mid-Semester Exam Period**
   - Students select "Exam Day" on schedule page
   - All routes show exam timings automatically

4. **Early Dismissal Announcement**
   - Update Global Schedule: Half Day = 12:00 PM
   - Apply to All Routes
   - All students see updated timings

---

## 🎓 Summary

The new scheduling system provides:
- ✅ Fixed morning timing (7:00 AM) for all buses
- ✅ Global default timings for easy management
- ✅ Route-specific overrides when needed
- ✅ Bulk update capability
- ✅ Clear visual indicators
- ✅ Confirmation dialogs for safety

This design perfectly matches the college bus operation model where most buses follow the same schedule, but with flexibility for special cases.

---

**Last Updated**: November 8, 2025  
**Version**: 2.0
