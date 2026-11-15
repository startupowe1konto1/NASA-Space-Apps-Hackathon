// Screenshots of the running app for the two app slides (task P8): the Uzarzewo parcel, in English.
// Run from pitch/deck, with the app served from current main:
//   node scripts/shoot-app.mjs [appUrl=http://localhost:5179/] [--full]
// Writes assets/app/01-field.png, 02-history.png, 03-goal.png, 04-income.png: 16:10 crops at 2x pixel density,
// each framed on the part of the screen the slide talks about. --full also writes full-page captures to
// assets/app/full/ for choosing the crops. Waits for text, never for a fixed time. Stops on a source error.
// The parcel, the notebook years and the goal come from data/field.json, so the app shows the slides' field.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cropName } from '../src/crops.js';

const DECK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(DECK, 'assets/app');
const args = process.argv.slice(2);
const full = args.includes('--full');
const base = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:5179/';
const data = JSON.parse(fs.readFileSync(path.join(DECK, 'data/field.json'), 'utf8'));

const PARCEL = data.field.parcelId;
const AREA = `${data.field.areaHa.toFixed(1)} ha`;
if (!PARCEL) throw new Error('field.json has no field.parcelId');
fs.mkdirSync(OUT, { recursive: true });
if (full) fs.mkdirSync(path.join(OUT, 'full'), { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
// Tall, so the sticky header stays at the top and the sticky footer below every crop. The map is 60% of the
// viewport height, so step 1 uses a shorter viewport to keep the map at a sensible size.
const TALL = { width: 1280, height: 2400 };
const page = await browser.newPage({ viewport: { width: 1280, height: 880 }, deviceScaleFactor: 2 });
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));

const waitText = (t, timeout = 90000) => page.getByText(t, { exact: false }).first().waitFor({ timeout });
const next = () => page.getByRole('button', { name: 'Next', exact: true }).click();

/** Stop if the screen shows a source error or a loading state. */
async function assertClean(step) {
  const body = await page.locator('main').innerText();
  for (const bad of ['Source error', 'could not load', 'Loading', 'Something went wrong']) {
    if (body.includes(bad)) {
      await page.screenshot({ path: path.join(OUT, `ERROR-${step}.png`), fullPage: true });
      throw new Error(`${step}: the screen shows "${bad}"; see assets/app/ERROR-${step}.png`);
    }
  }
}

/** Page box of the union of several locators. The viewport is tall enough that nothing scrolls. */
async function around(...locators) {
  const boxes = [];
  for (const l of locators) boxes.push(await l.boundingBox());
  const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
  return { x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) - x, height: Math.max(...boxes.map((b) => b.y + b.height)) - y };
}

/** Screenshot a box padded by `pad` px. Each crop keeps its own shape; the slide sizes its frame from the image. */
async function shoot(file, box, pad = 24) {
  if (full) await page.screenshot({ path: path.join(OUT, 'full', file) });
  const vp = page.viewportSize();
  const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad);
  const w = Math.min(vp.width - x, box.width + 2 * pad), h = Math.min(vp.height - y, box.height + 2 * pad);
  await page.screenshot({ path: path.join(OUT, file), clip: { x, y, width: w, height: h } });
  console.log(`${file}: ${Math.round(w)} x ${Math.round(h)} css px (aspect ${(w / h).toFixed(2)})`);
}

try {
  await page.goto(`${base}?lang=en`);
  await page.getByRole('button', { name: 'Start', exact: true }).click();

  // Step 1, field: the parcel by its land-register number.
  await waitText('Find a Polish parcel');
  await page.getByRole('textbox', { name: 'Parcel number' }).fill(PARCEL);
  await page.getByRole('button', { name: 'Find parcel', exact: true }).click();
  await waitText(`${PARCEL}, ${AREA}`);
  await assertClean('field');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500); // map tiles fade in after they load
  // The step bar, the title, the search box and the map with the parcel: the top 800 px of the page.
  await shoot('01-field.png', { x: 0, y: 0, width: 1280, height: 800 }, 0);
  await page.setViewportSize(TALL);
  await next();

  // Step 2, goal. The goal on the slides is "Keep my soil".
  await waitText('What matters most to you?');
  await page.getByText('Keep my soil', { exact: true }).click();
  await assertClean('goal');
  await shoot('03-goal.png', await around(page.getByRole('heading', { name: /What matters most/ }), page.getByRole('radio').last()));
  await next();

  // Step 3, crops: the last three notebook years, each in its own year group.
  await waitText('What grew there');
  // The app lists the seasons newest first, each with the same crop buttons, so a crop's n-th button is the n-th
  // season shown. The last three notebook years, newest first, match that order.
  const years = data.notebook.slice(-3).reverse();
  const cropButton = (name) => page.locator('button').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });
  for (const [i, { crop }] of years.entries()) await cropButton(cropName(crop)).nth(i).click();
  // Each pick is pressed, then the highlight fades in (CSS transition); shoot only after it has finished.
  await page.waitForFunction((n) => document.querySelectorAll('main [aria-pressed="true"], main [aria-checked="true"]').length === n, years.length);
  await page.waitForTimeout(700);
  await waitText(`Saved ${years.length} years of crops`);
  await assertClean('history');
  await shoot('02-history.png', await around(page.getByRole('heading', { name: /What grew there/ }), page.getByText(`Saved ${years.length} years of crops`)));
  await next();

  // Step 4, priorities: defaults. Step 5, rotations.
  await waitText('Crops you will not grow');
  await next();
  await waitText('Rotations for this field');
  await waitText('Best for:');
  await assertClean('rotations');
  // Step 6, income: "Switch or stay?", the best rotation for the goal against Jan's own, with soil health, climate
  // resilience and income side by side. A narrower window keeps the table's text large at slide size.
  await next();
  await page.setViewportSize({ width: 900, height: 2400 });
  await waitText('Switch or stay?');
  await waitText('Income, average year');
  await assertClean('income');
  const table = page.locator('main table').first();
  await shoot('04-income.png', await around(page.getByText('Switch or stay?', { exact: true }), table), 10);
  if (problems.length) console.log(problems.join('\n'));
  console.log(`page errors: ${problems.length}`);
} finally {
  await browser.close();
}
