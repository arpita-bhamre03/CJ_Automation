/**
 * Admin panel (control panel) login page, including the emailed-code (MFA) step.
 *
 * SELECTOR NOTE: unlike the other portals, the admin panel exposes no
 * `data-testid` at all. It uses element ids instead, prefixed by screen:
 * `#Login_*` on sign-in, `#Mfa_*` on the verification-code screen, and
 * `#Dashboard_*` / `#Sidebar_menu_*` once signed in. Read off the live DEV DOM
 * and the deployed bundle.
 *
 * READONLY FIELDS: the email input is rendered `readonly` until it receives focus
 * (an anti-autofill technique). Playwright will not type into a readonly field,
 * so enterCredentials() clicks each field before filling it.
 *
 * MFA: after Sign in the panel routes to /verify-code ("Verify it's you") only when
 * the Firebase Remote Config flag `enableMFA` is true, otherwise straight to
 * /dashboard. The code screen is six single-digit boxes, and entering the sixth
 * digit submits automatically.
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { resolvePortalUrl } from '@core/platform/platform';
import { logger } from '@helpers/logger';

export type AdminSignInOutcome = 'mfa' | 'dashboard';

export class AdminLoginPage extends BasePage {
  // ===== LOCATORS: sign-in =====
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginForm: Locator;
  readonly errorMessage: Locator;

  // ===== LOCATORS: verification code (MFA) =====
  readonly mfaForm: Locator;
  readonly otpBoxes: Locator;
  readonly verifyButton: Locator;
  readonly resendButton: Locator;
  readonly cancelButton: Locator;
  readonly mfaSentTo: Locator;
  readonly mfaError: Locator;

  // ===== LOCATORS: signed in =====
  readonly sidebar: Locator;
  readonly dashboard: Locator;

  static readonly VERIFY_CODE_URL = /\/verify-code\b/;
  static readonly DASHBOARD_URL = /\/dashboard\b/;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('#Login_email_input');
    this.passwordInput = page.locator('#Login_password_input');
    this.loginButton = page.locator('#Login_submit');
    // The form has no id of its own; identify it as the one holding the submit button.
    this.loginForm = page.locator('form').filter({ has: this.loginButton });
    this.errorMessage = page.locator('[role="alert"], .MuiFormHelperText-root');

    this.mfaForm = page.locator('#Mfa_form');
    this.otpBoxes = page.locator('#Mfa_otp input');
    this.verifyButton = page.locator('#Mfa_verify');
    this.resendButton = page.locator('#Mfa_resend');
    this.cancelButton = page.locator('#Mfa_cancel');
    // "Sent to ad************b@yopmail.com" - the masked address is in a <strong>.
    this.mfaSentTo = this.mfaForm.locator('.auth-sent-to strong');
    this.mfaError = this.mfaForm.locator('.auth-error');

    // The sidebar's Dashboard entry is present on every signed-in page.
    this.sidebar = page.locator('#Sidebar_menu_Dashboard');
    // The dashboard page's own title. Exact match, so it cannot pick up other
    // headings that merely contain the word.
    this.dashboard = page.getByRole('heading', { name: 'Dashboard', exact: true });
  }

  // ===== NAVIGATION =====
  /** The configured admin URL is a signed-in route; unauthenticated, it redirects to /login. */
  async navigateToLoginPage(): Promise<void> {
    await this.navigateTo(resolvePortalUrl('admin'));
  }

  // ===== ACTIONS: sign-in =====
  async enterCredentials(username: string, password: string): Promise<void> {
    // Click first: the fields are readonly until focused.
    await this.click(this.emailInput);
    await this.fill(this.emailInput, username);
    await this.click(this.passwordInput);
    await this.fill(this.passwordInput, password);
  }

  async clickLogin(): Promise<void> {
    await this.waitForEnabled(this.loginButton);
    await this.click(this.loginButton);
  }

  async login(username: string, password: string): Promise<void> {
    logger.info(`Logging in to admin panel as ${username}`);
    await this.enterCredentials(username, password);
    await this.clickLogin();
  }

  async waitForLoginResult(): Promise<void> {
    await this.waitForNetworkIdle();
  }

  /** After Sign in: 'mfa' if the panel asks for a code, 'dashboard' if it does not. */
  async waitForSignInOutcome(): Promise<AdminSignInOutcome> {
    await this.waitForUrl(/\/(verify-code|dashboard)\b/);
    return AdminLoginPage.VERIFY_CODE_URL.test(new URL(this.page.url()).pathname)
      ? 'mfa'
      : 'dashboard';
  }

  // ===== ACTIONS: verification code =====
  /** Enter the code one digit per box; each box advances focus to the next. */
  async enterVerificationCode(code: string): Promise<void> {
    logger.info('Entering the emailed verification code');
    await this.waitForVisible(this.otpBoxes.first());
    const digits = code.split('');
    for (let i = 0; i < digits.length; i++) {
      await this.fill(this.otpBoxes.nth(i), digits[i]);
    }
  }

  /**
   * Entering the sixth digit already submits the code. Click "Verify and sign in"
   * only if that did not happen, so the code is never submitted twice.
   */
  async submitVerificationCode(): Promise<void> {
    const autoSubmitted = await this.page
      .waitForURL((url) => !AdminLoginPage.VERIFY_CODE_URL.test(url.pathname), { timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (autoSubmitted) return;

    if (await this.verifyButton.isEnabled()) {
      await this.click(this.verifyButton);
    }
  }

  /** Wait for the SPA to land on the dashboard route and render its title. */
  async waitForDashboard(): Promise<void> {
    await this.waitForUrl(AdminLoginPage.DASHBOARD_URL);
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

  async isMfaScreenDisplayed(): Promise<boolean> {
    return this.isVisible(this.mfaForm);
  }

  /** The masked address the code was sent to, e.g. "ad************b@yopmail.com". */
  async getMfaSentTo(): Promise<string> {
    return (await this.getText(this.mfaSentTo)).trim();
  }

  /** Short wait: after a correct code the screen has already gone. */
  async isMfaErrorDisplayed(): Promise<boolean> {
    return this.isVisible(this.mfaError, 1_000);
  }

  async getMfaErrorMessage(): Promise<string> {
    return this.getText(this.mfaError);
  }

  async isDashboardDisplayed(): Promise<boolean> {
    return this.isVisible(this.dashboard);
  }

  async isSidebarDisplayed(): Promise<boolean> {
    return this.isVisible(this.sidebar);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.errorMessage);
  }
}
