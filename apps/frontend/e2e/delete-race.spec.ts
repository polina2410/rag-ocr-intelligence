import { test, expect } from '@playwright/test';

test.describe('Race card delete flow', () => {
  test('hovering a race card reveals the delete button', async ({ page }) => {
    await page.goto('/races');
    await page.getByRole('main').getByRole('link').first().hover();
    await expect(page.getByRole('button', { name: /^Delete / })).toBeVisible();
  });

  test('clicking delete opens a confirmation dialog', async ({ page }) => {
    await page.goto('/races');
    await page.getByRole('main').getByRole('link').first().hover();
    await page.getByRole('button', { name: /^Delete / }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Delete this race?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Keep race' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete race' })).toBeVisible();
  });

  test('cancelling the dialog keeps the race in the list', async ({ page }) => {
    await page.goto('/races');
    const cards = page.getByRole('main').getByRole('link');
    await expect(cards.first()).toBeVisible();
    const initialCount = await cards.count();

    await cards.first().hover();
    await page.getByRole('button', { name: /^Delete / }).click();
    await page.getByRole('button', { name: 'Keep race' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(cards).toHaveCount(initialCount);
  });

  test('confirming deletion removes the card from the list', async ({ page }) => {
    await page.route('**/races/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200 });
      } else {
        await route.continue();
      }
    });

    await page.goto('/races');
    const cards = page.getByRole('main').getByRole('link');
    await expect(cards.first()).toBeVisible();
    const initialCount = await cards.count();

    await cards.first().hover();
    await page.getByRole('button', { name: /^Delete / }).click();
    await page.getByRole('button', { name: 'Delete race' }).click();

    await expect(cards).toHaveCount(initialCount - 1);
  });
});
