// Screenshot helper for checking slides (run from pitch/deck: node scripts/shoot.mjs ...). Each run starts its own system Chrome, so parallel tasks do not share a browser.
// Usage: node shoot.mjs <url> <out.png> [waitMs=4000] [width=1920] [height=1080] [keys=Right,Right,...] [keyGapMs=900]
// Prints every console message and page error, then "errors: N". Optional keys are pressed after the wait, one every keyGapMs,
// and the screenshot is taken keyGapMs + 3000 ms after the last key.


import { chromium } from 'playwright';

const [url, out, waitMs = '4000', w = '1920', h = '1080', keys = '', keyGap = '900'] = process.argv.slice(2);
if (!url || !out) { console.error('usage: node shoot.mjs <url> <out.png> [waitMs] [w] [h] [keys] [keyGapMs]'); process.exit(2); }

const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
let errors = 0;
page.on('console', (m) => { if (m.type() === 'error') errors++; console.log(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => { errors++; console.log(`[pageerror] ${e.message}`); });
await page.goto(url);
await page.waitForTimeout(+waitMs);
if (keys) {
  for (const k of keys.split(',')) { await page.keyboard.press(k); await page.waitForTimeout(+keyGap); }
  await page.waitForTimeout(3000);
}
await page.screenshot({ path: out });
console.log(`hash: ${await page.evaluate(() => location.hash)}`);
console.log(`errors: ${errors}`);
await browser.close();
