import { test, expect } from '@playwright/test';
import { gotoTab } from './utils';

test.describe('Modal Confirmation Flow', () => {
  test('confirms through nested modal and closes both layers', async ({ page }) => {
    await page.goto('/');
    await gotoTab(page, 'Responsive');

    await page.getByRole('button', { name: 'Open Modal' }).click();

    // First modal layer. Prefer role="dialog" so we scope all further
    // interactions to the topmost open dialog rather than the page at large,
    // which is what prevents "clicking through" to the background.
    const dialogs = page.getByRole('dialog');
    await expect(dialogs.first()).toBeVisible();

    // Click "Show Details" within whichever dialog currently contains it.
    await dialogs.getByRole('button', { name: 'Show Details' }).first().click();

    // A second (nested) dialog should now be on top. Playwright's
    // getByRole('dialog').last() targets the most-recently-opened/topmost
    // dialog, so the Confirm click below hits the nested modal, not the
    // parent behind it.
    await expect(dialogs).toHaveCount(2, { timeout: 5_000 });
    const nestedDialog = dialogs.last();
    await expect(nestedDialog).toBeVisible();

    await nestedDialog.getByRole('button', { name: 'Confirm' }).click();

    // Both modals should be closed.
    await expect(dialogs).toHaveCount(0, { timeout: 5_000 });

    // Result should reflect confirmation.
    await expect(page.getByText(/confirmed/i)).toBeVisible();
  });
});
