# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tablet-ipad.spec.ts >> Tablet — Core Flows >> explore/community page loads, scrolls, and is readable
- Location: e2e\tablet-ipad.spec.ts:39:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - generic [ref=e3]:
    - button "Get Started" [ref=e5] [cursor=pointer]
    - generic [ref=e6]:
      - button "JOIN FOR FREE — IT'S LIVE!" [ref=e9] [cursor=pointer]
      - navigation [ref=e12]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - img "Nearby Traveler" [ref=e16] [cursor=pointer]
            - generic [ref=e17]: Beta
          - generic [ref=e19]:
            - link "Home" [ref=e20]:
              - /url: /
            - link "Locals" [ref=e21]:
              - /url: /locals-landing
            - link "Travelers" [ref=e22]:
              - /url: /travelers-landing
            - link "Events" [ref=e23]:
              - /url: /events-landing
            - link "Business" [ref=e24]:
              - /url: /business-landing
            - link "Connector" [ref=e25]:
              - /url: /connector
          - generic [ref=e26]:
            - button "Toggle theme" [ref=e27] [cursor=pointer]:
              - img
              - generic [ref=e28]: Toggle theme
            - button "Sign In" [ref=e29] [cursor=pointer]
            - button "Sign Up" [ref=e30] [cursor=pointer]
    - generic [ref=e32]:
      - paragraph [ref=e35]: Now Live — Join for Free and Start Connecting
      - generic [ref=e36]:
        - generic: Your browser does not support the video tag.
        - generic: Your browser does not support the video tag.
        - generic: Your browser does not support the video tag.
        - generic: Your browser does not support the video tag.
        - generic: Your browser does not support the video tag.
        - generic [ref=e39]:
          - paragraph [ref=e40]:
            - text: Travel doesn't change you.
            - text: The people you meet do.
          - heading "Connect with Locals & Travelers Worldwide" [level=1] [ref=e41]
          - paragraph [ref=e42]: Nearby Traveler connects travelers and locals through shared interests, activities, and events. We also let you know when you cross paths with friends in another city — making it easy to meet people, reconnect, and build friendships that last a lifetime.
          - generic [ref=e43]:
            - button "Join for Free" [ref=e44] [cursor=pointer]
            - button "Sign In" [ref=e45] [cursor=pointer]
          - button "See How It Works" [ref=e47] [cursor=pointer]
          - paragraph [ref=e48]: Where Local Experiences Meet Worldwide Connections
      - generic [ref=e50]:
        - generic [ref=e51]:
          - img [ref=e52]
          - img [ref=e54]
          - img [ref=e56]
        - button "I get it, connect travelers with locals and locals with travelers — take me to sign up" [ref=e60] [cursor=pointer]
      - generic [ref=e62]:
        - heading "Why Nearby Traveler" [level=2] [ref=e63]
        - paragraph [ref=e64]: Whether you're traveling or at home, Nearby Traveler helps you create real connections that last.
        - generic [ref=e65]:
          - generic [ref=e66]:
            - heading "Reconnect When Paths Cross Again" [level=3] [ref=e67]
            - paragraph [ref=e68]: Know when a friend you met in one city shows up in your next destination—the only app that notifies you when travel friends are nearby.
          - generic [ref=e69]:
            - heading "Share Meals with Travelers & Locals" [level=3] [ref=e70]
            - paragraph [ref=e71]: Connect with people before your trip starts and turn dinners into friendships.
          - generic [ref=e72]:
            - heading "Explore Authentic Spots Beyond Guidebooks" [level=3] [ref=e73]
            - paragraph [ref=e74]: Discover hidden gems shared by locals, not tourist traps.
          - generic [ref=e75]:
            - heading "Build Your Local Community" [level=3] [ref=e76]
            - paragraph [ref=e77]: Organize events, welcome travelers, and build community without leaving home.
          - generic [ref=e78]:
            - heading "Vouched Connections & Verified Profiles" [level=3] [ref=e79]
            - paragraph [ref=e80]: Every member can be vouched for by others they've met, with optional verification for added trust.
          - generic [ref=e81]:
            - heading "Build a Global Network of Friends" [level=3] [ref=e82]
            - paragraph [ref=e83]: Create a worldwide circle of connections who share your interests and values.
      - generic [ref=e85]:
        - heading "Reconnect Across Cities" [level=2] [ref=e86]
        - generic [ref=e87]:
          - paragraph [ref=e90]: Remember that person you met in Barcelona? They just landed in your city.
          - paragraph [ref=e93]: The traveler you hosted last year? They're in Tokyo—where you're heading next week.
        - paragraph [ref=e95]: Nearby Traveler notifies you when friends from past travels are nearby. Turn one-time encounters into lifelong connections that span the globe.
        - generic [ref=e96]:
          - paragraph [ref=e97]: One coffee in Paris becomes dinner in New York. A hiking buddy in Bali reconnects with you in Berlin.
          - paragraph [ref=e98]: Your travel friendships don't end when the trip does. Keep those connections alive, no matter where life takes you next.
      - generic [ref=e100]:
        - heading "When Travelers Meet Locals, Magic Happens" [level=2] [ref=e101]
        - generic [ref=e102]:
          - generic [ref=e105]: Expand your social life
          - generic [ref=e108]: Discover day trip adventures
          - generic [ref=e111]: Practice language exchange
          - generic [ref=e114]: Find meaningful relationships
          - generic [ref=e117]: Experience local culture
          - generic [ref=e120]: Meet local families
        - paragraph [ref=e121]: This isn't just travel. This is connection.
      - generic [ref=e123]:
        - heading "How It Works" [level=2] [ref=e124]
        - generic [ref=e125]:
          - generic [ref=e126]:
            - generic [ref=e127]: "1"
            - heading "Set Up Your Profile & Travel Plans" [level=3] [ref=e128]
            - paragraph [ref=e129]: Sign up as a local or traveler. Add your interests and activities. Planning a trip? Set your destination and dates—our AI matches you with locals and travelers there.
          - generic [ref=e130]:
            - generic [ref=e131]: "2"
            - heading "Discover, Message & Meet Up" [level=3] [ref=e132]
            - paragraph [ref=e133]: Browse AI-matched people in your city or destination. Message them directly. Go Available Now. Join community events. RSVP to local gatherings.
          - generic [ref=e134]:
            - generic [ref=e135]: "3"
            - heading "Stay Connected Worldwide" [level=3] [ref=e136]
            - paragraph [ref=e137]: Get notified when past connections travel to your city—or when you're heading to theirs. Your friendships reconnect automatically, no matter where you go.
      - generic [ref=e139]:
        - heading "See Our Community in Action" [level=2] [ref=e140]
        - paragraph [ref=e141]: Every week, Nearby Traveler sponsors authentic local experiences hosted by passionate community members. From cultural tours to food adventures, these events bring our community together and showcase the real heart of each city.
        - generic [ref=e142]:
          - generic [ref=e143]:
            - generic [ref=e144]:
              - heading "Beach Bonfire & BBQ" [level=3] [ref=e145]
              - generic [ref=e146]: Free
            - paragraph [ref=e147]: Sunset gathering with locals — authentic LA beach culture, music, and new friends.
          - generic [ref=e148]:
            - generic [ref=e149]:
              - heading "Taco Tuesday" [level=3] [ref=e150]
              - generic [ref=e151]: $1.50
            - paragraph [ref=e152]: Weekly street taco adventure with fellow food lovers at the city's best Mexican spots.
          - generic [ref=e153]:
            - generic [ref=e154]:
              - heading "Hollywood Sign Hike" [level=3] [ref=e155]
              - generic [ref=e156]: Free
            - paragraph [ref=e157]: Saturday morning hikes with locals and travelers — amazing views, great photos, real LA.
      - generic [ref=e159]:
        - heading "From the Founder" [level=2] [ref=e160]
        - generic [ref=e161]:
          - paragraph [ref=e162]: "\"After hosting 400+ travelers from 50 countries, I learned that one connection can change everything… I built the solution I wished existed.\""
          - paragraph [ref=e163]: — Aaron Lefkowitz, Founder
          - paragraph [ref=e164]: Nearby Traveler grew out of real travel communities—from Couchsurfing bonfires to LA meetups. Our mission is to keep that spirit alive for a new generation.
      - paragraph [ref=e167]: 400+ travelers hosted by our founder | 5 community connectors in Los Angeles | Inspired by global travel communities like Couchsurfing & Meetup
      - generic [ref=e169]:
        - heading "Everyone's Welcome" [level=2] [ref=e170]
        - generic [ref=e171]:
          - generic [ref=e172]:
            - heading "Solo Travelers" [level=3] [ref=e173]
            - paragraph [ref=e174]: Turn exploring alone into shared adventures
          - generic [ref=e175]:
            - heading "Locals" [level=3] [ref=e176]
            - paragraph [ref=e177]: Share your city and meet the world
          - generic [ref=e178]:
            - heading "New in Town" [level=3] [ref=e179]
            - paragraph [ref=e180]: Find your tribe fast
          - generic [ref=e181]:
            - heading "Families" [level=3] [ref=e182]
            - paragraph [ref=e183]: Connect with local families and fellow travelers
          - generic [ref=e184]:
            - heading "Business Travelers" [level=3] [ref=e185]
            - paragraph [ref=e186]: Make work trips more than meetings
        - paragraph [ref=e187]: Be part of a new way to travel where weekly events and instant connections mean you're never really traveling alone.
      - generic [ref=e189]:
        - paragraph [ref=e190]: Be part of a new way to travel where weekly events and instant connections mean you're never really traveling alone.
        - button "Start Connecting Now" [ref=e191] [cursor=pointer]
      - generic [ref=e193]:
        - paragraph [ref=e194]: Launching soon in Los Angeles and worldwide
        - generic [ref=e195]:
          - generic [ref=e196]: Verified profiles
          - generic [ref=e198]: Community references
          - generic [ref=e200]: Vouched connections
    - contentinfo [ref=e202]:
      - generic [ref=e203]:
        - generic [ref=e204]:
          - img "Nearby Traveler" [ref=e207] [cursor=pointer]
          - generic [ref=e208]:
            - generic [ref=e209]:
              - heading "Platform" [level=3] [ref=e210]
              - list [ref=e211]:
                - listitem [ref=e212]:
                  - link "Home" [ref=e213]:
                    - /url: /
                - listitem [ref=e214]:
                  - link "Events" [ref=e215]:
                    - /url: /events
                - listitem [ref=e216]:
                  - link "Connect" [ref=e217]:
                    - /url: /matches
                - listitem [ref=e218]:
                  - link "Discover" [ref=e219]:
                    - /url: /discover
            - generic [ref=e220]:
              - heading "Company" [level=3] [ref=e221]
              - list [ref=e222]:
                - listitem [ref=e223]:
                  - link "About Us" [ref=e224]:
                    - /url: /about
                - listitem [ref=e225]:
                  - link "Connector Program" [ref=e226]:
                    - /url: /connector-program
                - listitem [ref=e227]:
                  - link "Support Us 💛" [ref=e228]:
                    - /url: /donate
                - listitem [ref=e229]:
                  - link "Community Guidelines" [ref=e230]:
                    - /url: /community-guidelines
                - listitem [ref=e231]:
                  - link "Privacy Policy" [ref=e232]:
                    - /url: /privacy
                - listitem [ref=e233]:
                  - link "Terms of Service" [ref=e234]:
                    - /url: /terms
                - listitem [ref=e235]:
                  - link "Cookie Policy" [ref=e236]:
                    - /url: /cookies
            - generic [ref=e237]:
              - heading "Contact" [level=3] [ref=e238]
              - generic [ref=e239]:
                - paragraph [ref=e241]: aaron@nearbytraveler.org
                - generic [ref=e242]:
                  - paragraph [ref=e243]: 30 Gould Street, STE R
                  - paragraph [ref=e244]: Sheridan, WY 82801
        - paragraph [ref=e246]: Where Local Experiences Meet Worldwide Connections
        - generic [ref=e247]:
          - paragraph [ref=e248]: © 2025 Nearby Traveler, Inc. All rights reserved.
          - generic [ref=e250]: Made with ❤️ for travelers
  - button "Open help chat" [ref=e251] [cursor=pointer]:
    - img [ref=e252]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // These tests run on ipad and ipad-pro projects defined in playwright.config.ts
  4   | // Run with: npx playwright test e2e/tablet-ipad.spec.ts --project=ipad --project=ipad-pro
  5   | 
  6   | test.describe('Tablet — Core Flows', () => {
  7   |   test('homepage loads and nav is correct for tablet', async ({ page }) => {
  8   |     await page.goto('/');
  9   |     await expect(page).toHaveTitle(/Nearby Traveler/i);
  10  |     await expect(page.locator('body')).toBeVisible();
  11  |     await page.screenshot({ path: `test-results/tablet-homepage-${page.viewportSize()!.width}.png`, fullPage: true });
  12  |     // Should have navigation visible (desktop or mobile)
  13  |     const nav = page.locator('nav, [role="navigation"], header').first();
  14  |     await expect(nav).toBeVisible();
  15  |   });
  16  | 
  17  |   test('no horizontal overflow on homepage', async ({ page }) => {
  18  |     await page.goto('/');
  19  |     await page.waitForLoadState('networkidle');
  20  |     const overflow = await page.evaluate(() =>
  21  |       document.documentElement.scrollWidth > document.documentElement.clientWidth
  22  |     );
  23  |     expect(overflow).toBe(false);
  24  |   });
  25  | 
  26  |   test('available now page loads with correct layout', async ({ page }) => {
  27  |     await page.goto('/available-now');
  28  |     await expect(page.locator('body')).toBeVisible();
  29  |     const content = await page.textContent('body');
  30  |     expect(content!.length).toBeGreaterThan(10);
  31  |     await page.screenshot({ path: `test-results/tablet-available-now-${page.viewportSize()!.width}.png`, fullPage: true });
  32  |     // No horizontal overflow
  33  |     const overflow = await page.evaluate(() =>
  34  |       document.documentElement.scrollWidth > document.documentElement.clientWidth
  35  |     );
  36  |     expect(overflow).toBe(false);
  37  |   });
  38  | 
  39  |   test('explore/community page loads, scrolls, and is readable', async ({ page }) => {
  40  |     await page.goto('/explore');
  41  |     await expect(page.locator('body')).toBeVisible();
  42  |     await page.screenshot({ path: `test-results/tablet-explore-${page.viewportSize()!.width}.png`, fullPage: true });
  43  |     // Scroll works
  44  |     await page.evaluate(() => window.scrollTo(0, 600));
  45  |     const scrollY = await page.evaluate(() => window.scrollY);
> 46  |     expect(scrollY).toBeGreaterThan(0);
      |                     ^ Error: expect(received).toBeGreaterThan(expected)
  47  |     // No horizontal scroll
  48  |     const scrollX = await page.evaluate(() => window.scrollX);
  49  |     expect(scrollX).toBe(0);
  50  |   });
  51  | 
  52  |   test('signup join page accessible on tablet', async ({ page }) => {
  53  |     await page.goto('/join');
  54  |     await expect(page.locator('body')).toBeVisible();
  55  |     await page.screenshot({ path: `test-results/tablet-join-${page.viewportSize()!.width}.png`, fullPage: true });
  56  |     await expect(page.getByText(/local|traveler/i).first()).toBeVisible();
  57  |   });
  58  | 
  59  |   test('signup account page fields fit tablet width', async ({ page }) => {
  60  |     await page.goto('/signup/account');
  61  |     await page.waitForLoadState('networkidle');
  62  |     await page.screenshot({ path: `test-results/tablet-signup-account-${page.viewportSize()!.width}.png`, fullPage: true });
  63  |     const vpWidth = page.viewportSize()!.width;
  64  |     // Check no element overflows viewport
  65  |     const overflow = await page.evaluate(() =>
  66  |       document.documentElement.scrollWidth > document.documentElement.clientWidth
  67  |     );
  68  |     expect(overflow).toBe(false);
  69  |   });
  70  | 
  71  |   test('messages page fits tablet width', async ({ page }) => {
  72  |     const response = await page.goto('/messages');
  73  |     expect(response!.status()).toBeLessThan(500);
  74  |     await expect(page.locator('body')).toBeVisible();
  75  |     await page.screenshot({ path: `test-results/tablet-messages-${page.viewportSize()!.width}.png`, fullPage: true });
  76  |     const overflow = await page.evaluate(() =>
  77  |       document.documentElement.scrollWidth > document.documentElement.clientWidth
  78  |     );
  79  |     expect(overflow).toBe(false);
  80  |   });
  81  | 
  82  |   test('events landing page on tablet', async ({ page }) => {
  83  |     await page.goto('/events-landing');
  84  |     await expect(page.locator('body')).toBeVisible();
  85  |     await page.screenshot({ path: `test-results/tablet-events-${page.viewportSize()!.width}.png`, fullPage: true });
  86  |     const content = await page.textContent('body');
  87  |     expect(content).toMatch(/event/i);
  88  |   });
  89  | 
  90  |   test('blog page on tablet', async ({ page }) => {
  91  |     await page.goto('/blog');
  92  |     await expect(page.locator('body')).toBeVisible();
  93  |     await page.screenshot({ path: `test-results/tablet-blog-${page.viewportSize()!.width}.png`, fullPage: true });
  94  |   });
  95  | });
  96  | 
  97  | test.describe('Tablet — Touch & Accessibility', () => {
  98  |   test('touch targets at least 44px on homepage', async ({ page }) => {
  99  |     await page.goto('/');
  100 |     await page.waitForLoadState('networkidle');
  101 |     const tooSmall = await page.evaluate(() => {
  102 |       const problems: string[] = [];
  103 |       document.querySelectorAll('button, a, [role="button"], input, select, textarea').forEach((el) => {
  104 |         const rect = el.getBoundingClientRect();
  105 |         if (rect.width > 0 && rect.height > 0 && rect.height < 44 && rect.width < 44) {
  106 |           const text = (el.textContent || '').trim().slice(0, 30);
  107 |           problems.push(`${el.tagName.toLowerCase()}("${text}") ${Math.round(rect.width)}x${Math.round(rect.height)}`);
  108 |         }
  109 |       });
  110 |       return problems.slice(0, 15);
  111 |     });
  112 |     if (tooSmall.length > 0) {
  113 |       console.log(`Small touch targets on /: ${tooSmall.join(' | ')}`);
  114 |     }
  115 |     expect(tooSmall.length).toBeLessThan(20);
  116 |   });
  117 | 
  118 |   test('touch targets at least 44px on join page', async ({ page }) => {
  119 |     await page.goto('/join');
  120 |     await page.waitForLoadState('networkidle');
  121 |     const tooSmall = await page.evaluate(() => {
  122 |       const problems: string[] = [];
  123 |       document.querySelectorAll('button, a, [role="button"], input, select, textarea').forEach((el) => {
  124 |         const rect = el.getBoundingClientRect();
  125 |         if (rect.width > 0 && rect.height > 0 && rect.height < 44 && rect.width < 44) {
  126 |           const text = (el.textContent || '').trim().slice(0, 30);
  127 |           problems.push(`${el.tagName.toLowerCase()}("${text}") ${Math.round(rect.width)}x${Math.round(rect.height)}`);
  128 |         }
  129 |       });
  130 |       return problems.slice(0, 15);
  131 |     });
  132 |     if (tooSmall.length > 0) {
  133 |       console.log(`Small touch targets on /join: ${tooSmall.join(' | ')}`);
  134 |     }
  135 |     expect(tooSmall.length).toBeLessThan(20);
  136 |   });
  137 | 
  138 |   test('font sizes readable at tablet distance (min 14px)', async ({ page }) => {
  139 |     await page.goto('/');
  140 |     await page.waitForLoadState('networkidle');
  141 |     const smallFonts = await page.evaluate(() => {
  142 |       const problems: string[] = [];
  143 |       document.querySelectorAll('p, span, a, li, td, label, h1, h2, h3, h4, h5, h6').forEach((el) => {
  144 |         const style = window.getComputedStyle(el);
  145 |         const fontSize = parseFloat(style.fontSize);
  146 |         const rect = el.getBoundingClientRect();
```