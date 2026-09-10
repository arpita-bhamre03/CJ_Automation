/**
 * College portal login page.
 *
 * SELECTOR NOTE: the college app is the best-instrumented of the portals - its
 * sign-in screen exposes 163 `data-testid` hooks, unprefixed (login-form,
 * login-email-input, login-submit-btn, ...). Read off the live DEV DOM; the local
 * centrajob_college_frontend checkout is empty, so there is no source to consult.
 *
 * Two things differ from the employer portal:
 *  - the email field is name="userName" and type="text", not type="email"
 *  - the dashboard renders no <header>, so the greeting is the only shell anchor
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { resolvePortalUrl } from '@core/platform/platform';
import { logger } from '@helpers/logger';

export class CollegeLoginPage extends BasePage {
  // ===== LOCATORS =====
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginForm: Locator;
  readonly errorMessage: Locator;
  readonly welcomeHeading: Locator;
  readonly dashboard: Locator;

  /** The portal routes an authenticated user to /dashboard. */
  static readonly DASHBOARD_URL = /\/dashboard\b/;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.getByTestId('login-submit-btn');
    this.loginForm = page.getByTestId('login-form');
    this.errorMessage = page.locator('[role="alert"], p.MuiFormHelperText-root');

    // The dashboard greets the signed-in user. Anchored on the comma so it cannot
    // collide with the sign-in screen's own "Welcome Back" title.
    this.welcomeHeading = page.getByRole('heading', { name: /^Welcome back,/i });
    this.dashboard = this.welcomeHeading;
  }

  // ===== NAVIGATION =====
  /** The portal root redirects to /sign-in. */
  async navigateToLoginPage(): Promise<void> {
    await this.navigateTo(resolvePortalUrl('college'));
  }

  // ===== ACTIONS =====
  async enterCredentials(username: string, password: string): Promise<void> {
    await this.fill(this.emailInput, username);
    await this.fill(this.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.waitForEnabled(this.loginButton);
    await this.click(this.loginButton);
  }

  async login(username: string, password: string): Promise<void> {
    logger.info(`Logging in to college portal as ${username}`);
    await this.enterCredentials(username, password);
    await this.clickLogin();
  }

  async waitForLoginResult(): Promise<void> {
    await this.waitForNetworkIdle();
  }

  /** Wait for the SPA to land on the dashboard route and render the greeting. */
  async waitForDashboard(): Promise<void> {
    await this.waitForUrl(CollegeLoginPage.DASHBOARD_URL);
    await this.waitForVisible(this.dashboard);
  }

  // ===== QUERIES =====
  async isLoginFormDisplayed(): Promise<boolean> {
    return this.isVisible(this.loginForm);
  }

  /** Login succeeded when the credentials form is gone. */
  async isLoginFormDismissed(): Promise<boolean> {
    return this.isHidden(this.loginForm);
  }

  async isDashboardDisplayed(): Promise<boolean> {
    return this.isVisible(this.dashboard);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }
}
