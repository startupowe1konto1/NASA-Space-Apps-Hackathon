import { expect, test } from '@playwright/test';
import { expectFourCards, next, walkToPriorities } from './helpers';

// SPEC section 14 and docs/PLAN.md task O1-S3. Re-run after every provider swap in src/app/providers.ts.

for (const demo of ['Iowa demo field', 'Poznań demo field'] as const) {
  test.describe(demo, () => {
    test('field, goal, crops and priorities end on four rotation cards', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await walkToPriorities(page, demo);
      await next(page);

      await expect(page.getByRole('heading', { level: 1 })).toContainText('Rotations for this field');
      await expectFourCards(page);
      expect(errors).toEqual([]);
    });

    test('each card has a calendar strip and at least one source chip', async ({ page }) => {
      await walkToPriorities(page, demo);
      await next(page);
      const cards = await expectFourCards(page);
      for (const card of await cards.all()) {
        await expect(card.getByRole('table', { name: /calendar/i })).toHaveCount(1);
        await expect(card.getByRole('button', { name: /source/i }).first()).toBeVisible();
      }
    });
  });
}

test('offline on step 5 shows "No connection" instead of an empty screen, and recovers', async ({ page, context }) => {
  await walkToPriorities(page, 'Iowa demo field');
  await context.setOffline(true);
  await next(page);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Rotations for this field');
  await expect(page.getByText('No connection')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);

  await context.setOffline(false);
  await expectFourCards(page);
});

test('NASA POWER blocked shows a source error with a retry', async ({ page }) => {
  await page.route('**/power.larc.nasa.gov/**', (route) => route.abort());
  await walkToPriorities(page, 'Iowa demo field');
  await next(page);
  await expect(page.getByRole('alert')).toContainText('NASA POWER');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});
