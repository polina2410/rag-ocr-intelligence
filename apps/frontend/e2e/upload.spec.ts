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

  test('shows error when a non-CSV file is selected', async ({ page }) => {
    await page.locator('#drop-zone-input').setInputFiles({
      name: 'report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
    });
    await expect(page.getByRole('alert')).toHaveText('Please select a CSV file.');
  });
});
