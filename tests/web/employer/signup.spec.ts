/**
 * Employer portal sign-up, all three stages.
 *
 *   [1/3] registration form -> code emailed to a new Yopmail inbox -> set password
 *   [2/3] company details: designation, LinkedIn, website, industry, pincode with
 *         address auto-fill, address, description, company logo, profile photo
 *   [3/3] company documents: registration, tax and address proof -> Finish Sign-up
 *
 * Finishing submits the company for verification and opens the new employer's
 * dashboard, which says the company details are awaiting verification. Each
 * step is its own row in the HTML report, labelled with its stage.
 *
 * Every run registers a NEW company on DEV with generated, unique details. The
 * upload files are small QA samples in testdata/signup/assets/.
 *
 * Layer rule: assertions live here; page objects only act and report.
 */
import * as path from 'path';
import { test, expect } from '@fixtures/test-fixtures';
import { logger } from '@helpers/logger';
import { loadLocale } from '@utilities/data-loader';
import { newEmployerRegistration } from '@testdata/signup/employer-signup-data';

const strings = loadLocale('signup');

test.describe('Employer sign-up UI', () => {
  test(
    'should complete employer sign-up through all three stages @regression @signup @employer',
    async ({
      employerLoginPage,
      employerSignUpPage,
      employerCompanyDetailsPage,
      employerCompanyDocumentsPage,
      yopmailInboxPage,
    }) => {
      // Three screens, a mailbox round-trip and five uploads: allow triple time.
      test.slow();

      const registration = newEmployerRegistration();
      const { adminEmail } = registration.details;
      let code = '';

      // ======================= [1/3] Registration =======================

      await test.step('Step 1 [1/3]: Opening employer login page', async () => {
        logger.info('Step 1 [1/3]: Opening employer login page');
        await employerLoginPage.navigateToLoginPage();
      });

      await test.step('Step 2 [1/3]: Opening the sign-up page', async () => {
        logger.info('Step 2 [1/3]: Opening the sign-up page');
        await employerLoginPage.clickSignUp();
        expect(
          await employerSignUpPage.isRegisterFormDisplayed(),
          'Registration form should be displayed',
        ).toBeTruthy();
        expect(await employerSignUpPage.getRegisterTitle()).toBe(strings.registerTitle);
        expect(await employerSignUpPage.getRegisterStepBadge()).toBe(strings.registerStepBadge);
      });

      await test.step('Step 3 [1/3]: Filling registration details', async () => {
        logger.info('Step 3 [1/3]: Filling registration details');
        await employerSignUpPage.fillRegistrationDetails(registration.details);
      });

      await test.step('Step 4 [1/3]: Accepting terms and clicking Get Started', async () => {
        logger.info('Step 4 [1/3]: Accepting terms and clicking Get Started');
        await employerSignUpPage.acceptTerms();
        await employerSignUpPage.clickGetStarted();
      });

      await test.step('Step 5 [1/3]: Verifying "Verify Your Email" screen', async () => {
        logger.info('Step 5 [1/3]: Verifying "Verify Your Email" screen');
        await employerSignUpPage.waitForVerifyEmailScreen();
        expect(await employerSignUpPage.getVerifyEmailTitle()).toBe(strings.verifyEmailTitle);
        expect(
          await employerSignUpPage.getVerificationEmailAddress(),
          'Code should be sent to the official email entered on the form',
        ).toBe(adminEmail);
      });

      await test.step('Step 6 [1/3]: Opening Yopmail and checking the new inbox', async () => {
        logger.info('Step 6 [1/3]: Opening Yopmail and checking the new inbox');
        await yopmailInboxPage.searchInbox(adminEmail);
      });

      await test.step('Step 7 [1/3]: Copying the verification code from the email', async () => {
        logger.info('Step 7 [1/3]: Copying the verification code from the email');
        // A brand-new inbox: any message in it is this sign-up's code.
        const messageId = await yopmailInboxPage.waitForNewMessage(null);
        await yopmailInboxPage.openMessage(messageId);
        code = await yopmailInboxPage.getVerificationCode();
        expect(code, 'Email should contain a six-digit code').toMatch(/^\d{6}$/);
        await yopmailInboxPage.highlightVerificationCode(code);
        logger.info(`Verification code copied: ${code}`);
      });

      await test.step('Step 8 [1/3]: Entering the verification code', async () => {
        logger.info('Step 8 [1/3]: Entering the verification code');
        await employerSignUpPage.bringToFront();
        await employerSignUpPage.enterVerificationCode(code);
        await employerSignUpPage.submitVerificationCode();
      });

      await test.step('Step 9 [1/3]: Setting the password and showing it', async () => {
        logger.info('Step 9 [1/3]: Setting the password and showing it');
        // Reaching this screen is the proof the code was accepted.
        await employerSignUpPage.waitForSetPasswordScreen();
        await employerSignUpPage.enterPassword(registration.password);
        await employerSignUpPage.showPasswords();
        expect(
          await employerSignUpPage.arePasswordsShown(),
          'Both passwords should be shown after clicking the eye icons',
        ).toBeTruthy();
        expect(await employerSignUpPage.getShownPassword()).toBe(registration.password);
        expect(await employerSignUpPage.getShownConfirmPassword()).toBe(registration.password);
        logger.info(`Password set: ${registration.password}`);
        await employerSignUpPage.clickSetPassword();
      });

      // ======================= [2/3] Company details =======================
      const details = registration.companyDetails;

      await test.step('Step 10 [2/3]: Verifying the Company Details screen', async () => {
        logger.info('Step 10 [2/3]: Verifying the Company Details screen');
        // Setting the password created the account and signed the user in.
        await employerCompanyDetailsPage.waitForScreen();
        expect(await employerCompanyDetailsPage.getScreenTitle()).toBe(strings.companyDetailsTitle);
        expect(await employerCompanyDetailsPage.getStepBadge()).toBe(
          strings.companyDetailsStepBadge,
        );
      });

      await test.step('Step 11 [2/3]: Filling designation, LinkedIn and website', async () => {
        logger.info('Step 11 [2/3]: Filling designation, LinkedIn and website');
        await employerCompanyDetailsPage.fillRoleAndLinks(details);
      });

      await test.step('Step 12 [2/3]: Selecting the industry type', async () => {
        logger.info('Step 12 [2/3]: Selecting the industry type');
        const industry = await employerCompanyDetailsPage.selectIndustry();
        expect(industry, 'An industry should be available to choose').not.toBe('');
        expect(await employerCompanyDetailsPage.getSelectedIndustry()).toContain(industry);
      });

      await test.step('Step 13 [2/3]: Entering the pincode and checking the address fills in', async () => {
        logger.info('Step 13 [2/3]: Entering the pincode and checking the address fills in');
        await employerCompanyDetailsPage.enterPincode(details.pincode);
        await employerCompanyDetailsPage.waitForAddressAutofill();
        expect(await employerCompanyDetailsPage.getCity(), 'City should auto-fill').not.toBe('');
        expect(await employerCompanyDetailsPage.getDistrict(), 'District should auto-fill').not.toBe(
          '',
        );
      });

      await test.step('Step 14 [2/3]: Filling address and company description', async () => {
        logger.info('Step 14 [2/3]: Filling address and company description');
        await employerCompanyDetailsPage.fillAddressAndDescription(details);
      });

      await test.step('Step 15 [2/3]: Uploading company logo and profile photo', async () => {
        logger.info('Step 15 [2/3]: Uploading company logo and profile photo');
        await employerCompanyDetailsPage.uploadCompanyLogo(registration.images.companyLogo);
        await employerCompanyDetailsPage.uploadProfilePhoto(registration.images.profilePhoto);
        expect(await employerCompanyDetailsPage.getLogoUploadText()).toContain(
          path.basename(registration.images.companyLogo),
        );
        expect(await employerCompanyDetailsPage.getProfilePhotoUploadText()).toContain(
          path.basename(registration.images.profilePhoto),
        );
      });

      await test.step('Step 16 [2/3]: Clicking Continue', async () => {
        logger.info('Step 16 [2/3]: Clicking Continue');
        await employerCompanyDetailsPage.clickContinue();
      });

      // ======================= [3/3] Company documents =======================

      await test.step('Step 17 [3/3]: Verifying the company documents screen', async () => {
        logger.info('Step 17 [3/3]: Verifying the company documents screen');
        await employerCompanyDocumentsPage.waitForScreen();
        expect(await employerCompanyDocumentsPage.getScreenTitle()).toBe(
          strings.companyDocumentsTitle,
        );
        expect(await employerCompanyDocumentsPage.getStepBadge()).toBe(
          strings.companyDocumentsStepBadge,
        );
      });

      await test.step('Step 18 [3/3]: Uploading registration, tax and address-proof documents', async () => {
        logger.info('Step 18 [3/3]: Uploading registration, tax and address-proof documents');
        await employerCompanyDocumentsPage.uploadAllDocuments(registration.documents);
        for (const [document, filePath] of Object.entries(registration.documents)) {
          expect(
            await employerCompanyDocumentsPage.getDocumentUploadText(
              document as keyof typeof registration.documents,
            ),
            `${document} should show its uploaded file`,
          ).toContain(path.basename(filePath));
        }
      });

      await test.step('Step 19 [3/3]: Clicking Finish Sign-up and verifying submission', async () => {
        logger.info('Step 19 [3/3]: Clicking Finish Sign-up and verifying submission');
        await employerCompanyDocumentsPage.clickFinishSignUp();
        expect(
          await employerCompanyDocumentsPage.isTextDisplayed(strings.signUpSubmittedMessage),
          'Submission confirmation should be shown',
        ).toBeTruthy();
      });

      await test.step('Step 20 [3/3]: Verifying the new employer dashboard', async () => {
        logger.info('Step 20 [3/3]: Verifying the new employer dashboard');
        // Finishing keeps the new employer signed in and opens their dashboard.
        await employerLoginPage.waitForDashboard();
        expect(
          await employerLoginPage.getWelcomeMessage(),
          'Dashboard should greet the newly registered employer by name',
        ).toContain(registration.details.fullName);
        expect(
          await employerLoginPage.isTextDisplayed(strings.verificationPendingBanner),
          'Dashboard should say the company details are awaiting verification',
        ).toBeTruthy();
      });

      logger.info(
        `Employer sign-up completed through all three stages. New account: ${adminEmail} / ${registration.password}`,
      );
    },
  );
});
