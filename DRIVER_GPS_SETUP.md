# Driver GPS Tracking System - Setup Guide

## Overview
This system allows bus drivers to track their buses in real-time using their smartphone's GPS.

## How It Works
1. **Driver logs in** via phone browser at `/driver/login`
2. **Grants location permission** when prompted
3. **Clicks "Start Trip"** to begin broadcasting GPS
4. **Phone sends GPS coordinates** every 5 seconds to backend
5. **Students see real-time location** on the live-tracking map
6. **Clicks "End Trip"** when route is completed

## Setup Instructions

### 1. Create Driver Account
```bash
cd backend
python create_driver.py
```

This creates:
- Email: `driver@busnotify.com`
- Password: `driver123`
- Assigned to Bus #2 on Route-2

### 2. Start Backend Server
```bash
cd backend
uvicorn main:app --reload
```

### 3. Start Frontend
```bash
npm run dev
```

### 4. Test Driver Login
1. Open `http://localhost:3000/driver/login` on your phone (or desktop browser)
2. Login with: `driver@busnotify.com` / `driver123`
3. Click "Allow" when asked for location permission
4. Click "Start Trip"

### 5. View Live Tracking
1. Open `http://localhost:3000/dashboard` as a student
2. Search for buses from "Bellary Engineering College" to "Mothi Circle"
3. Click "Live Tracking" button on Bus #2
4. You'll see the bus marker at the driver's real GPS location!

## API Endpoints

### Driver Login
```
POST /api/driver/login
Body: { "email": "driver@busnotify.com", "password": "driver123" }
```

### Update Location (GPS)
```
POST /api/driver/update-location
Headers: Authorization: Bearer <token>
Body: {
  "bus_id": "2",
  "latitude": 15.8497,
  "longitude": 74.4977
}
```

### Start Trip
```
POST /api/driver/start-trip
Headers: Authorization: Bearer <token>
Body: {
  "bus_id": "2",
  "route_id": "route-2"
}
```

### End Trip
```
POST /api/driver/end-trip?bus_id=2
Headers: Authorization: Bearer <token>
```

## Features

### Driver Dashboard
- ✅ Real-time GPS tracking
- ✅ Auto-send location every 5 seconds
- ✅ Start/Stop trip controls
- ✅ GPS status indicator
- ✅ Current position display

### Student Live Tracking
- ✅ See driver's real GPS location on map
- ✅ Auto-refresh every 5 seconds
- ✅ Pan map to follow bus
- ✅ Show GPS coordinates in popup
- ✅ Calculate nearest stop

## Testing Tips

1. **Use Real Phone**: Best results with actual smartphone GPS
2. **Enable Location**: Must grant browser location permission
3. **Stay Connected**: Keep phone online during trip
4. **Battery**: GPS can drain battery, consider charger for long routes
5. **Accuracy**: GPS accuracy depends on device and signal

## Security Notes

- Driver must be logged in (JWT token required)
- Only drivers with `role: "driver"` can access
- Location updates require valid authentication
- Trip must be started before location broadcasts

## Troubleshooting

**Location not updating?**
- Check location permission in browser settings
- Ensure GPS is enabled on phone
- Check network connection
- Verify trip is started

**Bus not showing on map?**
- Verify driver started the trip
- Check bus is assigned correct route
- Ensure location updates are being sent (check lastUpdate time)
- Refresh the live-tracking page

**Login fails?**
- Run `create_driver.py` to create account
- Check credentials are correct
- Verify backend is running on port 8000

## Next Steps

- Add multiple driver accounts for different buses
- Implement route deviation alerts
- Add speed monitoring
- Track trip history
- Generate reports on delays/early arrivals
