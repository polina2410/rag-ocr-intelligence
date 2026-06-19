import { test, expect } from '@playwright/test';

test.describe('Races page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/races');
  });

  test('shows Races heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Races' })).toBeVisible();
  });

  test('shows race cards with distance and obstacle count', async ({ page }) => {
    const firstCard = page.getByRole('main').getByRole('link').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByText(/\d+(\.\d+)? km/)).toBeVisible();
    await expect(firstCard.getByText(/\d+ obstacles/)).toBeVisible();
  });

  test('clicking a race card navigates to the race detail page', async ({ page }) => {
    await page.getByRole('main').getByRole('link').first().click();
    await expect(page).toHaveURL(/\/races\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
