/**
 * Employer portal sign-up, stage 1/3: registration form -> "Verify Your Email" ->
 * set password. Setting the password creates the account and signs the new user
 * in, landing on stage 2/3 (see company-details-page.ts).
 *
 * Screens and hooks, read off the live DEV app (DOM and deployed bundle):
 *   /auth/register            auth-register-*        step badge "1/3"
 *   /auth/verification-code   auth-otp-*             boxes auth-otp-digit-1..6-input
 *   /auth/set-password        auth-set-password-*
 *
 * "Get Started" stays disabled until the terms box is ticked. It then checks the
 * mobile number and both emails are not already registered, and emails a code to
 * the official (admin) email.
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { resolvePortalUrl } from '@core/platform/platform';
import { logger } from '@helpers/logger';

/** The fields on the registration form. */
export interface EmployerRegistrationDetails {
  fullName: string;
  companyName: string;
  mobileNumber: string;
  companyEmail: string;
  adminEmail: string;
}

export class EmployerSignUpPage extends BasePage {
  // ===== LOCATORS: registration form =====
  readonly registerForm: Locator;
  readonly registerTitle: Locator;
  readonly registerStepBadge: Locator;
  readonly fullNameInput: Locator;
  readonly companyNameInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly companyEmailInput: Locator;
  readonly adminEmailInput: Locator;
  readonly termsCheckbox: Locator;
  readonly getStartedButton: Locator;

  // ===== LOCATORS: verify your email =====
  readonly verifyEmailForm: Locator;
  readonly verifyEmailTitle: Locator;
  readonly verifyEmailAddress: Locator;
  readonly verificationSubmitButton: Locator;

  // ===== LOCATORS: set password =====
  readonly setPasswordForm: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly setPasswordButton: Locator;

  static readonly VERIFY_EMAIL_URL = /\/auth\/verification-code\b/;
  static readonly SET_PASSWORD_URL = /\/auth\/set-password\b/;

  constructor(page: Page) {
    super(page);

    this.registerForm = page.getByTestId('auth-register-form');
    this.registerTitle = page.getByTestId('auth-register-title');
    this.registerStepBadge = page.getByTestId('auth-register-step-badge');
    this.fullNameInput = page.getByTestId('auth-register-full-name-input');
    this.companyNameInput = page.getByTestId('auth-register-company-name-input');
    this.mobileNumberInput = page.getByTestId('auth-register-mobile-number-input');
    this.companyEmailInput = page.getByTestId('auth-register-company-email-input');
    this.adminEmailInput = page.getByTestId('auth-register-admin-email-input');
    this.termsCheckbox = page.getByTestId('auth-register-terms-checkbox');
    this.getStartedButton = page.getByTestId('auth-register-submit-button');

    this.verifyEmailForm = page.getByTestId('auth-otp-form');
    this.verifyEmailTitle = page.getByTestId('auth-otp-title');
    this.verifyEmailAddress = page.getByTestId('auth-otp-email');
    this.verificationSubmitButton = page.getByTestId('auth-otp-submit-button');

    this.setPasswordForm = page.getByTestId('auth-set-password-form');
    this.passwordInput = page.getByTestId('auth-set-password-password-input');
    this.confirmPasswordInput = page.getByTestId('auth-set-password-confirm-password-input');
    this.setPasswordButton = page.getByTestId('auth-set-password-submit-button');
  }

  /** One of the six code boxes, numbered 1-6 as the app numbers them. */
  private codeDigitInput(position: number): Locator {
    return this.page.getByTestId(`auth-otp-digit-${position}-input`);
  }

  // ===== NAVIGATION =====
  /** Direct route to the form; the spec reaches it from the login page instead. */
  async navigateToSignUpPage(): Promise<void> {
    await this.navigateTo(`${resolvePortalUrl('employer')}/auth/register`);
    await this.waitForVisible(this.registerForm);
  }

  // ===== ACTIONS: registration =====
  async fillRegistrationDetails(details: EmployerRegistrationDetails): Promise<void> {
    logger.info(`Registering employer ${details.adminEmail}`);
    await this.fill(this.fullNameInput, details.fullName);
    await this.fill(this.companyNameInput, details.companyName);
    await this.fill(this.mobileNumberInput, details.mobileNumber);
    await this.fill(this.companyEmailInput, details.companyEmail);
    await this.fill(this.adminEmailInput, details.adminEmail);
  }

  async acceptTerms(): Promise<void> {
    await this.termsCheckbox.check();
  }

  async clickGetStarted(): Promise<void> {
    await this.waitForEnabled(this.getStartedButton);
    await this.click(this.getStartedButton);
  }

  // ===== ACTIONS: verify your email =====
  async waitForVerifyEmailScreen(): Promise<void> {
    await this.waitForUrl(EmployerSignUpPage.VERIFY_EMAIL_URL);
    await this.waitForVisible(this.verifyEmailForm);
  }

  /** Enter the code one digit per box; each box advances focus to the next. */
  async enterVerificationCode(code: string): Promise<void> {
    logger.info('Entering the emailed verification code');
    const digits = code.split('');
    for (let i = 0; i < digits.length; i++) {
      await this.fill(this.codeDigitInput(i + 1), digits[i]);
    }
  }

  async submitVerificationCode(): Promise<void> {
    await this.waitForEnabled(this.verificationSubmitButton);
    await this.click(this.verificationSubmitButton);
  }

  // ===== ACTIONS: set password =====
  async waitForSetPasswordScreen(): Promise<void> {
    await this.waitForUrl(EmployerSignUpPage.SET_PASSWORD_URL);
    await this.waitForVisible(this.setPasswordForm);
  }

  /** Enter and confirm the password, then submit - this creates the account. */
  async setPassword(password: string): Promise<void> {
    await this.fill(this.passwordInput, password);
    await this.fill(this.confirmPasswordInput, password);
    await this.waitForEnabled(this.setPasswordButton);
    await this.click(this.setPasswordButton);
  }

  // ===== QUERIES =====
  async isRegisterFormDisplayed(): Promise<boolean> {
    return this.isVisible(this.registerForm);
  }

  async getRegisterTitle(): Promise<string> {
    return (await this.getText(this.registerTitle)).trim();
  }

  async getRegisterStepBadge(): Promise<string> {
    return (await this.getText(this.registerStepBadge)).trim();
  }

  async getVerifyEmailTitle(): Promise<string> {
    return (await this.getText(this.verifyEmailTitle)).trim();
  }

  /** The address the code was sent to, as shown on "Verify Your Email". */
  async getVerificationEmailAddress(): Promise<string> {
    return (await this.getText(this.verifyEmailAddress)).trim();
  }
}
