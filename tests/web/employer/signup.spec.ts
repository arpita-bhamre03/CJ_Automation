/**
 * Employer portal sign-up.
 *
 * Creates a brand-new employer account end to end: registration form -> code
 * emailed to the new Yopmail inbox -> set password -> first onboarding screen.
 * Each step is wrapped in test.step() so it is its own row in the HTML report
 * and is named in failure output.
 *
 * Every run registers a NEW company on DEV, with generated details that are
 * unique per run - the portal rejects a mobile number or email that is already
 * registered. The official email is a fresh Yopmail inbox, so the only message
 * in it is this sign-up's code.
 *
 * Layer rule: assertions live here; page objects only act and report.
 */
import { test, expect } from '@fixtures/test-fixtures';
import { logger } from '@helpers/logger';
import { loadLocale } from '@utilities/data-loader';
import { newEmployerRegistration } from '@testdata/signup/employer-signup-data';

const strings = loadLocale('signup');

test.describe('Employer sign-up UI', () => {
  test(
    'should sign up a new employer and reach company details @regression @signup @employer',
    async ({ employerLoginPage, employerSignUpPage, yopmailInboxPage }) => {
      const registration = newEmployerRegistration();
      const { adminEmail } = registration.details;
      let code = '';

      await test.step('Step 1: Opening employer login page', async () => {
        logger.info('Step 1: Opening employer login page');
        await employerLoginPage.navigateToLoginPage();
      });

      await test.step('Step 2: Opening the sign-up page', async () => {
        logger.info('Step 2: Opening the sign-up page');
        await employerLoginPage.clickSignUp();
        expect(
          await employerSignUpPage.isRegisterFormDisplayed(),
          'Registration form should be displayed',
        ).toBeTruthy();
        expect(await employerSignUpPage.getRegisterTitle()).toBe(strings.registerTitle);
        expect(await employerSignUpPage.getRegisterStepBadge()).toBe(strings.registerStepBadge);
      });

      await test.step('Step 3: Filling registration details', async () => {
        logger.info('Step 3: Filling registration details');
        await employerSignUpPage.fillRegistrationDetails(registration.details);
      });

      await test.step('Step 4: Accepting terms and clicking Get Started', async () => {
        logger.info('Step 4: Accepting terms and clicking Get Started');
        await employerSignUpPage.acceptTerms();
        await employerSignUpPage.clickGetStarted();
      });

      await test.step('Step 5: Verifying "Verify Your Email" screen', async () => {
        logger.info('Step 5: Verifying "Verify Your Email" screen');
        await employerSignUpPage.waitForVerifyEmailScreen();
        expect(await employerSignUpPage.getVerifyEmailTitle()).toBe(strings.verifyEmailTitle);
        expect(
          await employerSignUpPage.getVerificationEmailAddress(),
          'Code should be sent to the official email entered on the form',
        ).toBe(adminEmail);
      });

      await test.step('Step 6: Opening Yopmail and checking the new inbox', async () => {
        logger.info('Step 6: Opening Yopmail and checking the new inbox');
        await yopmailInboxPage.searchInbox(adminEmail);
      });

      await test.step('Step 7: Copying the verification code from the email', async () => {
        logger.info('Step 7: Copying the verification code from the email');
        // A brand-new inbox: any message in it is this sign-up's code.
        const messageId = await yopmailInboxPage.waitForNewMessage(null);
        await yopmailInboxPage.openMessage(messageId);
        code = await yopmailInboxPage.getVerificationCode();
        expect(code, 'Email should contain a six-digit code').toMatch(/^\d{6}$/);
        await yopmailInboxPage.highlightVerificationCode(code);
        logger.info(`Verification code copied: ${code}`);
      });

      await test.step('Step 8: Entering the verification code', async () => {
        logger.info('Step 8: Entering the verification code');
        await employerSignUpPage.bringToFront();
        await employerSignUpPage.enterVerificationCode(code);
        await employerSignUpPage.submitVerificationCode();
      });

      await test.step('Step 9: Setting the password', async () => {
        logger.info('Step 9: Setting the password');
        // Reaching this screen is the proof the code was accepted.
        await employerSignUpPage.waitForSetPasswordScreen();
        await employerSignUpPage.setPassword(registration.password);
      });

      await test.step('Step 10: Verifying the account was created', async () => {
        logger.info('Step 10: Verifying the account was created');
        await employerSignUpPage.waitForCompanyDetailsScreen();
        expect(
          await employerSignUpPage.isCompanyDetailsDisplayed(),
          'New employer should land on company details verification',
        ).toBeTruthy();
      });

      logger.info(
        `Employer sign-up completed successfully. New account: ${adminEmail} / ${registration.password}`,
      );
    },
  );
});
