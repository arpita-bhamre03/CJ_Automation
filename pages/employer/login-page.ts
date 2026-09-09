/**
 * Employer portal login page.
 *
 * Selector note: see pages/candidate/login-page.ts. The `placeholder="Enter your email"`
 * / `name="email"` / `type="submit"` selectors below were read directly from
 * centrajob_employer_frontend/src/modules/Auth/pages/LoginPage.tsx.
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
  readonly errorMessage: Locator;
  readonly dashboard: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator(
      [
        '[data-qa-id="employer-email-input"]',
        '[data-testid="email-input"]',
        'input[placeholder="Enter your email"]',
        'input[type="email"]',
        'input[name="email"]',
      ].join(', '),
    );
    this.passwordInput = page.locator(
      [
        '[data-qa-id="employer-password-input"]',
        '[data-testid="password-input"]',
        'input[placeholder="Enter your password"]',
        'input[type="password"]',
        'input[name="password"]',
      ].join(', '),
    );
    this.loginButton = page.locator(
      '[data-qa-id="employer-login-button"], [data-testid="login-button"], button:has-text("Login")',
    );
    this.submitButton = page.locator('button[type="submit"]');
    this.loginForm = page.locator('[data-qa-id="login-form"], form, [data-testid="login-form"]');
    this.errorMessage = page.locator(
      '[data-qa-id="error-message"], [role="alert"], .error-message, [data-testid="error-message"]',
    );
    this.dashboard = page.locator(
      '[data-qa-id="employer-dashboard"], [data-testid="dashboard"], h1:has-text("Dashboard")',
    );
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
    await this.click(this.loginButton.or(this.submitButton));
  }

  async login(username: string, password: string): Promise<void> {
    logger.info(`Logging in to employer portal as ${username}`);
    await this.enterCredentials(username, password);
    await this.clickLogin();
  }

  async waitForLoginResult(): Promise<void> {
    await this.waitForNetworkIdle();
  }

  // ===== QUERIES =====
  /** Renamed from verifyLoginFormDisplayed() - query methods use the is- prefix. */
  async isLoginFormDisplayed(): Promise<boolean> {
    return this.isVisible(this.loginForm);
  }

  async isDashboardDisplayed(): Promise<boolean> {
    return this.isVisible(this.dashboard);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }
}
