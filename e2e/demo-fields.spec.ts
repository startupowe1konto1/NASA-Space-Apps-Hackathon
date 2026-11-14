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

    test('step 6 shows a money row for every rotation of step 5, in the same order', async ({ page }) => {
      await walkToPriorities(page, demo);
      await next(page);
      const cards = await expectFourCards(page);
      const titles = (await cards.getByRole('heading', { level: 2 }).allTextContents()).map((s) => s.trim());
      await next(page);

      await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 6 of 6');
      await expect(page.getByRole('heading', { name: 'What each rotation would have earned' })).toBeVisible();
      const rows = page.getByRole('figure').getByRole('group');
      await expect(rows).toHaveCount(titles.length);
      const names = await rows.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
      // The card heading may carry "Your rotation" or "Option n" next to the crops; the row name is the crops alone.
      names.forEach((name, i) => expect(titles[i]).toContain(name));

      // The current rotation has its average-year margin on the chart (both demo fields have money for it).
      const current = rows.filter({ hasText: 'Your rotation' });
      await expect(current).toHaveCount(1);
      await expect(current.getByRole('img')).toHaveAccessibleName(/average year -?[\d,]+ (USD|PLN) per hectare/);
      await expect(page.getByText("Past years replayed at today's prices, not a forecast.")).toBeVisible();
    });

    // Step 5 folds the evidence (HANDOFF-frontend, the user's decision), so the source chips show once it is opened.
    test('each card has a calendar strip and at least one source chip behind its evidence', async ({ page }) => {
      await walkToPriorities(page, demo);
      await next(page);
      const picks = await expectFourCards(page);
      for (const pick of await picks.all()) {
        await pick.click();
        const card = page.getByRole('article');
        await expect(card.getByRole('table', { name: /calendar/i })).toHaveCount(1);
        await card.locator('summary', { hasText: 'Evidence' }).click();
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
