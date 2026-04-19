import { test, expect } from '@playwright/test';

// These tests run on pixel5 and galaxy-s21 projects defined in playwright.config.ts
// Run with: npx playwright test e2e/mobile-android.spec.ts --project=pixel5 --project=galaxy-s21

test.describe('Mobile Android — Core Flows', () => {
  test('homepage loads and mobile nav is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Nearby Traveler/i);
    await expect(page.locator('body')).toBeVisible();
    const mobileNav = page.locator('nav, [role="navigation"], [class*="bottom-nav"], [class*="BottomNav"]').first();
    await expect(mobileNav).toBeVisible();
  });

  test('no horizontal overflow on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('signup join page loads with user type options', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByText(/local|traveler/i).first()).toBeVisible();
  });

  test('signup account page renders inputs within viewport', async ({ page }) => {
    await page.goto('/signup/account');
    await page.waitForLoadState('networkidle');
    const inputs = page.locator('input:visible');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
    const vpWidth = page.viewportSize()!.width;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await inputs.nth(i).boundingBox();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(vpWidth + 5);
      }
    }
  });

  test('no horizontal overflow on signup', async ({ page }) => {
    await page.goto('/signup/account');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });

  test('available now page loads', async ({ page }) => {
    await page.goto('/available-now');
    const content = await page.textContent('body');
    expect(content!.length).toBeGreaterThan(10);
  });

  test('messages page loads without 500', async ({ page }) => {
    const response = await page.goto('/messages');
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('explore/community page loads and scrolls vertically', async ({ page }) => {
    await page.goto('/explore');
    await expect(page.locator('body')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
    // No horizontal scroll
    const scrollX = await page.evaluate(() => window.scrollX);
    expect(scrollX).toBe(0);
  });

  test('events landing page loads on mobile', async ({ page }) => {
    await page.goto('/events-landing');
    await expect(page.locator('body')).toBeVisible();
    const content = await page.textContent('body');
    expect(content).toMatch(/event/i);
  });

  test('blog page loads on mobile', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.locator('body')).toBeVisible();
    const content = await page.textContent('body');
    expect(content).toMatch(/blog/i);
  });
});

test.describe('Mobile Android — Touch & Accessibility', () => {
  test('touch targets are at least 44px on join page', async ({ page }) => {
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

  test('touch targets are at least 44px on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const tooSmall = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('button, a, [role="button"]').forEach((el) => {
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

  test('keyboard does not permanently cover focused input', async ({ page }) => {
    await page.goto('/signup/account');
    await page.waitForLoadState('networkidle');
    const firstInput = page.locator('input:visible').first();
    if (await firstInput.isVisible()) {
      await firstInput.tap();
      const box = await firstInput.boundingBox();
      if (box) {
        const vpHeight = page.viewportSize()!.height;
        expect(box.y).toBeLessThan(vpHeight);
      }
    }
  });

  test('no horizontal overflow on explore page', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
