import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Text the application renders in place of results when nothing matches. These
 * rows are not products, so they are filtered out of the product list rather
 * than being counted as one result.
 */
const EMPTY_STATE_PATTERN = /^(no |nothing |0 )(products?|results?|items?|matching|found)/i;

/**
 * The Product Inventory dashboard.
 *
 * The product list is matched as either table rows or cards, because both are
 * reasonable renderings of the same concept; whichever the application uses,
 * the union resolves to the same set of products and the tests do not need to
 * care which.
 */
export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productRows: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page
      .getByRole('heading', { name: /product inventory|inventory|dashboard|products/i })
      .first();

    this.searchInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByLabel(/search/i))
      .or(page.locator('#search, #searchInput, input[type="search"], input[name="search"]'))
      .first();

    this.searchButton = page.getByRole('button', { name: /^\s*search\s*$/i });

    /* `:not(:has(th))` drops the header row for tables that declare no <thead>,
       which the browser otherwise folds into <tbody>. */
    this.productRows = page
      .locator('table tbody tr:not(:has(th))')
      .or(page.locator('[data-testid="product-card"], .product-card, .product-item'));

    this.logoutButton = page
      .getByRole('button', { name: /log ?out|sign ?out/i })
      .or(page.getByRole('link', { name: /log ?out|sign ?out/i }))
      .first();
  }

  /**
   * Types into the search box. The dashboard filters as you type; the button
   * click is a safeguard for the case where submission is required, and is
   * skipped when no such button exists.
   */
  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    if ((await this.searchButton.count()) > 0) {
      await this.searchButton.first().click();
    }
  }

  async clearSearch(): Promise<void> {
    await this.search('');
  }

  /**
   * The visible product list as normalised text, one entry per product.
   * Reading the rendered text (rather than a specific cell) keeps the tests
   * working whether products are rendered as table rows or as cards.
   */
  async getProductNames(): Promise<string[]> {
    const rows = await this.productRows.allInnerTexts();
    return rows
      .map((text) => text.replace(/\s+/g, ' ').trim())
      .filter((text) => text.length > 0 && !EMPTY_STATE_PATTERN.test(text));
  }
}
