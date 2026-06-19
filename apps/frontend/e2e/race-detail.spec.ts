import { test, expect } from '@playwright/test';

test.describe('Race detail page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/races');
    await page.getByRole('link', { name: /Spartan Sprint Subotica 2024/ }).click();
    await expect(page.getByRole('heading', { name: 'Spartan Sprint Subotica 2024' })).toBeVisible();
  });

  test('shows race header metadata', async ({ page }) => {
    await expect(page.getByText('Sep 28, 2024')).toBeVisible();
    await expect(page.getByText('Subotica, Serbia')).toBeVisible();
    await expect(page.getByText('8.5 km')).toBeVisible();
    await expect(page.getByText('23 obstacles')).toBeVisible();
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