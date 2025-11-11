# 🚌 BusNotify Drivers - Native Mobile App

A React Native (Expo) mobile app for bus drivers with **background GPS tracking**. This app runs on Android and iOS, tracking the driver's location in real-time even when the app is closed.

## ✨ Features

- ✅ **Background GPS Tracking** - Works even when app is closed or phone is locked
- ✅ **Real-time Location Updates** - Sends GPS coordinates to backend every 5 seconds or 10 meters
- ✅ **Driver Authentication** - Login with email/password, JWT token-based auth
- ✅ **Trip Controls** - Start/Stop trip with one tap
- ✅ **GPS Accuracy Monitoring** - Shows live accuracy and warns if signal is poor
- ✅ **Foreground Service** - Persistent notification on Android keeps tracking active
- ✅ **Battery Optimized** - Smart GPS sampling with OS-level optimizations

---

## 📱 Prerequisites

Before running the app, install:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo CLI**:
   ```bash
   npm install -g expo-cli
   ```

4. **For Android Testing**:
   - Install [Android Studio](https://developer.android.com/studio)
   - Set up Android emulator OR
   - Install **Expo Go** app on your Android phone

5. **For iOS Testing** (Mac only):
   - Install [Xcode](https://developer.apple.com/xcode/)
   - Set up iOS simulator OR
   - Install **Expo Go** app on your iPhone

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd drivers-app
npm install
```

### 2. Update Backend URL

Edit `src/config/config.ts` and set your backend URL:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_LAPTOP_IP:8000', // Replace with your laptop IP
  // ...
};
```

**To find your laptop IP:**

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" (e.g., 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under en0 or wlan0
```

### 3. Start Development Server

```bash
npm start
```

This opens Expo DevTools in your browser.

### 4. Run on Device/Simulator

**Option A: Physical Device (Recommended for GPS testing)**

1. Install **Expo Go** app from Play Store (Android) or App Store (iOS)
2. Scan the QR code from Expo DevTools
3. App will load on your phone

**Option B: Android Emulator**

```bash
npm run android
```

**Option C: iOS Simulator (Mac only)**

```bash
npm run ios
```

---

## 🧪 Testing Background GPS Tracking

### Android Testing

1. **Build development app** (required for background location):
   ```bash
   npx expo run:android
   ```
   > Note: Expo Go doesn't support background location. You must build a development app.

2. **Grant all location permissions**:
   - When prompted, allow "All the time" location access
   - Go to Settings → Apps → BusNotify Drivers → Permissions → Location → "Allow all the time"

3. **Test background tracking**:
   - Login with test credentials
   - Click "Start Trip"
   - Lock phone or switch to another app
   - Check backend logs - you should see location updates every 5 seconds

4. **Verify foreground service**:
   - You should see a persistent notification: "BusNotify - Trip Active"
   - This keeps GPS active in background

### iOS Testing

1. **Build development app**:
   ```bash
   npx expo run:ios
   ```

2. **Grant location permissions**:
   - Allow "Always" when prompted
   - Settings → Privacy → Location Services → BusNotify Drivers → "Always"

3. **Test background tracking**:
   - Login and start trip
   - Lock phone
   - Location updates continue in background

---

## 🔑 Test Credentials

```
Email: driver@busnotify.com
Password: driver123

Bus Number: 2
Route: route-1762589112.350423
```

---

## 📂 Project Structure

```
drivers-app/
├── App.tsx                          # Main app entry with navigation
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── src/
│   ├── config/
│   │   └── config.ts               # API URLs and constants
│   ├── types/
│   │   └── types.ts                # TypeScript interfaces
│   ├── services/
│   │   ├── api.ts                  # Backend API calls
│   │   └── locationService.ts      # Background GPS tracking
│   └── screens/
│       ├── LoginScreen.tsx         # Driver login
│       └── DashboardScreen.tsx     # Trip controls & GPS status
```

---

## 🔧 Key Technologies

- **Expo 51** - React Native framework
- **expo-location** - GPS tracking with background support
- **expo-task-manager** - Background task execution
- **@react-navigation/native** - Screen navigation
- **@react-native-async-storage/async-storage** - Local storage for auth tokens
- **TypeScript** - Type safety

---

## 🌐 Backend API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/driver/login` | POST | Authenticate driver, get JWT token |
| `/api/driver/start-trip` | POST | Mark trip as active in database |
| `/api/driver/update-location` | POST | Send GPS coordinates (called every 5s in background) |
| `/api/driver/end-trip` | POST | Mark trip as ended |

---

## 📊 How Background Tracking Works

1. **User clicks "Start Trip"**
   - App requests location permissions (foreground + background)
   - Registers a background task with `expo-task-manager`
   - Starts `expo-location` updates with `startLocationUpdatesAsync()`

2. **Background Task Execution**
   - Task runs every 5 seconds or when device moves 10 meters
   - Retrieves auth token and driver info from AsyncStorage
   - Sends GPS coordinates to backend via `POST /api/driver/update-location`

3. **Foreground Service (Android)**
   - Shows persistent notification: "BusNotify - Trip Active"
   - Prevents Android from killing the app
   - Keeps GPS active even when app is backgrounded

4. **User clicks "End Trip"**
   - Stops background location updates
   - Removes foreground service notification
   - Calls backend to mark trip as ended

---

## 🏗️ Building for Production

### Android APK

1. **Configure EAS Build**:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```

3. **Build for Play Store**:
   ```bash
   eas build --platform android --profile production
   ```

### iOS App

1. **Configure Apple Developer Account** in `eas.json`

2. **Build IPA**:
   ```bash
   eas build --platform ios --profile production
   ```

---

## 🔒 Permissions Required

### Android
- `ACCESS_FINE_LOCATION` - Precise GPS location
- `ACCESS_COARSE_LOCATION` - Approximate location
- `ACCESS_BACKGROUND_LOCATION` - Location when app is closed
- `FOREGROUND_SERVICE` - Run persistent service
- `FOREGROUND_SERVICE_LOCATION` - GPS in foreground service

### iOS
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Background location
- `NSLocationWhenInUseUsageDescription` - Foreground location
- `NSLocationAlwaysUsageDescription` - Always location
- `UIBackgroundModes: ["location"]` - Background execution

All permissions are configured in `app.json`.

---

## 🐛 Troubleshooting

### Background tracking not working

**Problem**: Location updates stop when app is closed

**Solutions**:
- ✅ Build development app (`npx expo run:android`), don't use Expo Go
- ✅ Grant "Allow all the time" location permission
- ✅ Disable battery optimization for the app
- ✅ Check backend logs to verify updates are being received

### Poor GPS accuracy (>100m)

**Problem**: Location is inaccurate or wrong city

**Solutions**:
- ✅ Go outside (GPS needs clear sky view)
- ✅ Wait 30 seconds for GPS to lock on satellites
- ✅ Enable "High Accuracy" mode in phone settings
- ✅ Don't test on laptops (they don't have real GPS)

### "Cannot connect to backend" error

**Problem**: API calls fail

**Solutions**:
- ✅ Make sure backend is running (`uvicorn main:app --reload --host 0.0.0.0`)
- ✅ Phone and laptop are on same WiFi network
- ✅ Update `API_CONFIG.BASE_URL` with correct laptop IP
- ✅ Check firewall isn't blocking port 8000

---

## 📈 CI/CD with GitHub Actions

See `.github/workflows/drivers-app.yml` for automated builds on push.

The workflow:
1. Installs dependencies
2. Runs TypeScript checks
3. Builds Android APK using EAS
4. Uploads APK as artifact

---

## 📝 Development Notes

### Why Expo?

- ✅ Fast development with hot reload
- ✅ One codebase for Android + iOS
- ✅ Easy background location setup
- ✅ No need for Android Studio/Xcode for development
- ✅ OTA updates for quick fixes

### Why Not Web App?

Web apps have limitations:
- ❌ No reliable background GPS tracking
- ❌ Browser tabs get killed by OS
- ❌ Worse battery efficiency
- ❌ Can't show persistent notification

Native apps are better for GPS tracking!

---

## 🤝 Contributing

1. Make sure backend is running
2. Test on real device (not emulator) for GPS
3. Always test background tracking after changes
4. Update this README if adding new features

---

## 📄 License

MIT License - feel free to use for your college project!

---

## 🆘 Support

**Issues?**
- Check backend is running: `http://YOUR_IP:8000/docs`
- Verify driver login works in backend
- Test GPS permission is granted
- Check phone is on same network as laptop

**Still stuck?**
- Read Expo docs: https://docs.expo.dev/
- Check expo-location docs: https://docs.expo.dev/versions/latest/sdk/location/
- Ask on Expo Forums: https://forums.expo.dev/

---

**Built with ❤️ for BusNotify**
