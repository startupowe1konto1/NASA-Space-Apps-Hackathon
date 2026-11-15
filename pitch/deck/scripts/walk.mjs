// Walks the deck as the presenter does: one key press per slide (slide 6: one per step), then logs how the slide's
// step advances over time and screenshots it once it stops changing. Run from pitch/deck:
//   node scripts/walk.mjs <outDir> [baseUrl=http://127.0.0.1:8767/]
// Prints, per press, the hash every 500 ms until it is stable for 15 s (or 60 s pass), then "<slide>.<step> settled after N ms".
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, base = 'http://127.0.0.1:8767/'] = process.argv.slice(2);
if (!outDir) { console.error('usage: node scripts/walk.mjs <outDir> [baseUrl]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
let errors = 0;
page.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) { errors++; console.log(`[error] ${m.text()}`); } });
page.on('pageerror', (e) => { errors++; console.log(`[pageerror] ${e.message}`); });
await page.goto(`${base}#1.0`);
await page.waitForTimeout(5000);

const state = () => page.evaluate(() => location.hash.slice(1));
async function settle(label) {
  const t0 = Date.now();
  let last = await state(), since = Date.now();
  const seen = [last];
  while (Date.now() - t0 < 60000) {
    await page.waitForTimeout(500);
    const s = await state();
    if (s !== last) { last = s; since = Date.now(); seen.push(`${s}@${Date.now() - t0}`); }
    else if (Date.now() - since > 15000) break;
  }
  console.log(`${label}: ${seen.join(' -> ')} | settled at ${last} after ${since - t0} ms`);
  await page.screenshot({ path: path.join(outDir, `${label}.png`) });
  return last;
}

await settle('start');
// Six presses take slides 1 -> 7, plus four extra presses for slide 6's manual steps.
const presses = ['to2', 'to3', 'to4', 'to5', 'to6', 's6-1', 's6-2', 's6-3', 's6-4', 's6-5', 'to7'];
for (const label of presses) {
  await page.keyboard.press('ArrowRight');
  await settle(label);
}
console.log(`errors: ${errors}`);
await browser.close();
