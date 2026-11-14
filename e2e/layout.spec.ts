import { expect, test } from '@playwright/test';

// The O4 redesign made the header sticky. Leaflet's panes (z-index 400) and controls (1000) then drew over it when
// the map scrolled under the header, because the map did not keep its z-indexes to itself (O1-F5).
test('step 1: the map scrolls under the sticky header, not over it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Step 1 of 6');
  const map = page.locator('.leaflet-container');
  await expect(map).toBeVisible();

  // Scroll so the top of the map, where the zoom buttons sit, lies under the header.
  await map.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top));
  const onTop = await map.evaluate((el) => {
    const header = document.querySelector('header')!.getBoundingClientRect();
    const x = el.getBoundingClientRect().left + 20;
    const y = header.top + header.height / 2;
    return document.elementFromPoint(x, y)?.closest('header') !== null;
  });
  expect(onTop).toBe(true);
});
