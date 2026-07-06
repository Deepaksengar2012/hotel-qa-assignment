import { test, expect } from '@playwright/test';
import { gotoTab } from './utils';

// Assumption: each list item is rendered with role="listitem" (or a
// data-testid="list-item" fallback) and carries a visible status label
// ("active" / "pending" / etc.) as text content. Adjust the two locator
// helpers below if the app's markup differs.
function listItems(page: import('@playwright/test').Page) {
  return page.getByRole('listitem');
}

test.describe('Load and Verify List Items', () => {
  test('loads 15 items across 3 "Load More" clicks with mixed statuses', async ({ page }) => {
    await page.goto('/');
    await gotoTab(page, 'Timing Challenges');

    const loadMoreButton = page.getByRole('button', { name: 'Load More Items' });
    const items = listItems(page);

    for (let click = 1; click <= 3; click++) {
      const countBefore = await items.count();
      await loadMoreButton.click();

      // Wait for loading to actually finish before the next click:
      // 1) if the app shows a loading indicator, wait for it to disappear
      const loadingIndicator = page.getByText(/loading/i);
      if (await loadingIndicator.count()) {
        await expect(loadingIndicator).toBeHidden({ timeout: 8_000 });
      }
      // 2) and/or wait for the item count to actually increase
      await expect
        .poll(async () => items.count(), { timeout: 8_000 })
        .toBeGreaterThan(countBefore);
    }

    await expect(items).toHaveCount(15);

    const statusTexts = await items.allTextContents();
    const hasActive = statusTexts.some((t) => /\bactive\b/i.test(t));
    const hasPending = statusTexts.some((t) => /\bpending\b/i.test(t));

    expect(hasActive, 'expected at least one item with status "active"').toBeTruthy();
    expect(hasPending, 'expected at least one item with status "pending"').toBeTruthy();
  });
});
