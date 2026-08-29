import type { Page } from '@playwright/test';

/**
 * Shared behaviour for every page object. Page objects expose intent-revealing
 * actions and locators; they never contain assertions about business outcomes,
 * which belong in the specs.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /** Navigates to a path relative to `baseURL` from the Playwright config. */
  protected async navigate(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }
}
