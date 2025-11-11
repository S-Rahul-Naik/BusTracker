# 🚌 Dynamic Multi-Bus Tracking - Complete Guide

## ✅ How It Works Now

The system is **fully dynamic** - you can have **multiple buses** with different drivers, and each bus will show **real-time GPS tracking** on the website!

---

## 🎯 Updated Login Flow

### **Driver Native App:**
1. Driver enters **Bus Number** (e.g., 1, 2, 3, 4)
2. Driver enters **Email** (e.g., driver1@busnotify.com)
3. Driver enters **Password** (e.g., driver123)
4. System verifies the driver is assigned to that bus
5. Starts GPS tracking for **that specific bus**

### **Student Website:**
1. Student opens Live Tracking page
2. Selects a **route** from dropdown
3. Sees **all buses on that route** in real-time
4. Each bus shows its **live GPS location**

---

## 📱 Multiple Drivers Setup

### Step 1: Create Multiple Driver Accounts

Run this script to create 4 drivers with different buses:

```powershell
cd backend
python create_multiple_drivers.py
```

This creates:

| Bus | Driver Email | Password | Route | Driver Name |
|-----|--------------|----------|-------|-------------|
| 1 | driver1@busnotify.com | driver123 | route-1 | Rajesh Kumar |
| 2 | driver2@busnotify.com | driver123 | route-1762589112.350423 | John Driver |
| 3 | driver3@busnotify.com | driver123 | route-1 | Suresh Patel |
| 4 | driver4@busnotify.com | driver123 | route-2 | Mahesh Singh |

---

## 🧪 Testing Multi-Bus Tracking

### **Scenario: Track 2 Buses Simultaneously**

#### **Phone 1 (Driver 1):**
```
Bus Number: 1
Email: driver1@busnotify.com
Password: driver123
→ Start Trip → Bus 1 starts tracking
```

#### **Phone 2 (Driver 2):**
```
Bus Number: 2
Email: driver2@busnotify.com
Password: driver123
→ Start Trip → Bus 2 starts tracking
```

#### **Student Website:**
```
http://localhost:3000/live-tracking
→ Select: route-1762589112.350423
→ See BOTH Bus 1 AND Bus 2 moving in real-time! 🎉
```

---

## 🗺️ How Live Tracking Works

### **Backend (MongoDB):**
```javascript
// Each bus has its own GPS coordinates
{
  "bus_number": "1",
  "current_location": {
    "latitude": 15.1646,
    "longitude": 76.8792,
    "updated_at": "2025-11-11T12:30:45"
  },
  "trip_active": true,
  "route_id": "route-1"
}

{
  "bus_number": "2",
  "current_location": {
    "latitude": 15.1650,
    "longitude": 76.8800,
    "updated_at": "2025-11-11T12:30:47"
  },
  "trip_active": true,
  "route_id": "route-1762589112.350423"
}
```

### **Native App (Driver):**
```typescript
// Each driver's phone sends GPS for their specific bus
POST /api/driver/update-location
{
  "bus_id": "1",  // ← Dynamic! Based on driver login
  "latitude": 15.1646,
  "longitude": 76.8792
}
```

### **Website (Student):**
```typescript
// Website fetches ALL buses for selected route
GET /api/buses?route_id=route-1

// Returns:
[
  { bus_number: "1", current_location: {...} },
  { bus_number: "2", current_location: {...} }
]

// Shows multiple markers on map, one for each bus!
```

---

## 🎨 Website Live Tracking Features

The website (`/live-tracking`) already supports:

✅ **Route Selection** - Dropdown to select any route
✅ **Multi-Bus Display** - Shows all buses on that route
✅ **Real-time Updates** - Refreshes every 5 seconds
✅ **Bus Markers** - Each bus has its own marker
✅ **Current Location** - Shows which stop bus is near
✅ **Progress Bar** - Shows % completion of route

---

## 🚀 Quick Test (Complete Flow)

### **1. Create Multiple Drivers**
```powershell
cd C:\Users\Lenovo\Desktop\Busnotify\backend
python create_multiple_drivers.py
```

### **2. Start Backend**
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### **3. Start Frontend**
```powershell
cd C:\Users\Lenovo\Desktop\Busnotify
npm run dev
```

### **4. Install App on Phone 1**
```powershell
cd drivers-app
npx expo run:android
```

**On Phone 1:**
- Bus Number: **1**
- Email: driver1@busnotify.com
- Password: driver123
- Click "Start Trip"

### **5. Install App on Phone 2** (optional)
If you have a second phone, install the app and:

**On Phone 2:**
- Bus Number: **2**
- Email: driver2@busnotify.com
- Password: driver123
- Click "Start Trip"

### **6. Open Website**
```
http://localhost:3000/live-tracking
```

- Select route from dropdown
- See **all active buses** on that route
- Watch them move in real-time!

---

## 📊 Backend Verification

### Check which buses are active:
```powershell
# MongoDB query (if you have mongo shell)
mongo bus_tracking
db.buses.find({ trip_active: true })
```

### Check backend logs:
```
📍 Background location sent: Bus 1 - {lat: 15.164, lng: 76.879}
📍 Background location sent: Bus 2 - {lat: 15.165, lng: 76.880}
✅ Location updated successfully: Bus 1
✅ Location updated successfully: Bus 2
```

---

## 🎯 Key Points

1. **No Hardcoding!** Bus number comes from driver login
2. **Dynamic Routes!** Each bus can be on different route
3. **Multiple Buses!** Track as many buses as you want
4. **Real-time!** All updates happen every 5 seconds
5. **Scalable!** Add more buses by just creating driver accounts

---

## 📱 Adding New Buses

To add a new bus (e.g., Bus 5):

```python
# In create_multiple_drivers.py, add:
{
    "email": "driver5@busnotify.com",
    "password": "driver123",
    "name": "New Driver",
    "phone": "+91 9876543214",
    "role": "driver",
    "bus_number": "5",
    "route_id": "route-1"
}
```

Run the script again:
```powershell
python create_multiple_drivers.py
```

Done! Now you can login as Bus 5 driver!

---

## 🎉 Summary

**Before:** Hardcoded to Bus 2 only
**Now:** Any bus number, any driver, any route!

**Login asks:**
- ✅ Bus Number (dynamic)
- ✅ Email (authenticates driver)
- ✅ Password (verifies identity)

**Website shows:**
- ✅ All buses on selected route
- ✅ Real-time GPS for each bus
- ✅ Multiple buses simultaneously

**Completely Dynamic! 🚀**
