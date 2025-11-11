# 🚀 Quick Start Guide - BusNotify Drivers App

This guide will help you run the drivers app on your Android phone in **under 5 minutes**.

---

## ⚡ Step 1: Install Dependencies (1 min)

Open terminal in the `drivers-app` folder:

```bash
cd drivers-app
npm install
```

---

## ⚡ Step 2: Update Backend URL (30 sec)

Find your laptop's IP address:

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (example: `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

Edit `src/config/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:8000', // ← Replace with YOUR IP
  // ...
};
```

---

## ⚡ Step 3: Start Backend (if not running)

In a separate terminal:

```bash
cd ../backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## ⚡ Step 4: Run on Your Phone (2 min)

### Option A: Using Expo Go (Quick Test - No Background GPS)

```bash
npm start
```

1. Install **Expo Go** from Play Store
2. Scan QR code
3. App loads instantly!

⚠️ **Note:** Background GPS won't work in Expo Go. Use Option B for real testing.

---

### Option B: Build Development App (Real Background GPS)

```bash
npx expo run:android
```

This builds and installs the app on your connected phone via USB.

**First time setup:**
1. Enable USB Debugging on phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"
2. Connect phone to laptop via USB
3. Allow USB debugging when prompted

**Build time:** ~2-3 minutes first time, instant after that.

---

## ⚡ Step 5: Test Background Tracking (1 min)

1. **Login:**
   - Email: `driver@busnotify.com`
   - Password: `driver123`

2. **Grant Permissions:**
   - Allow location → "All the time"
   - Allow notifications

3. **Start Trip:**
   - Click "Start Trip" button
   - Go outside (for better GPS)
   - Lock phone or switch apps

4. **Verify It's Working:**
   - Check notification: "BusNotify - Trip Active"
   - Open backend logs: Should see location updates every 5 seconds
   - Open student web app → Live Tracking: Should see bus moving in real-time!

---

## 🎉 You're Done!

The app is now tracking GPS in the background. Even if you close the app or lock your phone, location updates continue!

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

- ✅ Backend running? Check `http://YOUR_IP:8000/docs` on phone browser
- ✅ Phone and laptop on same WiFi?
- ✅ Correct IP in `config.ts`?
- ✅ Firewall blocking port 8000?

### "Background tracking not working"

- ✅ Did you build with `npx expo run:android`? (Expo Go doesn't support background)
- ✅ Permission set to "Allow all the time"?
- ✅ Battery optimization disabled for the app?

### "Poor GPS accuracy"

- ✅ Go outside (GPS needs clear sky)
- ✅ Wait 30 seconds for satellite lock
- ✅ Enable "High Accuracy" mode in phone settings

---

## 📱 Next Steps

**For Production:**

1. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

2. **Share APK:**
   - Download from Expo dashboard
   - Share with other drivers
   - They can install directly (no Play Store needed)

3. **Deploy to Play Store:**
   ```bash
   eas build --platform android --profile production
   eas submit --platform android
   ```

---

## 📚 Full Documentation

See `README.md` for complete details on:
- iOS setup
- Production builds
- CI/CD with GitHub Actions
- API documentation
- Architecture details

---

**Need help?** Check the main README or open an issue on GitHub!
