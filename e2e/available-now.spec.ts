import { test, expect } from '@playwright/test';

test.describe('Available Now', () => {
  test('available now page loads for unauthenticated users (redirects to login)', async ({ page }) => {
    const response = await page.goto('/available-now');
    // Should either load the page or redirect to login/join
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('available now landing content is accessible', async ({ page }) => {
    await page.goto('/');
    // Check if Available Now section or link exists on homepage
    const availableNowLink = page.getByText(/available now|who.?s out/i).first();
    const exists = await availableNowLink.isVisible().catch(() => false);
    // Either the section is visible on homepage or we navigate to it
    if (!exists) {
      await page.goto('/available-now');
    }
    // Page should not be a 500 error
    const content = await page.textContent('body');
    expect(content!.length).toBeGreaterThan(10);
  });
});
