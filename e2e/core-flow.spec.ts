import { expect, test } from '@playwright/test';
import { mockMeetEatApi } from './helpers/mockMeetEatApi';

test('demo room flow generates recommendations and persists a vote', async ({ page }) => {
  const api = await mockMeetEatApi(page);

  await page.goto('/');
  await page.locator('#btn-demo-sandbox').click();

  await expect(page.locator('#btn-calc-consensus')).toContainText('Calculate Center for');
  await page.locator('#btn-calc-consensus').click();

  await expect(page.getByText('Ramen House')).toBeVisible({ timeout: 10_000 });
  expect(api.wasRecommendationRequested()).toBe(true);
  await expect(page.getByText('A strong match for the group preferences.')).toBeVisible();

  await page.getByRole('button', { name: /Vote/i }).click();

  await expect(page.getByText('UNANIMOUS CONSENSUS')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ramen House' })).toBeVisible();
});

