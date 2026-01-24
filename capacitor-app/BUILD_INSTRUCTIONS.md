# Nearby Traveler iOS App - Build Instructions

This Capacitor project wraps your Nearby Traveler website (nearbytraveler.org) in a native iOS app with push notifications and geolocation support.

## Prerequisites

1. **Mac computer** with macOS Monterey or later
2. **Xcode 15+** (free from Mac App Store)
3. **Node.js 18+** installed
4. **Apple ID** (free) - for testing on your device

## Quick Start (5 Steps)

### Step 1: Download this folder to your Mac
Download the entire `capacitor-app` folder to your Mac.

### Step 2: Install dependencies
Open Terminal, navigate to the folder, and run:
```bash
cd capacitor-app
npm install
```

### Step 3: Add iOS platform
```bash
npx cap add ios
```

### Step 4: Open in Xcode
```bash
npx cap open ios
```

### Step 5: Build and Run
In Xcode:
1. Select your iPhone or Simulator from the device dropdown
2. Click the Play button (▶️) to build and run
3. For your physical iPhone: Connect via USB, trust your Mac on the phone

## Testing on Your iPhone (Free)

1. In Xcode, go to **Signing & Capabilities**
2. Select your **Personal Team** (your Apple ID)
3. Connect your iPhone via USB
4. Click Run - Xcode will install the app on your phone
5. On iPhone: Settings → General → Device Management → Trust your developer profile

Note: Free provisioning lasts 7 days. Just rebuild to refresh.

## Push Notifications Setup

### For Testing (Development):
1. In Xcode, select your project in the navigator
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability** → Add **Push Notifications**
4. Add **Background Modes** → Check **Remote notifications**

### For Production (requires $99 Apple Developer account):
1. Create an Apple Push Notification key in Apple Developer portal
2. Configure your server to send notifications via APNs

## Geolocation / Background Pings

Already configured! The app will request location permission on first use.

For background location:
1. In Xcode, add **Background Modes** capability
2. Check **Location updates**
3. Add these to Info.plist (Xcode can do this):
   - NSLocationWhenInUseUsageDescription
   - NSLocationAlwaysUsageDescription

## App Icons & Splash Screen

Replace these files in the `ios/App/App/Assets.xcassets/` folder:
- AppIcon.appiconset (various sizes)
- Splash.imageset (launch screen)

Use a tool like https://appicon.co to generate all sizes from one image.

## App Store Submission (requires $99/year Apple Developer account)

1. Create app in App Store Connect
2. In Xcode: Product → Archive
3. Upload to App Store Connect
4. Submit for review

## Troubleshooting

**"Untrusted Developer" on iPhone:**
Go to Settings → General → Device Management → Trust

**Build fails:**
- Make sure Xcode is updated
- Run `npx cap sync` after any config changes

**App shows blank screen:**
- Check internet connection
- Verify https://nearbytraveler.org is accessible

## Files Explained

- `capacitor.config.ts` - Main configuration, points to your live website
- `package.json` - Dependencies including push notification plugins
- `www/index.html` - Fallback loading screen (rarely seen)

## Need Help?

The Capacitor documentation is excellent: https://capacitorjs.com/docs/ios
