import { test, expect } from '@playwright/test';

test.describe('Races page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/races');
  });

  test('shows Races heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Races' })).toBeVisible();
  });

  test('shows race cards with name, date, location, distance and obstacles', async ({ page }) => {
    const card = page.getByRole('link', { name: /Spartan Sprint Subotica 2024/ });
    await expect(card).toBeVisible();
    await expect(card.getByText('Sep 28, 2024')).toBeVisible();
    await expect(card.getByText('Subotica, Serbia')).toBeVisible();
    await expect(card.getByText('8.5 km')).toBeVisible();
    await expect(card.getByText('23 obstacles')).toBeVisible();
  });

  test('clicking a race card navigates to the race detail page', async ({ page }) => {
    await page.getByRole('link', { name: /Spartan Sprint Subotica 2024/ }).click();
    await expect(page).toHaveURL(/\/races\/.+/);
    await expect(page.getByRole('heading', { name: 'Spartan Sprint Subotica 2024' })).toBeVisible();
  });
});