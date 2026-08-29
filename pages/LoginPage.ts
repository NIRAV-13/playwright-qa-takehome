import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { Credentials } from '../data/users';

/**
 * The login screen.
 *
 * The application ships no `data-testid` attributes, so locators are built from
 * user-visible semantics first (label, placeholder, accessible role) and fall
 * back to the element id. `.or()` keeps a single locator resilient to whichever
 * of those the markup actually exposes, without resorting to brittle CSS or
 * XPath paths that break the moment the layout changes.
 */
export class LoginPage extends BasePage {
  static readonly PATH = '/index.html';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page
      .getByLabel(/e-?mail/i)
      .or(page.getByPlaceholder(/e-?mail/i))
      .or(page.locator('#email, input[type="email"], input[name="email"]'))
      .first();

    this.passwordInput = page
      .getByLabel(/password/i)
      .or(page.getByPlaceholder(/password/i))
      .or(page.locator('#password, input[type="password"], input[name="password"]'))
      .first();

    this.loginButton = page
      .getByRole('button', { name: /log ?in|sign ?in|submit/i })
      .or(page.locator('button[type="submit"], input[type="submit"]'))
      .first();
  }

  async open(): Promise<void> {
    await this.navigate(LoginPage.PATH);
  }

  /**
   * Fills the credentials and submits. Playwright's auto-waiting covers the
   * form becoming interactive, so no explicit sleeps are needed.
   */
  async login({ email, password }: Credentials): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
