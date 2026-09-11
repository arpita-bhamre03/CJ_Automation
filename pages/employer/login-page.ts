/**
 * Employer portal login page.
 *
 * SELECTOR NOTE: the deployed DEV app DOES expose `data-testid` hooks - the auth
 * screen carries 47 of them, all prefixed "auth-" (auth-login-email-input,
 * auth-login-submit-button, ...). They are absent from the local
 * centrajob_employer_frontend checkout, which is out of date relative to DEV, so
 * trust the running app over that source tree when adding selectors here.
 *
 * The submit button is disabled until formik considers the form valid, so
 * clickLogin() waits for it to become enabled rather than clicking blindly.
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { resolvePortalUrl } from '@core/platform/platform';
import { logger } from '@helpers/logger';

export class EmployerLoginPage extends BasePage {
  // ===== LOCATORS =====
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly submitButton: Locator;
  readonly loginForm: Locator;
  readonly signUpButton: Locator;
  readonly errorMessage: Locator;
  readonly appHeader: Locator;
  readonly welcomeHeading: Locator;
  readonly dashboard: Locator;

  /**
   * The employer SPA routes an authenticated user to /dashboard, falling back to
   * /empty-dashboard when the company has no data yet. Both mean "logged in".
   * Read from centrajob_employer_frontend/src/routes/PrivateRoutes.tsx.
   */
  static readonly DASHBOARD_URL = /\/(dashboard|empty-dashboard)\b/;

  constructor(page: Page) {
    super(page);

    // These data-testid values are the app's own, read off the live DEV DOM
    // (the employer auth screen exposes 47 of them, all prefixed "auth-").
    this.emailInput = page.getByTestId('auth-login-email-input');
    this.passwordInput = page.getByTestId('auth-login-password-input');
    this.loginButton = page.getByTestId('auth-login-submit-button');
    this.submitButton = page.locator('button[type="submit"]');
    this.loginForm = page.getByTestId('auth-login-form');
    this.signUpButton = page.getByTestId('auth-login-signup-button');
    this.errorMessage = page.locator(
      '[data-qa-id="error-message"], [role="alert"], .error-message, [data-testid="error-message"]',
    );
    // The authenticated shell (MainLayout -> Header -> MUI AppBar) renders a
    // single <header> on every signed-in page, which is also the banner landmark.
    this.appHeader = page.locator('[data-qa-id="app-header"]').or(page.getByRole('banner'));

    // The dashboard greets the signed-in user. Anchored on the comma so it cannot
    // collide with the login screen's own "Welcome Back" title, and falling back
    // to the app shell for accounts that render no greeting.
    //
    // .first() is required, not cosmetic: once the page has fully rendered, the
    // greeting and the header are both present, so the .or() chain matches two
    // elements and waitFor() fails strict mode. Without it this passes or fails
    // depending on render timing.
    this.welcomeHeading = page.getByRole('heading', { name: /^Welcome back,/i });
    this.dashboard = page
      .locator('[data-qa-id="employer-dashboard"], [data-testid="dashboard"]')
      .or(this.welcomeHeading)
      .or(this.appHeader)
      .first();
  }

  // ===== NAVIGATION =====
  async navigateToLoginPage(): Promise<void> {
    await this.navigateTo(resolvePortalUrl('employer'));
  }

  // ===== ACTIONS =====
  async enterCredentials(username: string, password: string): Promise<void> {
    await this.fill(this.emailInput, username);
    await this.fill(this.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    // Gated on formik validity - wait for it to enable so a validation failure
    // reports as such instead of as a generic click timeout.
    await this.waitForEnabled(this.loginButton);
    await this.click(this.loginButton);
  }

  /** "Don't have an account? Sign Up" - opens /auth/register. */
  async clickSignUp(): Promise<void> {
    await this.click(this.signUpButton);
  }

  async login(username: string, password: string): Promise<void> {
    logger.info(`Logging in to employer portal as ${username}`);
    await this.enterCredentials(username, password);
    await this.clickLogin();
  }

  async waitForLoginResult(): Promise<void> {
    await this.waitForNetworkIdle();
  }

  /** Wait for the SPA to land on the dashboard route and render the app shell. */
  async waitForDashboard(): Promise<void> {
    await this.waitForUrl(EmployerLoginPage.DASHBOARD_URL);
    await this.waitForVisible(this.dashboard);
  }

  // ===== QUERIES =====
  /** Renamed from verifyLoginFormDisplayed() - query methods use the is- prefix. */
  async isLoginFormDisplayed(): Promise<boolean> {
    return this.isVisible(this.loginForm);
  }

  /**
   * Login succeeded when the credentials form is gone. Checked instead of a URL
   * match so this stays true regardless of which post-login route the app picks.
   */
  async isLoginFormDismissed(): Promise<boolean> {
    return this.isHidden(this.loginForm);
  }

  async isDashboardDisplayed(): Promise<boolean> {
    return this.isVisible(this.dashboard);
  }

  /** The dashboard greeting, e.g. "Welcome back, Diya Sharma". */
  async getWelcomeMessage(): Promise<string> {
    return (await this.getText(this.welcomeHeading)).trim();
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }
}
