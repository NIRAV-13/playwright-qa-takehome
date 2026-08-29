import { test, expect } from '../fixtures/pages';

/** A term chosen to match nothing in any realistic product catalogue. */
const UNMATCHABLE_TERM = 'zzqx-no-such-product';

/** Takes a searchable token from a rendered product row. */
function firstWordOf(rowText: string): string {
  return rowText.split(/\s+/)[0] ?? '';
}

test.describe('Product search', () => {
  test('narrows the inventory to products matching the search term', async ({
    authenticatedDashboard: dashboard,
  }, testInfo) => {
    const allProducts = await dashboard.getProductNames();
    expect(allProducts.length, 'precondition: the inventory is not empty').toBeGreaterThan(0);

    /* The search term is derived from the catalogue at runtime instead of being
       hard-coded, so the test keeps working if the seed data changes. */
    const term = firstWordOf(allProducts[0]);
    expect(term.length, 'precondition: a usable search term was found').toBeGreaterThan(0);
    testInfo.annotations.push({ type: 'search term', description: term });

    await dashboard.search(term);

    /* Filtering happens client-side as you type, so poll the rendered list
       until it settles rather than asserting on a single snapshot. */
    await expect
      .poll(async () => {
        const results = await dashboard.getProductNames();
        return results.length > 0 && results.every((row) => row.toLowerCase().includes(term.toLowerCase()));
      }, { message: `every visible product should match "${term}"` })
      .toBe(true);

    const results = await dashboard.getProductNames();
    expect(results.length, 'a filter should never return more rows than the full list').toBeLessThanOrEqual(
      allProducts.length,
    );
  });

  test('shows no products when the search term matches nothing', async ({
    authenticatedDashboard: dashboard,
  }) => {
    await dashboard.search(UNMATCHABLE_TERM);

    await expect
      .poll(() => dashboard.getProductNames(), {
        message: `"${UNMATCHABLE_TERM}" should filter the inventory down to nothing`,
      })
      .toEqual([]);
  });

  test('restores the full inventory when the search is cleared', async ({
    authenticatedDashboard: dashboard,
  }) => {
    const allProducts = await dashboard.getProductNames();

    await dashboard.search(UNMATCHABLE_TERM);
    await expect.poll(() => dashboard.getProductNames()).toEqual([]);

    await dashboard.clearSearch();

    await expect
      .poll(() => dashboard.getProductNames(), {
        message: 'clearing the search should bring back every product',
      })
      .toEqual(allProducts);
  });
});
