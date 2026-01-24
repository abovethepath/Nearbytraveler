# Test Your Nearby Traveler App - No Mac Required!

## What You Need
1. Your iPhone with **Expo Go** app installed (free from App Store)
2. A computer (Windows, Mac, or Linux) - OR just your phone!

---

## EASIEST METHOD: Use Snack (Browser-based, no install)

1. Go to https://snack.expo.dev
2. Click "New Snack"
3. Copy the code from `App.js` into the editor
4. Add `react-native-webview` in the dependencies panel
5. Scan the QR code with your iPhone camera
6. Your wrapped app opens in Expo Go!

---

## METHOD 2: Run from Your Computer

### Step 1: Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2: Install Expo CLI
Open terminal/command prompt:
```bash
npm install -g expo-cli
```

### Step 3: Download this folder
Download the entire `expo-app` folder to your computer

### Step 4: Install dependencies
```bash
cd expo-app
npm install
```

### Step 5: Start the app
```bash
npx expo start
```

### Step 6: Open on your iPhone
1. A QR code appears in terminal
2. Open your iPhone camera
3. Point at QR code → tap the notification
4. Expo Go opens with your app!

---

## When Ready for App Store (No Mac Needed!)

Use EAS Build - Expo's cloud build service:

### Step 1: Create Expo account
https://expo.dev/signup (free)

### Step 2: Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Step 3: Build iOS app in the cloud
```bash
eas build --platform ios
```

This builds your iOS app on Expo's servers. You get back an IPA file.

### Step 4: Submit to App Store
Requires $99/year Apple Developer account:
```bash
eas submit --platform ios
```

---

## App Features Included

- ✅ Wraps nearbytraveler.org
- ✅ Orange splash screen with your branding
- ✅ Swipe back navigation on iOS
- ✅ Android back button support
- ✅ Geolocation enabled
- ✅ Push notification support (configure in app.json)

---

## Customization

### Change splash screen color
Edit `app.json` → `splash` → `backgroundColor`

### Add your app icon
Replace `assets/icon.png` with your 1024x1024 icon

### Change app name
Edit `app.json` → `name`

---

## Need Help?
- Expo docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
