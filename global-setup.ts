import { request, type FullConfig } from '@playwright/test';

const WAKE_UP_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 5_000;

/**
 * The application is deployed on a free Render instance which spins down when
 * idle. The first request after a cold start can take close to a minute, which
 * would otherwise show up as a flaky failure in whichever test happened to run
 * first. This setup absorbs that cost once, before any test starts.
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) return;

  const context = await request.newContext({ ignoreHTTPSErrors: true });
  const deadline = Date.now() + WAKE_UP_TIMEOUT_MS;
  let lastError = 'no response';

  try {
    while (Date.now() < deadline) {
      try {
        const response = await context.get(baseURL, { timeout: 30_000 });
        if (response.ok()) {
          console.log(`[global-setup] ${baseURL} is awake (${response.status()}).`);
          return;
        }
        lastError = `HTTP ${response.status()}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(
      `[global-setup] ${baseURL} did not respond within ${WAKE_UP_TIMEOUT_MS / 1000}s. Last error: ${lastError}`,
    );
  } finally {
    await context.dispose();
  }
}

export default globalSetup;
