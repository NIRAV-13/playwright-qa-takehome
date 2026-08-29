/**
 * Developer helper — not part of the test suite.
 *
 * Logs in and writes the rendered dashboard markup plus a screenshot to
 * ./artifacts, which makes it quick to confirm the real ids, placeholders and
 * roles when writing or repairing locators.
 *
 *   npm run dump-dom
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL ?? 'https://qa-takehome-app.onrender.com';
const EMAIL = process.env.APP_EMAIL ?? 'admin@test.com';
const PASSWORD = process.env.APP_PASSWORD ?? 'password123';
const OUT_DIR = 'artifacts';

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await mkdir(OUT_DIR, { recursive: true });

  await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await writeFile(`${OUT_DIR}/login.html`, await page.content());
  await page.screenshot({ path: `${OUT_DIR}/login.png`, fullPage: true });

  await page.locator('input[type="email"], #email, input[name="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"], #password').first().fill(PASSWORD);
  await page.locator('button[type="submit"], button').filter({ hasText: /log ?in|sign ?in/i }).first().click();
  await page.waitForLoadState('networkidle');

  await writeFile(`${OUT_DIR}/dashboard.html`, await page.content());
  await page.screenshot({ path: `${OUT_DIR}/dashboard.png`, fullPage: true });

  console.log(`Saved login/dashboard markup and screenshots to ./${OUT_DIR}`);
  console.log(`Dashboard URL: ${page.url()}`);
} finally {
  await browser.close();
}
