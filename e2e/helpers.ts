import { expect, type Page } from '@playwright/test';

export const SUPPORT_SENTENCE = 'This is decision support';

/** Steps 1–4 for a demo field with the default goal and priorities. Stops on step 4, before "Next". */
export async function walkToPriorities(page: Page, demoButton: 'Iowa demo field' | 'Poznań demo field') {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 1 of 7');
  await page.getByRole('radio', { name: /Keep my soil/ }).click();
  await next(page);

  await page.getByRole('button', { name: demoButton }).click();
  await next(page);

  // Step 3: confirm the proposed history (Iowa) or the picked crops (Poznań).
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 3 of 7');
  await page.getByRole('button', { name: /Yes, use these crops/ }).click();
  await expect(page.getByText(/Saved \d+ years of crops/)).toBeVisible();
  await next(page);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 4 of 7');
}

export async function next(page: Page) {
  await page.getByRole('button', { name: 'Next', exact: true }).click();
}

/** Step 5 checks shared by both demo fields (SPEC section 14). */
export async function expectFourCards(page: Page) {
  await expect(page.getByText('Your rotation', { exact: true })).toBeVisible();
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(4);
  for (const card of await cards.all()) {
    await expect(card).toContainText('What we do not know');
    await expect(card).toContainText('Check locally');
    await expect(card).toContainText(SUPPORT_SENTENCE);
    // Gaps and risks are lists with at least one entry each.
    expect(await card.getByRole('listitem').count()).toBeGreaterThanOrEqual(2);
  }
  return cards;
}
