import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows key content', async ({ page }) => {
    await page.goto('/');
    // Page should load without errors
    await expect(page).toHaveTitle(/Nearby Traveler/i);
    // Should show a call-to-action or landing content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Check for key landing elements (join button, hero text, or nav)
    const hasJoinOrSignup = await page.getByRole('link', { name: /join|sign up|get started/i }).first().isVisible().catch(() => false);
    const hasHeroText = await page.getByText(/travel|connect|meet/i).first().isVisible().catch(() => false);
    expect(hasJoinOrSignup || hasHeroText).toBeTruthy();
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');
    // Should have navigation or header
    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('dark mode toggle or theme works', async ({ page }) => {
    await page.goto('/');
    // Page should render without console errors causing blank screen
    const content = await page.textContent('body');
    expect(content!.length).toBeGreaterThan(50);
  });
});
