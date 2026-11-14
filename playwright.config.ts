import { defineConfig } from '@playwright/test';

// e2e runs on O1's laptop only (CLAUDE.md), against a local dev server on port 5171 or,
// with E2E_BASE_URL set, against the production URL.
// Playwright 1.63+ ships no Chromium for macOS 13, so the default channel is the system Chrome.
// Set PW_CHANNEL=chromium where Playwright's own browser is installed.
const port = 5171;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
const channel = process.env.PW_CHANNEL === 'chromium' ? undefined : (process.env.PW_CHANNEL ?? 'chrome');

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    channel,
    viewport: { width: 400, height: 820 },
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
