import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VALID_USER } from '../data/users';

interface PageObjectFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  /**
   * A dashboard that is already authenticated. Tests that are about a feature
   * rather than about logging in take this fixture, so the login steps do not
   * have to be repeated (and re-asserted) in every spec.
   */
  authenticatedDashboard: DashboardPage;
}

export const test = base.extend<PageObjectFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  authenticatedDashboard: async ({ loginPage, dashboardPage }, use) => {
    await loginPage.open();
    await loginPage.login(VALID_USER);
    await dashboardPage.productRows.first().waitFor({ state: 'visible' });
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';
