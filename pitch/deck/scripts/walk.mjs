// Walks the deck as the presenter does: one key press per slide (the answer slide: one per step), then logs how the slide's
// step advances over time and screenshots it once it stops changing. Run from pitch/deck:
//   node scripts/walk.mjs <outDir> [baseUrl=http://127.0.0.1:8767/]
// Prints, per press, the slide.step reached once the deck reports it is no longer playing (window.deckBusy).
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
  await page.waitForTimeout(300);
  await page.waitForFunction(() => !window.deckBusy(), null, { timeout: 60000, polling: 200 });
  await page.waitForTimeout(800);
  console.log(`${label}: ${await state()} after ${Date.now() - t0} ms`);
  await page.screenshot({ path: path.join(outDir, `${label}.png`) });
}

await settle('start');
// Press until the last slide is reached; the manual slide (answer) takes one press per step.
const count = Number(await page.evaluate(() => document.getElementById('stage').dataset.count));
for (let i = 0; i < 40 && (await state()) !== `${count}.0`; i++) {
  await page.keyboard.press('ArrowRight');
  await settle(`press${String(i + 1).padStart(2, '0')}`);
}
console.log(`errors: ${errors}`);
await browser.close();
