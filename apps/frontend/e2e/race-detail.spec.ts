import { test, expect } from '@playwright/test';

test.describe('Race detail page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/races');
    await page.getByRole('main').getByRole('link').first().click();
    await expect(page).toHaveURL(/\/races\/.+/);
  });

  test('shows race header metadata', async ({ page }) => {
    const raceHeader = page.getByRole('heading', { level: 1 }).locator('..');
    await expect(raceHeader.getByText(/\d+(\.\d+)? km/)).toBeVisible();
    await expect(raceHeader.getByText(/\d+ obstacles/)).toBeVisible();
  });

  test('shows obstacle split time chart', async ({ page }) => {
    await expect(
      page.getByRole('img', { name: 'Bar chart: average split time per obstacle in seconds' }),
    ).toBeVisible();
  });

  test('shows penalty rate chart', async ({ page }) => {
    await expect(
      page.getByRole('img', { name: 'Bar chart: penalty rate per obstacle' }),
    ).toBeVisible();
  });

  test('shows athlete leaderboard table', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('shows category filter', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: 'Category' })).toBeVisible();
  });
});
