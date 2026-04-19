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
  - button "Open help chat" [ref=e52] [cursor=pointer]:
    - img [ref=e53]
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