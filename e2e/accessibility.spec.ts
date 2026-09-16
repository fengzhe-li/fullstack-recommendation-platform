import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { mockMeetEatApi } from './helpers/mockMeetEatApi';

async function expectNoAccessibilityViolations(page: Page, stateName: string) {
  await page.waitForTimeout(700);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, `${stateName} accessibility violations`).toEqual([]);
}

test('main screens have no automated axe accessibility violations', async ({ page }) => {
  await mockMeetEatApi(page);

  await page.goto('/');
  await expectNoAccessibilityViolations(page, 'landing screen');

  await page.locator('#btn-demo-sandbox').click();
  await expect(page.locator('#btn-calc-consensus')).toContainText('Calculate Center for');
  await expectNoAccessibilityViolations(page, 'room screen');

  await page.locator('#btn-calc-consensus').click();
  await expect(page.getByText('Ramen House')).toBeVisible({ timeout: 10_000 });
  await expectNoAccessibilityViolations(page, 'results screen');
});

test('participant dialog has no automated axe accessibility violations', async ({ page }) => {
  await mockMeetEatApi(page);

  await page.goto('/');
  await page.locator('#btn-create-hangout').click();
  await page.locator('#btn-add-p-trigger').click();
  await expect(page.getByRole('dialog', { name: /Add/i })).toBeVisible();

  await expectNoAccessibilityViolations(page, 'participant dialog');
});
