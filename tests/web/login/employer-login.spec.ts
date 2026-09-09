/**
 * Employer portal login and dashboard verification.
 *
 * Each numbered step is wrapped in test.step() so it appears as its own row in
 * the Playwright HTML report and is named in the failure output.
 *
 * Layer rule: assertions live here; the page object only acts and reports.
 */
import { test, expect } from '@fixtures/test-fixtures';
import { logger } from '@helpers/logger';

test.describe('Employer login UI', () => {
  test(
    'should login to the employer portal and display the dashboard @smoke @regression @login @employer',
    async ({ employerLoginPage, employerUser }) => {
      await test.step('Step 1: Opening employer login page', async () => {
        logger.info('Step 1: Opening employer login page');
        await employerLoginPage.navigateToLoginPage();
      });

      await test.step('Step 2: Verifying login form', async () => {
        logger.info('Step 2: Verifying login form');
        expect(
          await employerLoginPage.isLoginFormDisplayed(),
          'Employer login form should be displayed',
        ).toBeTruthy();
      });

      await test.step('Step 3: Performing employer login', async () => {
        logger.info('Step 3: Performing employer login');
        await employerLoginPage.login(employerUser.username, employerUser.password);
      });

      await test.step('Step 4: Waiting for login result', async () => {
        logger.info('Step 4: Waiting for login result');
        await employerLoginPage.waitForLoginResult();
      });

      await test.step('Step 5: Verifying successful login', async () => {
        logger.info('Step 5: Verifying successful login');
        expect(
          await employerLoginPage.isLoginFormDismissed(),
          'Login form should no longer be displayed after a successful login',
        ).toBeTruthy();
      });

      await test.step('Step 6: Waiting for Employer Dashboard', async () => {
        logger.info('Step 6: Waiting for Employer Dashboard');
        await employerLoginPage.waitForDashboard();
      });

      await test.step('Step 7: Verifying Employer Dashboard', async () => {
        logger.info('Step 7: Verifying Employer Dashboard');
        expect(
          await employerLoginPage.isDashboardDisplayed(),
          'Employer dashboard should be displayed',
        ).toBeTruthy();
      });

      logger.info('Employer login and Dashboard verification completed successfully.');
    },
  );
});
