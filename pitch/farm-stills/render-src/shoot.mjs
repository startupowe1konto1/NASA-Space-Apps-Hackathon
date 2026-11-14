// usage: node shoot.mjs <scene> <out.png> [bg=none] [w] [h]
import { createRequire } from 'node:module';
import os from 'node:os';
const require = createRequire(os.homedir() + '/.cache/fun-isometric/');
const { chromium } = require('playwright');
const [scene, out, bg = 'sky', w = '1920', h = '1080'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.log('console error:', m.text()); });
page.on('pageerror', e => console.log('page error:', e.message));
await page.goto(`http://127.0.0.1:8765/scene.html?s=${scene}&bg=${bg}&w=${w}&h=${h}`);
await page.waitForFunction(() => document.title === 'rendered', null, { timeout: 90000 });
await page.screenshot({ path: out, omitBackground: bg === 'none' });
await browser.close();
console.log('ok', out);
