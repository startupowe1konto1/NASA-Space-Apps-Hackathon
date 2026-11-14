// Exports the deck: seven stills (assets/stills/01.png ... 07.png) and a seven-page PDF (pitch/out/deck.pdf).
// Run from pitch/deck: npm run pdf            (fails if slide 6 has missing app screenshots)
//                      npm run pdf -- --allow-missing   (rehearsal: that one check becomes a warning)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DECK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(DECK, '..', 'out');
const STILLS = path.join(DECK, 'assets', 'stills');
const PDF_PATH = path.join(OUT, 'deck.pdf');
const SLIDES = 7;
const allowMissing = process.argv.includes('--allow-missing');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

const LAUNCH = { channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] };
const VIEWPORT = { width: 1920, height: 1080 };

/** Static server for pitch/deck on a free port, no caching, so every run reads the files as they are now. */
function startServer() {
  const server = http.createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(DECK, '.' + rel);
    if (!file.startsWith(DECK + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Cache-Control': 'no-store' }).end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/** Opens one slide in print mode, waits for the scene, screenshots it. Returns the list of failures. */
async function captureSlide(context, base, n, failures, warnings) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console error: ${m.text()}`);
    else if (m.type() === 'warning') warnings.push(`slide ${n}: console warning: ${m.text()}`);
  });
  try {
    await page.goto(`${base}?print=1#${n}.0`, { waitUntil: 'load' });
    await page.waitForSelector('#stage[data-ready="1"]', { timeout: 60000 });
    await page.waitForTimeout(2500);
    const fonts = await page.evaluate(() => document.fonts.status);
    if (fonts !== 'loaded') errors.push(`fonts status is "${fonts}", expected "loaded"`);
    if (n === 6) {
      const missing = await page.evaluate(() =>
        Number(document.querySelector('.slide[data-slide="6"]')?.dataset.missing ?? 0));
      if (missing > 0) {
        const msg = `${missing} app screenshots missing (run P8 first)`;
        if (allowMissing) warnings.push(`slide 6: ${msg} (allowed by --allow-missing)`);
        else errors.push(msg);
      }
    }
    await page.screenshot({ path: path.join(STILLS, `0${n}.png`) });
    console.log(`slide ${n}: captured ${path.relative(DECK, path.join(STILLS, `0${n}.png`))}`);
  } catch (err) {
    errors.push(`capture failed: ${String(err.message).split('\n')[0]}`);
  } finally {
    await page.close();
  }
  for (const e of errors) failures.push(`slide ${n}: ${e}`);
}

// Runs in the page: decodes a PNG and counts distinct colours at 400 random points.
async function sampleStill(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const x = Math.floor(Math.random() * c.width);
    const y = Math.floor(Math.random() * c.height);
    seen.add(ctx.getImageData(x, y, 1, 1).data.join(','));
  }
  return { width: c.width, height: c.height, distinct: seen.size };
}

async function main() {
  fs.mkdirSync(STILLS, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch(LAUNCH);
  const failures = [];
  const warnings = [];
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });

    for (let n = 1; n <= SLIDES; n++) await captureSlide(context, base, n, failures, warnings);
    const stills = Array.from({ length: SLIDES }, (_, i) => path.join(STILLS, `0${i + 1}.png`));
    if (failures.length) return finish(failures, warnings);

    // Build the PDF: one 1920 x 1080 page per still.
    const dataUrls = stills.map((p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64'));
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 1920px 1080px; margin: 0 }
html, body { margin: 0; padding: 0; background: #000 }
.page { width: 1920px; height: 1080px; overflow: hidden; break-after: page; page-break-after: always }
.page:last-child { break-after: auto; page-break-after: auto }
.page img { display: block; width: 1920px; height: 1080px }
</style></head><body>${dataUrls.map((u) => `<div class="page"><img alt="" src="${u}"></div>`).join('')}</body></html>`;
    const work = await context.newPage();
    await work.setContent(html, { waitUntil: 'load' });
    await work.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    const pdf = await work.pdf({
      width: '1920px',
      height: '1080px',
      printBackground: true,
      pageRanges: '',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    fs.writeFileSync(PDF_PATH, pdf);

    // Verify: exactly seven page objects, and no blank still.
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) || []).length;
    if (pages !== SLIDES) failures.push(`PDF has ${pages} pages, expected ${SLIDES}`);
    for (const p of stills) {
      const r = await work.evaluate(sampleStill, 'data:image/png;base64,' + fs.readFileSync(p).toString('base64'));
      if (r.distinct < 2) failures.push(`${path.basename(p)} is blank (all 400 samples one colour)`);
      else if (r.width !== VIEWPORT.width || r.height !== VIEWPORT.height)
        failures.push(`${path.basename(p)} is ${r.width}x${r.height}, expected 1920x1080`);
    }
    await work.close();

    const mb = (fs.statSync(PDF_PATH).size / 1048576).toFixed(2);
    console.log(`PDF: ${path.relative(DECK, PDF_PATH)}`);
    console.log(`pages: ${pages}`);
    console.log(`size: ${mb} MB`);
    console.log('stills:');
    for (const p of stills) console.log(`  ${p}`);
  } finally {
    await browser.close();
    server.close();
  }
  return finish(failures, warnings);
}

function finish(failures, warnings) {
  for (const w of warnings) console.warn(`warning: ${w}`);
  if (failures.length) {
    for (const f of failures) console.error(`FAIL ${f}`);
    process.exitCode = 1;
  } else {
    console.log('OK');
  }
}

main().catch((err) => {
  console.error(`FAIL ${err.message}`);
  process.exitCode = 1;
});
