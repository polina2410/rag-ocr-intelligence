import { test, expect } from '@playwright/test';

test.describe('Ask AI page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ask');
  });

  test('shows Ask AI heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ask AI' })).toBeVisible();
  });

  test('has a question textbox', async ({ page }) => {
    await expect(
      page.getByRole('textbox', { name: 'Ask a question about the race data…' }),
    ).toBeVisible();
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  test('send button enables once a question is typed', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Ask a question about the race data…' }).fill('Who won the race?');
    await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();
  });
});
