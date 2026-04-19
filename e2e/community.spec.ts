import { test, expect } from '@playwright/test';

test.describe('Community / Explore Page', () => {
  test('explore page loads', async ({ page }) => {
    const response = await page.goto('/explore');
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('community content is visible or auth-gated', async ({ page }) => {
    await page.goto('/explore');
    // Should show community content, login prompt, or redirect — not blank
    const content = await page.textContent('body');
    expect(content!.length).toBeGreaterThan(10);
  });

  test('events landing page loads publicly', async ({ page }) => {
    await page.goto('/events-landing');
    await expect(page.locator('body')).toBeVisible();
    const content = await page.textContent('body');
    expect(content).toMatch(/event/i);
  });
});
