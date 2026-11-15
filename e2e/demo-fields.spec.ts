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

    test('step 6 shows your rotation first and every other rotation of step 5 against it', async ({ page }) => {
      await walkToPriorities(page, demo);
      await next(page);
      // Step 5 shows one card at a time (#184), so the names come from its four picks.
      const picks = await expectFourCards(page);
      const titles = await picks.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
      expect(titles).toHaveLength(4);
      await next(page);

      await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 6 of 6');
      // The top of step 6 (O1-F14) puts the first option next to the current rotation.
      await expect(page.getByRole('heading', { name: 'Switch or stay?' })).toBeVisible();
      const compare = page.getByRole('table', { name: 'The option next to your rotation' });
      await expect(compare).toBeVisible();
      const currentTitle = titles.find((title) => title.startsWith('Your rotation'))!;
      const firstOption = titles.find((title) => title.startsWith('Option 1'))!;
      for (const title of [currentTitle, firstOption]) {
        await expect(compare.getByRole('columnheader').filter({ hasText: title.split(': ')[1]! })).toHaveCount(1);
      }

      // Under it, every rotation of step 5 as a ranked card against your rotation (O2-B6b).
      await expect(page.getByRole('heading', { name: 'What each rotation would have earned' })).toBeVisible();
      const groups = page.getByRole('figure').getByRole('group');
      await expect(groups).toHaveCount(titles.length);

      // The first group is your rotation, the reference, with its average-year margin.
      const reference = groups.first();
      await expect(reference).toHaveAccessibleName(/^Your rotation, the reference: /);
      await expect(reference).toContainText(/[\d,]+\s*(USD|PLN)\/ha/);
      const currentName = ((await reference.getAttribute('aria-label')) ?? '').replace('Your rotation, the reference: ', '');
      expect(titles.find((title) => title.startsWith('Your rotation'))).toContain(currentName);

      // Every other pick is a row, with a bar that says how much more or less it earns than your rotation.
      const names = await groups.evaluateAll((els) => els.slice(1).map((el) => el.getAttribute('aria-label') ?? ''));
      for (const title of titles.filter((tt) => !tt.startsWith('Your rotation'))) {
        expect(names.some((name) => title.includes(name))).toBe(true);
      }
      for (const name of names) {
        await expect(page.getByRole('group', { name, exact: true }).getByRole('img')).toHaveAccessibleName(
          /[\d,]+ (USD|PLN) per hectare (more|less) than your rotation in an average year/,
        );
      }
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
