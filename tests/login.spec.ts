import { test, expect } from '../fixtures/pages';
import { VALID_USER, INVALID_USER } from '../data/users';

test.describe('Login', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('valid credentials take the user to the product inventory dashboard', async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.login(VALID_USER);

    // The user has left the login screen...
    await expect(loginPage.loginButton).toBeHidden();

    // ...and the dashboard, with its key content, has actually rendered.
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.searchInput).toBeVisible();
    await expect(dashboardPage.logoutButton).toBeVisible();
    await expect(dashboardPage.productRows.first()).toBeVisible();

    const products = await dashboardPage.getProductNames();
    expect(products.length, 'the inventory should load with at least one product').toBeGreaterThan(0);
  });

  test('invalid credentials do not grant access to the dashboard', async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.login(INVALID_USER);

    /* The assertion deliberately targets the security invariant — access is
       refused — rather than the wording of any error banner, so the test does
       not break when copy changes. The quality of the error feedback itself is
       covered by exploratory testing (see BUG_REPORT.md). */
    await expect(loginPage.loginButton).toBeVisible();
    await expect(dashboardPage.logoutButton).toBeHidden();
    await expect(dashboardPage.productRows).toHaveCount(0);
  });
});
