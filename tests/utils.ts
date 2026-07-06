import { Page, expect } from '@playwright/test';

/**
 * Navigates to a top-level tab by its visible name.
 * Uses role-based locators (resilient to markup/id changes) rather than
 * relying on any dynamic id/class the app may generate.
 */
export async function gotoTab(page: Page, tabName: string) {
  // Try an explicit tab role first; fall back to a plain button/link with
  // that visible text if the app doesn't use role="tab".
  const tab = page.getByRole('tab', { name: tabName });
  if (await tab.count()) {
    await tab.first().click();
    return;
  }
  await page.getByRole('button', { name: tabName }).or(page.getByText(tabName, { exact: true })).first().click();
}
