import { test, expect } from '@playwright/test';

test.describe('404 Not Found page', () => {
  test('shows Page not found heading for an unknown URL', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('shows descriptive message', async ({ page }) => {
    await page.goto('/unknown-route');
    await expect(page.getByText("This URL doesn't exist")).toBeVisible();
  });

  test('Back to races link navigates to /races', async ({ page }) => {
    await page.goto('/unknown-route');
    await page.getByRole('link', { name: 'Back to races' }).click();
    await expect(page).toHaveURL('/races');
  });
});
