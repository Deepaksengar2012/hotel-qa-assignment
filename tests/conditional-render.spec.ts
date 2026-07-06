import { test, expect } from '@playwright/test';
import { gotoTab } from './utils';

test.describe('Conditional Login Flow', () => {
  test('shows Admin Panel for admin login and Standard Panel after switching', async ({ page }) => {
    await page.goto('/');
    await gotoTab(page, 'Flaky Selectors');

    // --- Admin login ---
    await page.getByRole('button', { name: 'Admin User' }).click();

    // Handle the loading state between login and dashboard: wait for any
    // loading indicator to clear, then wait for the panel itself rather
    // than a fixed timeout.
    const loadingIndicator = page.getByText(/loading/i);
    if (await loadingIndicator.count()) {
      await expect(loadingIndicator).toBeHidden({ timeout: 8_000 });
    }

    const adminPanel = page.getByText('Admin Panel', { exact: false });
    const standardPanel = page.getByText('Standard Panel', { exact: false });

    await expect(adminPanel).toBeVisible({ timeout: 8_000 });
    await expect(standardPanel).toBeHidden();

    // --- Logout ---
    await page.getByRole('button', { name: 'Logout' }).click();

    // --- Standard login ---
    await page.getByRole('button', { name: 'Standard User' }).click();
    if (await loadingIndicator.count()) {
      await expect(loadingIndicator).toBeHidden({ timeout: 8_000 });
    }

    await expect(standardPanel).toBeVisible({ timeout: 8_000 });
    await expect(adminPanel).toBeHidden();
  });
});
