import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('join page loads with user type options', async ({ page }) => {
    await page.goto('/join');
    await expect(page.getByText(/local|traveler|business/i).first()).toBeVisible();
  });

  test('selecting Nearby Local navigates to local signup', async ({ page }) => {
    await page.goto('/join');
    // Look for the local option card/button
    const localOption = page.getByText(/nearby local|local/i).first();
    await expect(localOption).toBeVisible();
    await localOption.click();
    // Should navigate to account or local signup step
    await page.waitForURL(/signup/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('selecting Nearby Traveler navigates to traveler signup', async ({ page }) => {
    await page.goto('/join');
    const travelerOption = page.getByText(/nearby traveler|traveling/i).first();
    await expect(travelerOption).toBeVisible();
    await travelerOption.click();
    await page.waitForURL(/signup/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('signup account page has required fields', async ({ page }) => {
    await page.goto('/signup/account');
    // Should have name, email, password fields
    await expect(page.getByPlaceholder(/name/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible();
  });
});
