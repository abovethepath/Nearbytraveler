# Nearby Traveler - iOS App Store Submission Guide

This guide walks you through building and submitting the Nearby Traveler iOS app to the Apple App Store.

## Prerequisites

- Apple Developer Account ($99/year) - ✅ You have this
- Mac computer (required for iOS development signing)
- Node.js 18+ installed
- Expo CLI and EAS CLI installed

## Step 1: Install Required Tools

On your Mac, open Terminal and run:

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI globally  
npm install -g eas-cli

# Login to your Expo account (create one at expo.dev if needed)
eas login
```

## Step 2: Navigate to the App Directory

```bash
cd expo-app

# Install dependencies
npm install
```

## Step 3: Configure EAS Project

```bash
# Initialize EAS for this project (run once)
eas build:configure

# This will create/update eas.json and link to your Expo account
```

When prompted:
- Select iOS and Android platforms
- This will generate a project ID automatically

## Step 4: Update Configuration Files

After running `eas build:configure`, update these files:

### Update app.json
Replace `your-eas-project-id` with the actual project ID from Expo:
- In `extra.eas.projectId`
- In `updates.url`

### Update eas.json  
Replace these placeholders with your Apple credentials:
- `YOUR_APPLE_ID@email.com` - Your Apple ID email
- `YOUR_APP_STORE_CONNECT_APP_ID` - From App Store Connect (created in Step 5)
- `YOUR_APPLE_TEAM_ID` - Found at developer.apple.com/account → Membership

## Step 5: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Nearby Traveler
   - Primary Language: English
   - Bundle ID: com.nearbytraveler.app
   - SKU: nearbytraveler-001
4. Save the app - note the Apple ID shown (this is your `ascAppId`)

## Step 6: Build for App Store

```bash
# Build production iOS app
npm run build:ios

# OR run directly:
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud (takes 15-30 minutes)
- Generate a signed .ipa file
- Handle all iOS code signing automatically

First time building? EAS will prompt you to:
- Create iOS credentials (select "Generate new")
- Let EAS manage your certificates (recommended)

## Step 7: Submit to App Store

After the build completes:

```bash
# Submit the latest build to App Store
npm run submit:ios

# OR run directly:
eas submit --platform ios --profile production
```

You'll be prompted for:
- Apple ID credentials
- App-specific password (create at appleid.apple.com → Security → App-Specific Passwords)

## Step 8: Complete App Store Listing

In App Store Connect, add:

### App Information
- **Name**: Nearby Traveler
- **Subtitle**: Connect with travelers & locals
- **Category**: Social Networking (primary), Travel (secondary)
- **Privacy Policy URL**: https://nearbytraveler.org/privacy
- **Support URL**: https://nearbytraveler.org/support

### Description
```
Nearby Traveler connects you with fellow travelers, locals, and authentic experiences wherever you go.

KEY FEATURES:

🌍 DISCOVER PEOPLE
Find travelers heading to your destination or locals who know the area best. Connect with people who share your interests and travel style.

⚡ QUICK MEETUPS  
Spontaneous plans? Create a quick meetup and get notified when others want to join. Perfect for grabbing coffee, exploring a neighborhood, or sharing a meal.

💬 CITY CHATROOMS
Join conversations with travelers and locals in any city. Ask questions, share tips, and make connections before you even arrive.

🎯 EVENTS & ACTIVITIES
Discover local events, concerts, tours, and activities happening around you. Never miss out on experiences.

✈️ MATCH IN CITY
Planning a trip? See who else will be in your destination at the same time. Perfect for finding travel buddies.

🤝 AMBASSADOR PROGRAM
Passionate about connecting travelers? Become an ambassador and help build the community.

Whether you're a solo traveler seeking company, a local wanting to meet visitors, or just looking for authentic experiences - Nearby Traveler brings people together.

Download now and start connecting!
```

### Keywords
```
travel, social, meetup, travelers, locals, connections, city, explore, community, friends, events, adventures, backpacking, solo travel
```

### Screenshots (Required)
You'll need screenshots for:
- 6.7" Display (iPhone 15 Pro Max): 1290 x 2796 px
- 6.5" Display (iPhone 14 Plus): 1284 x 2778 px  
- 5.5" Display (iPhone 8 Plus): 1242 x 2208 px
- 12.9" iPad Pro: 2048 x 2732 px (if supporting iPad)

Take screenshots of:
1. Home/Discover page
2. Quick Meetups
3. City Chatroom
4. User Profile
5. Events list
6. Match in City feature

### Age Rating
- Select "4+" (no objectionable content)
- Answer all rating questions accurately

## Step 9: Submit for Review

1. In App Store Connect, select your build
2. Click "Add for Review"
3. Answer review questions:
   - Sign-in required: Yes (provide test account credentials)
   - Encryption: No (uses HTTPS only, exempt)
4. Submit for Review

## Test Account for Apple Review

Create a test account for Apple reviewers:
- Email: appreview@nearbytraveler.org
- Password: [create a secure password]
- Make sure this account has some data (profile complete, connections, etc.)

## Review Timeline

- First submission: 1-3 days typically
- Updates: 24-48 hours typically
- If rejected: Address feedback and resubmit

## Common Rejection Reasons & Fixes

1. **Missing privacy policy** - Ensure https://nearbytraveler.org/privacy exists
2. **Test account doesn't work** - Verify login works before submitting
3. **Incomplete metadata** - Fill out all required fields
4. **Crash on launch** - Test thoroughly before submitting

## Updating the App

For updates:

1. Increment version in `app.json`:
   - `version`: "1.0.1"
   - `ios.buildNumber`: "2"

2. Rebuild and resubmit:
```bash
npm run build:ios
npm run submit:ios
```

## Need Help?

- Expo EAS Docs: https://docs.expo.dev/build/introduction/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect Help: https://developer.apple.com/help/app-store-connect/

Good luck with your submission! 🚀
