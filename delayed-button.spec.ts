import { test, expect } from '@playwright/test';
import { gotoTab } from './utils';

test.describe('Delayed Button Flow', () => {
  test('confirm button becomes enabled after process starts, then confirms', async ({ page }) => {
    await page.goto('/');
    await gotoTab(page, 'Timing Challenges');

    await page.getByRole('button', { name: 'Start Process' }).click();

    // No hardcoded waits: poll the button's enabled state via Playwright's
    // built-in auto-retrying assertion instead of page.waitForTimeout().
    const confirmButton = page.getByRole('button', { name: 'Confirm Action' });
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled({ timeout: 8_000 });

    await confirmButton.click();

    // Assumption: success state is rendered as visible text containing "success"
    // (case-insensitive). Adjust the pattern if the app uses a different copy
    // or a data-testid="success-message" hook.
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
