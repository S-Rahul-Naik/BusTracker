# 🚀 Run the Drivers App - Command Reference

## Prerequisites

Make sure you have:
- ✅ Node.js installed
- ✅ Android phone with USB debugging enabled
- ✅ Phone connected via USB

---

## Step-by-Step Commands

### 1. Navigate to drivers-app folder
```powershell
cd C:\Users\Lenovo\Desktop\Busnotify\drivers-app
```

### 2. Install dependencies
```powershell
npm install
```

### 3. Find your laptop IP
```powershell
ipconfig
```
**Look for:** `IPv4 Address` (example: 192.168.1.100)

### 4. Update config file
Open `src\config\config.ts` and change:
```typescript
BASE_URL: 'http://192.168.1.100:8000', // Use YOUR IP here
```

### 5. Make sure backend is running
In a separate terminal:
```powershell
cd C:\Users\Lenovo\Desktop\Busnotify\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Build and run on Android phone
```powershell
npx expo run:android
```

Wait 2-3 minutes for first build...

### 7. Test the app!
- Login with: `driver@busnotify.com` / `driver123`
- Allow location permissions (All the time)
- Click "Start Trip"
- Lock phone
- Check backend logs - should see GPS updates!

---

## Quick Commands Summary

```powershell
# 1. Go to drivers-app folder
cd C:\Users\Lenovo\Desktop\Busnotify\drivers-app

# 2. Install (first time only)
npm install

# 3. Get your IP
ipconfig

# 4. Edit src\config\config.ts with your IP

# 5. Start backend (separate terminal)
cd ..\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 6. Build and run app
cd ..\drivers-app
npx expo run:android
```

---

## Troubleshooting

### "No devices found"
```powershell
# Check if phone is connected
adb devices

# If no devices, enable USB debugging on phone:
# Settings → About Phone → Tap Build Number 7 times
# Settings → Developer Options → USB Debugging → ON
```

### "Cannot connect to backend"
```powershell
# Test backend from phone browser
# Open: http://YOUR_IP:8000/docs
# If it doesn't load, check:
# - Firewall settings
# - Phone and laptop on same WiFi
# - Backend is running with --host 0.0.0.0
```

### Need to rebuild?
```powershell
# Clean and rebuild
npx expo run:android --no-build-cache
```

---

## For Production Build

```powershell
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK
eas build --platform android --profile preview

# Download APK from Expo dashboard and share with drivers!
```

---

**That's it! 🎉** The app will install on your phone and you can start tracking GPS in the background!
