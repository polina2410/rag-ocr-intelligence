import { test, expect } from '@playwright/test';

test.describe('Upload page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/upload');
  });

  test('shows Upload Race Data heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Upload Race Data' })).toBeVisible();
  });

  test('shows CSV drop zone with instructions', async ({ page }) => {
    await expect(page.getByText('Drag a CSV file here, or click to select')).toBeVisible();
  });

  test('drop zone is clickable', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Upload a CSV file' })).toBeVisible();
  });
});
