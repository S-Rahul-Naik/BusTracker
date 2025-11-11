# 🚀 BusNotify Drivers App - Deployment Guide

## 📱 Deployment Options

You have **3 ways** to deploy the drivers app:

1. **Local APK Build** (Quick, for testing) ⚡
2. **EAS Build** (Professional, production-ready) 🏆
3. **GitHub Actions** (Automated CI/CD) 🤖

---

## ⚡ Option 1: Local APK Build (Fastest)

**Best for:** Quick testing, sharing with 1-2 drivers

### **Prerequisites:**
- Android phone connected via USB
- USB debugging enabled on phone

### **Steps:**

```powershell
# 1. Navigate to drivers-app
cd C:\Users\Lenovo\Desktop\Busnotify\drivers-app

# 2. Install dependencies (if not already done)
npm install

# 3. Build development APK
npx expo run:android
```

**What happens:**
- Builds APK on your computer
- Installs directly on connected phone
- Takes ~5-10 minutes

**To share with other drivers:**
```powershell
# Find the APK file in:
drivers-app\android\app\build\outputs\apk\debug\app-debug.apk

# Share this file via WhatsApp/Email
# Drivers install by:
# 1. Download APK on phone
# 2. Allow "Install from Unknown Sources"
# 3. Tap APK to install
```

---

## 🏆 Option 2: EAS Build (Recommended for Production)

**Best for:** Production deployment, Play Store, multiple drivers

### **Prerequisites:**
- Expo account (free)
- EAS CLI installed

### **Setup (One-time):**

```powershell
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure the project
cd C:\Users\Lenovo\Desktop\Busnotify\drivers-app
eas build:configure
```

### **Build APK:**

```powershell
# For testing (preview build)
eas build --platform android --profile preview

# For production (Play Store ready)
eas build --platform android --profile production
```

**What happens:**
- Builds on Expo's cloud servers (free tier: unlimited builds)
- Takes ~15-20 minutes
- Gives you download link for APK
- APK is optimized and production-ready

**Download & Share:**
1. When build completes, you get a URL
2. Download APK from that URL
3. Share with drivers
4. Or upload to Google Play Store

### **Build for iOS:**

```powershell
# Build IPA for iOS
eas build --platform ios --profile production

# Note: Requires Apple Developer account ($99/year)
```

---

## 🤖 Option 3: GitHub Actions (Automated)

**Best for:** Continuous deployment, team collaboration

### **Setup (One-time):**

#### **Step 1: Create Expo Account**
1. Go to https://expo.dev
2. Sign up for free account
3. Note your username

#### **Step 2: Generate Expo Token**
```powershell
# Login to Expo
eas login

# Generate token
eas token:create

# Copy the token (looks like: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
```

#### **Step 3: Add Token to GitHub**
1. Go to https://github.com/S-Rahul-Naik/BusTracker
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste the token from Step 2
6. Click **Add secret**

### **Deploy:**

```powershell
# 1. Commit your changes
cd C:\Users\Lenovo\Desktop\Busnotify
git add drivers-app/
git commit -m "Update drivers app"

# 2. Push to GitHub
git push origin main

# 3. GitHub Actions automatically builds!
```

**Check build status:**
1. Go to https://github.com/S-Rahul-Naik/BusTracker/actions
2. Click on latest workflow run
3. Wait ~20-30 minutes for build
4. Download APK from **Artifacts** section

---

## 📦 Quick Start: Build Your First APK Now!

### **Fastest Method (5 minutes):**

```powershell
# 1. Go to drivers-app
cd C:\Users\Lenovo\Desktop\Busnotify\drivers-app

# 2. Install EAS CLI (if not installed)
npm install -g eas-cli

# 3. Login to Expo
eas login
# Enter email/password or create account

# 4. Build preview APK
eas build --platform android --profile preview

# When prompted:
# - "Generate new Android Keystore?" → Yes
# - Wait 15-20 minutes
# - Download APK from provided URL
```

### **Alternative: Local Build (if you have phone connected):**

```powershell
cd C:\Users\Lenovo\Desktop\Busnotify\drivers-app
npx expo run:android

# Builds and installs on connected phone in ~10 minutes
```

---

## 🎯 Recommended Workflow

