import { test, expect } from '@playwright/test';

test.describe('Phase 4 CRM', () => {
  test('should show sign-in state when CRM is opened unauthenticated', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('button', { name: 'CRM' }).click();
    await expect(page.getByText('Sign in to access CRM projects')).toBeVisible();
  });

  test('should open auth modal from CRM sign-in CTA', async ({ page }) => {
    await page.goto('/map');
    await page.getByRole('button', { name: 'CRM' }).click();
    await page.getByRole('button', { name: 'Sign In' }).nth(1).click();
    await expect(page.getByRole('heading', { name: 'SIGN IN' })).toBeVisible();
  });
});
