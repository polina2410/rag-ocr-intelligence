import { test, expect } from '@playwright/test';

test.describe('Navbar navigation', () => {
  test('shows all nav links from the races page', async ({ page }) => {
    await page.goto('/races');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Races' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Ask AI' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Upload' })).toBeVisible();
  });

  test('logo link navigates to /races', async ({ page }) => {
    await page.goto('/ask');
    await page.getByRole('link', { name: 'OCR Intelligence' }).click();
    await expect(page).toHaveURL('/races');
  });

  test('Ask AI link navigates to /ask', async ({ page }) => {
    await page.goto('/races');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Ask AI' }).click();
    await expect(page).toHaveURL('/ask');
  });

  test('Upload link navigates to /upload', async ({ page }) => {
    await page.goto('/races');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Upload' }).click();
    await expect(page).toHaveURL('/upload');
  });

  test('Races link navigates back to /races', async ({ page }) => {
    await page.goto('/upload');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Races' }).click();
    await expect(page).toHaveURL('/races');
  });
});