### **For Testing (1-2 drivers):**
```
Local Build → Share APK file
```

### **For Production (all drivers):**
```
EAS Build → Download APK → Share via WhatsApp/Drive
```

### **For Continuous Updates:**
```
GitHub Actions → Auto-build on every push → Download from GitHub
```

---

## 📲 Distributing APK to Drivers

### **Option A: Direct Share**
1. Build APK using any method above
2. Upload to Google Drive / Dropbox
3. Share link with drivers
4. Drivers download and install

### **Option B: Internal Testing (Google Play)**
1. Build production APK using EAS
2. Create Google Play Developer account ($25 one-time)
3. Upload APK to Play Console
4. Add driver emails to internal testers
5. Drivers install from Play Store (more professional)

### **Option C: WhatsApp/Email**
1. Build APK
2. Share .apk file directly via WhatsApp
3. Drivers enable "Unknown Sources"
4. Install APK

---

## 🔧 Update Backend URL for Production

### **For Local Testing (Current Setup):**
The app uses `http://localhost:8000` - works only when backend is on your laptop.

### **For Production (Deploy backend first):**

1. **Deploy backend to cloud** (e.g., Railway, Render, AWS)
2. **Update API URL in app:**

```powershell
# Edit src/config/config.ts
code drivers-app\src\config\config.ts
```

Change:
```typescript
// FROM:
export const BASE_URL = 'http://192.168.1.5:8000'; // Your laptop IP

// TO:
export const BASE_URL = 'https://your-backend.railway.app'; // Production URL
```

3. **Rebuild APK** with new URL

---

## 🎉 Complete Production Deployment Checklist

- [ ] **Backend Deployed**
  - Deploy backend to Railway/Render/AWS
  - Get production URL (e.g., https://busnotify-api.railway.app)
  - Test API endpoints

- [ ] **Update App Config**
  - Change BASE_URL to production URL
  - Update app version in app.json
  - Test login with production backend

- [ ] **Build Production APK**
  - Run `eas build --platform android --profile production`
  - Download APK
  - Test on real device

- [ ] **Create Driver Accounts**
  - Run `python backend/create_multiple_drivers.py`
  - Note login credentials

- [ ] **Distribute to Drivers**
  - Share APK via Drive/WhatsApp
  - Send login credentials
  - Provide installation instructions

- [ ] **Test Live Tracking**
  - Driver starts trip
  - Check website shows real-time location
  - Verify background tracking works

---

## 🚨 Common Issues & Solutions

### **Issue: "Unable to connect to backend"**
**Solution:**
- If testing locally: Make sure backend is running on `http://0.0.0.0:8000`
- Use your laptop's IP address (not localhost)
- Check firewall allows port 8000

### **Issue: "GPS not working in background"**
**Solution:**
- Grant "Allow all the time" location permission
- Disable battery optimization for the app
- Ensure trip is started (foreground service running)

### **Issue: "Build failed on EAS"**
**Solution:**
- Check you're logged in: `eas whoami`
- Ensure package.json has no errors
- Try: `npm install` then rebuild

### **Issue: "Can't install APK on phone"**
**Solution:**
- Enable "Install from Unknown Sources" in phone settings
- Check phone has enough storage
- Try uninstalling old version first

---

## 📞 Support

**Need help?**
- Check logs: `npx expo start --clear`
- EAS build logs: Visit build URL in browser
- Backend logs: Check Railway/Render dashboard

---

## 🎯 Quick Commands Reference

```powershell
# Local development
npx expo start                    # Start dev server
npx expo run:android             # Build & install on phone

# EAS builds
eas login                        # Login to Expo
eas build --platform android     # Build APK (cloud)
eas build --platform ios         # Build IPA (cloud)
eas build:list                   # List all builds

# GitHub Actions
git push origin main             # Trigger auto-build

# Project management
npm install                      # Install dependencies
npm run type-check              # Check TypeScript
```

---

## ✅ Recommended: Build Your First APK RIGHT NOW!

**Run this command:**

```powershell
cd C:\Users\Lenovo\Desktop\Busnotify\drivers-app
eas login
eas build --platform android --profile preview
```

**Result:** 
- Professional APK ready in 20 minutes
- Download link provided
- Share with all drivers immediately!

🚀 **Let's deploy!**
