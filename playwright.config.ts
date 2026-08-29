import { defineConfig, devices } from '@playwright/test';

/**
 * The application under test is hosted on a free Render instance, which is slow
 * to respond after it has been idle. Timeouts are therefore deliberately
 * generous, and `global-setup.ts` wakes the instance before the suite starts.
 */
const BASE_URL = process.env.BASE_URL ?? 'https://qa-takehome-app.onrender.com';

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',

  /* Fail the build on a stray test.only committed by mistake. */
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  /* list = readable console output, html = the report a reviewer opens,
     junit = machine-readable output for CI dashboards. */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: BASE_URL,
    /* Evidence is captured only when something goes wrong, so passing runs
       stay fast and the report stays small. */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
