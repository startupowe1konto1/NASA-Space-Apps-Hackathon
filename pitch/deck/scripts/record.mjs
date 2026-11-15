// Backup video: plays the whole deck with fixed delays and records it to pitch/out/deck.webm.
// Run from pitch/deck: npm run record
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DECK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(DECK, '..', 'out');
const DEST = path.join(OUT, 'deck.webm');
const VIEWPORT = { width: 1920, height: 1080 };
const LAUNCH = { channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] };

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

/** Static server for pitch/deck on a free port, no caching. */
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

/** "#3.1" -> { slide: 3, step: 1 } */
function parse(hash) {
  const m = /^#(\d+)\.(\d+)$/.exec(hash);
  return m ? { slide: Number(m[1]), step: Number(m[2]) } : { slide: 0, step: 0 };
}

/** How long to hold after a press has finished playing, so the viewer can read the result (ms). */
function holdAfter(before, after) {
  if (after.slide !== before.slide) return 3000;   // a whole slide
  return 2500;                                     // one app screenshot on the slide with manual steps
}

function videoSeconds(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
      '-of', 'csv=p=0', file], { encoding: 'utf8' });
    return Number(out.trim()).toFixed(1);
  } catch {
    return null;
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch(LAUNCH);
  const videoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'field-shift-deck-video-'));
  const failures = [];
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      recordVideo: { dir: videoDir, size: { width: 1920, height: 1080 } },
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => failures.push(`page error: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') failures.push(`console error: ${m.text()}`);
    });

    await page.goto(`${base}#1.0`, { waitUntil: 'load' });
    await page.waitForSelector('#stage[data-ready="1"]', { timeout: 60000 });
    await page.waitForTimeout(2000);

    const LAST = `#${await page.evaluate(() => document.getElementById('stage').dataset.count)}.0`;
    const started = Date.now();
    let hash = await page.evaluate(() => location.hash);
    for (let i = 0; hash !== LAST; i++) {
      if (i >= 60) throw new Error(`did not reach ${LAST}, stuck at ${hash}`);
      const before = parse(hash);
      await page.keyboard.press('ArrowRight');
      hash = await page.evaluate(() => location.hash);
      const after = parse(hash);
      // One press plays a whole slide: wait until it has finished, then hold so the viewer can read it.
      await page.waitForTimeout(300);
      await page.waitForFunction(() => !window.deckBusy(), null, { timeout: 60000, polling: 200 });
      const hold = holdAfter(before, after);
      console.log(`${before.slide}.${before.step} -> ${after.slide}.${after.step}  hold ${hold} ms after the slide finished`);
      await page.waitForTimeout(hold);
      hash = await page.evaluate(() => location.hash);
    }
    await page.waitForTimeout(4000);
    const elapsed = (Date.now() - started) / 1000;

    const video = page.video();
    await page.close();
    await context.close();
    const src = await video.path();
    fs.copyFileSync(src, DEST);
    fs.rmSync(src, { force: true });

    const mb = (fs.statSync(DEST).size / 1048576).toFixed(2);
    const probed = videoSeconds(DEST);
    console.log(`video: ${path.relative(DECK, DEST)}`);
    console.log(`scripted playback: ${elapsed.toFixed(1)} s, slide 1 to the last slide`);
    console.log(`file duration: ${probed ? probed + ' s (ffprobe)' : 'not measured (ffprobe not found)'}, including load time before slide 1`);
    console.log(`size: ${mb} MB`);
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(videoDir, { recursive: true, force: true });
  }
  for (const f of failures) console.error(`FAIL ${f}`);
  if (failures.length) process.exitCode = 1;
  else console.log('OK');
}

main().catch((err) => {
  console.error(`FAIL ${err.message}`);
  process.exitCode = 1;
});
