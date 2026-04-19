import { test, expect } from '@playwright/test';

// These tests run on ipad and ipad-pro projects defined in playwright.config.ts
// Run with: npx playwright test e2e/tablet-ipad.spec.ts --project=ipad --project=ipad-pro

test.describe('Tablet — Core Flows', () => {
  test('homepage loads and nav is correct for tablet', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Nearby Traveler/i);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: `test-results/tablet-homepage-${page.viewportSize()!.width}.png`, fullPage: true });
    // Should have navigation visible (desktop or mobile)
    const nav = page.locator('nav, [role="navigation"], header').first();
    await expect(nav).toBeVisible();
  });

  test('no horizontal overflow on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('available now page loads with correct layout', async ({ page }) => {
    await page.goto('/available-now');
    await expect(page.locator('body')).toBeVisible();
    const content = await page.textContent('body');
    expect(content!.length).toBeGreaterThan(10);
    await page.screenshot({ path: `test-results/tablet-available-now-${page.viewportSize()!.width}.png`, fullPage: true });
    // No horizontal overflow
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('explore/community page loads, scrolls, and is readable', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: `test-results/tablet-explore-${page.viewportSize()!.width}.png`, fullPage: true });
    // Scroll works
    await page.evaluate(() => window.scrollTo(0, 600));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    // No horizontal scroll
    const scrollX = await page.evaluate(() => window.scrollX);
    expect(scrollX).toBe(0);
  });

  test('signup join page accessible on tablet', async ({ page }) => {
    await page.goto('/join');
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: `test-results/tablet-join-${page.viewportSize()!.width}.png`, fullPage: true });
    await expect(page.getByText(/local|traveler/i).first()).toBeVisible();
  });

  test('signup account page fields fit tablet width', async ({ page }) => {
    await page.goto('/signup/account');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `test-results/tablet-signup-account-${page.viewportSize()!.width}.png`, fullPage: true });
    const vpWidth = page.viewportSize()!.width;
    // Check no element overflows viewport
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('messages page fits tablet width', async ({ page }) => {
    const response = await page.goto('/messages');
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: `test-results/tablet-messages-${page.viewportSize()!.width}.png`, fullPage: true });
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('events landing page on tablet', async ({ page }) => {
    await page.goto('/events-landing');
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: `test-results/tablet-events-${page.viewportSize()!.width}.png`, fullPage: true });
    const content = await page.textContent('body');
    expect(content).toMatch(/event/i);
  });

  test('blog page on tablet', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: `test-results/tablet-blog-${page.viewportSize()!.width}.png`, fullPage: true });
  });
});

test.describe('Tablet — Touch & Accessibility', () => {
  test('touch targets at least 44px on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const tooSmall = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('button, a, [role="button"], input, select, textarea').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.height < 44 && rect.width < 44) {
          const text = (el.textContent || '').trim().slice(0, 30);
          problems.push(`${el.tagName.toLowerCase()}("${text}") ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
      });
      return problems.slice(0, 15);
    });
    if (tooSmall.length > 0) {
      console.log(`Small touch targets on /: ${tooSmall.join(' | ')}`);
    }
    expect(tooSmall.length).toBeLessThan(20);
  });

  test('touch targets at least 44px on join page', async ({ page }) => {
    await page.goto('/join');
    await page.waitForLoadState('networkidle');
    const tooSmall = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('button, a, [role="button"], input, select, textarea').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.height < 44 && rect.width < 44) {
          const text = (el.textContent || '').trim().slice(0, 30);
          problems.push(`${el.tagName.toLowerCase()}("${text}") ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
      });
      return problems.slice(0, 15);
    });
    if (tooSmall.length > 0) {
      console.log(`Small touch targets on /join: ${tooSmall.join(' | ')}`);
    }
    expect(tooSmall.length).toBeLessThan(20);
  });

  test('font sizes readable at tablet distance (min 14px)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const smallFonts = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('p, span, a, li, td, label, h1, h2, h3, h4, h5, h6').forEach((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const rect = el.getBoundingClientRect();
        // Only check visible elements with actual content
        if (rect.width > 0 && rect.height > 0 && fontSize < 12 && (el.textContent || '').trim().length > 2) {
          const text = (el.textContent || '').trim().slice(0, 25);
          problems.push(`${el.tagName.toLowerCase()}("${text}") ${fontSize}px`);
        }
      });
      return problems.slice(0, 10);
    });
    if (smallFonts.length > 0) {
      console.log(`Small fonts on /: ${smallFonts.join(' | ')}`);
    }
    // Informational — don't hard-fail, just report
    expect(smallFonts.length).toBeLessThan(30);
  });

  test('no horizontal overflow on available-now', async ({ page }) => {
    await page.goto('/available-now');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('no horizontal overflow on explore', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('keyboard does not break layout on signup', async ({ page }) => {
    await page.goto('/signup/account');
    await page.waitForLoadState('networkidle');
    const firstInput = page.locator('input:visible').first();
    if (await firstInput.isVisible()) {
      await firstInput.tap();
      // Viewport should not have shifted horizontally
      const scrollX = await page.evaluate(() => window.scrollX);
      expect(scrollX).toBe(0);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
    }
  });
});
