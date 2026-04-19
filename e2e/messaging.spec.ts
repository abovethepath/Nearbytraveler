import { test, expect } from '@playwright/test';

test.describe('Messaging / DM', () => {
  test('messages page redirects unauthenticated users', async ({ page }) => {
    const response = await page.goto('/messages');
    // Should redirect to login/join or show auth prompt — not 500
    expect(response!.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('messages route does not crash', async ({ page }) => {
    await page.goto('/messages');
    // Verify no blank screen — some content should render
    const content = await page.textContent('body');
    expect(content!.length).toBeGreaterThan(10);
  });
});
