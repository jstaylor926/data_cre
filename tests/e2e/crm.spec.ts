import { test, expect } from '@playwright/test';

test.describe('Phase 4 CRM', () => {
  test('should allow navigating to CRM dashboard', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('button', { name: 'CRM' }).click();
    await expect(page.getByRole('heading', { name: 'Firm Projects' })).toBeVisible();
  });

  test('should show CRM create controls', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('button', { name: 'CRM' }).click();
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
  });
});
