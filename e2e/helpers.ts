import { expect, type Page } from '@playwright/test';
import { demoFields } from '../src/fixtures/fields';

export const SUPPORT_SENTENCE = 'This is decision support';

/**
 * Step 1 by address search, as the farmer does it (O1-F2). Nominatim is mocked with one place at the demo field's
 * centroid, so the run does not depend on its rate limit; the queries have no Polish letters, so they go to Nominatim.
 * Iowa then takes the demo field's stored outline; Poznań asks ULDK (live) for the parcel, or falls back to 4 ha.
 */
async function findField(page: Page, demo: 'Iowa demo field' | 'Poznań demo field') {
  const field = demo === 'Iowa demo field' ? demoFields.iowa : demoFields.poznan;
  const body = JSON.stringify([{ lat: String(field.centroid.lat), lon: String(field.centroid.lon), display_name: demo }]);
  await page.route('**/nominatim.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body }),
  );
  await page.getByLabel('Address or place').fill(demo === 'Iowa demo field' ? 'Iowa demo' : 'Poznan demo');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText(`Found ${demo}.`)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
}

/** The start page, then steps 1–4 for a demo field with the default goal and priorities. Stops on step 4, before "Next". */
export async function walkToPriorities(page: Page, demoButton: 'Iowa demo field' | 'Poznań demo field') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 1 of 6');
  await findField(page, demoButton);
  await next(page);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 2 of 6');
  await page.getByRole('radio', { name: /Keep my soil/ }).click();
  await next(page);

  // Step 3. Iowa: CropScape history is proposed and the farmer confirms it.
  // Poznań: no crop maps, so the farmer taps one crop tile per season, as a real farmer would.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 3 of 6');
  if (demoButton === 'Iowa demo field') {
    await expect(page.getByText(/Is this right\?/)).toBeVisible();
    await page.getByRole('button', { name: /Yes, use these crops/ }).click();
  } else {
    await pickPoznanSeasons(page);
  }
  await expect(page.getByText(/Saved \d+ years of crops/)).toBeVisible();
  await next(page);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 4 of 6');
}

/**
 * The Poznań farmer's last three seasons, newest first: winter wheat after maize after winter wheat, a common
 * rotation in Wielkopolska. These are the scenario's answers, not data; if a crop leaves data/crops/pl.json the
 * tile is missing and this step fails with the crop's name, which is the signal we want.
 */
export const POZNAN_SEASONS = ['Winter wheat', 'Maize', 'Winter wheat'] as const;

async function pickPoznanSeasons(page: Page) {
  const seasons = page.getByRole('radiogroup', { name: /Main crop in \d{4}/ });
  await expect(seasons).toHaveCount(POZNAN_SEASONS.length);
  for (const [i, crop] of POZNAN_SEASONS.entries()) {
    const tile = seasons.nth(i).getByRole('radio', { name: crop });
    await tile.click();
    await expect(tile).toHaveAttribute('aria-checked', 'true');
  }
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
    // Gaps (first list) and risks to check locally (second list) each have at least one entry.
    await expect(card.getByRole('list').nth(0).getByRole('listitem').first()).toBeVisible();
    await expect(card.getByRole('list').nth(1).getByRole('listitem').first()).toBeVisible();
  }
  return cards;
}
