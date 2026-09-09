/**
 * Candidate portal login page.
 *
 * SELECTOR NOTE - read before editing:
 * The CentraJob React apps currently expose neither `data-qa-id` nor `data-testid`
 * (verified: 0 occurrences of either in centrajob_employer_frontend/src). Until the
 * frontend team adds them, the primary selectors below are the stable, real
 * attributes rendered by the app - placeholder text, `name`, and `type=submit` -
 * with the `data-*` hooks kept first in each chain so that adding them later makes
 * these locators tighten automatically with no code change here.
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { resolvePortalUrl } from '@core/platform/platform';
import { logger } from '@helpers/logger';

export class CandidateLoginPage extends BasePage {
  // ===== LOCATORS =====
  readonly signInButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.signInButton = page.getByText('Sign In', { exact: true }).first();
    this.emailInput = page.locator(
      [
        '[data-qa-id="email-input"]',
        '[data-testid="email-input"]',
        'input[placeholder="Enter your email"]',
        'input[type="email"]',
        'input[name="email"]',
        'input[autocomplete="email"]',
      ].join(', '),
    );
    this.passwordInput = page.locator(
      [
        '[data-qa-id="password-input"]',
        '[data-testid="password-input"]',
        'input[placeholder="Enter your password"]',
        'input[type="password"]',
        'input[name="password"]',
        'input[autocomplete="current-password"]',
      ].join(', '),
    );
    this.loginButton = page.getByText('Sign In', { exact: true }).last();
    this.submitButton = page.locator('button[type="submit"], [type="submit"]');
    this.errorMessage = page.locator(
      '[data-qa-id="error-message"], [role="alert"], .error-message, [data-testid="error-message"]',
    );
  }

  // ===== NAVIGATION =====
  async navigateToLoginPage(): Promise<void> {
    await this.navigateTo(resolvePortalUrl('candidate'));
  }

  // ===== ACTIONS =====
  async openLoginScreen(): Promise<void> {
    await this.click(this.signInButton);
  }

  async enterEmail(email: string): Promise<void> {
    await this.fill(this.emailInput, email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.fill(this.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.click(this.loginButton.or(this.submitButton));
  }

  /** Full login flow, preserved from the pre-migration implementation. */
  async login(username: string, password: string): Promise<void> {
    logger.info(`Logging in to candidate portal as ${username}`);
    await this.openLoginScreen();
    await this.enterEmail(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  // ===== QUERIES =====
  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async isErrorMessageDisplayed(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }
}
