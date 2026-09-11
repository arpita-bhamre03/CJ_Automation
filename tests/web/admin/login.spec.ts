/**
 * Admin panel (control panel) login with the emailed verification code.
 *
 * Flow: sign in -> "Verify it's you" -> open Yopmail, type the admin address,
 * check the inbox -> open the new email and copy the six-digit code -> enter it
 * in the panel -> dashboard. Each step is wrapped in test.step() so it is its own
 * row in the HTML report and is named in failure output.
 *
 * The code screen is controlled by the Firebase Remote Config flag `enableMFA`,
 * which DEV currently serves as false. With ADMIN_MFA=force (the default) this
 * test's browser receives it as true, so the code flow always runs - real
 * SendOTP, real email, real VerifyOTP. With ADMIN_MFA=auto the test follows
 * Firebase and skips the code steps when the panel does not ask for a code.
 *
 * Layer rule: assertions live here; page objects only act and report.
 */
import { test, expect } from '@fixtures/test-fixtures';
import { settings } from '@config/settings';
import { forceRemoteConfigFlag } from '@helpers/feature-flags';
import { logger } from '@helpers/logger';
import { loadLocale } from '@utilities/data-loader';

const strings = loadLocale('login');

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.describe('Admin panel login UI', () => {
  test(
    'should login to the admin panel with the emailed code and display the dashboard @smoke @regression @login @admin',
    async ({ page, adminLoginPage, adminUser, yopmailInboxPage }, testInfo) => {
      if (settings.adminMfa === 'force') {
        await forceRemoteConfigFlag(page, 'enableMFA', 'true');
      }

      let baselineMessageId: string | null = null;
      let code = '';

      await test.step('Step 1: Opening admin login page', async () => {
        logger.info('Step 1: Opening admin login page');
        await adminLoginPage.navigateToLoginPage();
      });

      await test.step('Step 2: Verifying login form', async () => {
        logger.info('Step 2: Verifying login form');
        expect(
          await adminLoginPage.isLoginFormDisplayed(),
          'Admin login form should be displayed',
        ).toBeTruthy();
      });

      await test.step('Step 3: Noting the newest Yopmail message before requesting a code', async () => {
        // Done in the background tab, out of sight. Noting the newest message now
        // means an older code still in the inbox can never be mistaken for the one
        // this sign-in sends.
        logger.info('Step 3: Noting the newest Yopmail message before requesting a code');
        baselineMessageId = await yopmailInboxPage.peekLatestMessageId(adminUser.username);
        await adminLoginPage.bringToFront();
      });

      await test.step('Step 4: Performing admin login', async () => {
        logger.info('Step 4: Performing admin login');
        await adminLoginPage.login(adminUser.username, adminUser.password);
      });

      const outcome = await adminLoginPage.waitForSignInOutcome();

      if (outcome === 'mfa') {
        await test.step("Step 5: Verifying \"Verify it's you\" screen", async () => {
          logger.info("Step 5: Verifying \"Verify it's you\" screen");
          expect(
            await adminLoginPage.isMfaScreenDisplayed(),
            'Verification-code screen should be displayed',
          ).toBeTruthy();

          const [local, domain] = adminUser.username.split('@');
          expect(
            await adminLoginPage.getMfaSentTo(),
            'Code should be sent to the masked admin address',
          ).toMatch(new RegExp(`^${escapeRegExp(local.slice(0, 2))}\\*+.*@${escapeRegExp(domain)}$`));
        });

        await test.step('Step 6: Opening Yopmail and checking the admin inbox', async () => {
          logger.info('Step 6: Opening Yopmail and checking the admin inbox');
          await yopmailInboxPage.searchInbox(adminUser.username);
        });

        await test.step('Step 7: Copying the verification code from the email', async () => {
          logger.info('Step 7: Copying the verification code from the email');
          const messageId = await yopmailInboxPage.waitForNewMessage(baselineMessageId);
          await yopmailInboxPage.openMessage(messageId);

          expect(await yopmailInboxPage.getLatestMessageSubject()).toContain(
            strings.otpEmailSubject,
          );
          code = await yopmailInboxPage.getVerificationCode();
          expect(code, 'Email should contain a six-digit code').toMatch(/^\d{6}$/);
          await yopmailInboxPage.highlightVerificationCode(code);
          logger.info(`Verification code copied: ${code}`);
        });

        await test.step('Step 8: Entering the verification code', async () => {
          logger.info('Step 8: Entering the verification code');
          await adminLoginPage.bringToFront();
          await adminLoginPage.enterVerificationCode(code);
          await adminLoginPage.submitVerificationCode();
          expect(
            await adminLoginPage.isMfaErrorDisplayed(),
            'The emailed code should be accepted',
          ).toBeFalsy();
        });
      } else {
        const note =
          'enableMFA is off here, so the panel did not ask for a code; steps 5-8 were not exercised';
        logger.warn(note);
        testInfo.annotations.push({ type: 'mfa', description: note });
        await test.step.skip("Step 5: Verifying \"Verify it's you\" screen", async () => {});
        await test.step.skip('Step 6: Opening Yopmail and checking the admin inbox', async () => {});
        await test.step.skip('Step 7: Copying the verification code from the email', async () => {});
        await test.step.skip('Step 8: Entering the verification code', async () => {});
      }

      await test.step('Step 9: Waiting for Admin Dashboard', async () => {
        logger.info('Step 9: Waiting for Admin Dashboard');
        await adminLoginPage.waitForDashboard();
      });

      await test.step('Step 10: Verifying Admin Dashboard', async () => {
        logger.info('Step 10: Verifying Admin Dashboard');
        expect(
          await adminLoginPage.isDashboardDisplayed(),
          'Admin dashboard should be displayed',
        ).toBeTruthy();
        expect(
          await adminLoginPage.isSidebarDisplayed(),
          'Admin navigation sidebar should be displayed',
        ).toBeTruthy();
      });

      logger.info('Admin login and Dashboard verification completed successfully.');
    },
  );
});
