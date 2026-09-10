/**
 * College portal login and dashboard verification.
 *
 * Mirrors the employer login spec step for step, so the two portals report
 * identically. Each step is wrapped in test.step() so it appears as its own row
 * in the Playwright HTML report and is named in the failure output.
 *
 * Layer rule: assertions live here; the page object only acts and reports.
 */
import { test, expect } from '@fixtures/test-fixtures';
import { logger } from '@helpers/logger';

test.describe('College login UI', () => {
  test(
    'should login to the college portal and display the dashboard @smoke @regression @login @college',
    async ({ collegeLoginPage, collegeUser }) => {
      await test.step('Step 1: Opening college login page', async () => {
        logger.info('Step 1: Opening college login page');
        await collegeLoginPage.navigateToLoginPage();
      });

      await test.step('Step 2: Verifying login form', async () => {
        logger.info('Step 2: Verifying login form');
        expect(
          await collegeLoginPage.isLoginFormDisplayed(),
          'College login form should be displayed',
        ).toBeTruthy();
      });

      await test.step('Step 3: Performing college login', async () => {
        logger.info('Step 3: Performing college login');
        await collegeLoginPage.login(collegeUser.username, collegeUser.password);
      });

      await test.step('Step 4: Waiting for login result', async () => {
        logger.info('Step 4: Waiting for login result');
        await collegeLoginPage.waitForLoginResult();
      });

      await test.step('Step 5: Verifying successful login', async () => {
        logger.info('Step 5: Verifying successful login');
        expect(
          await collegeLoginPage.isLoginFormDismissed(),
          'Login form should no longer be displayed after a successful login',
        ).toBeTruthy();
      });

      await test.step('Step 6: Waiting for College Dashboard', async () => {
        logger.info('Step 6: Waiting for College Dashboard');
        await collegeLoginPage.waitForDashboard();
      });

      await test.step('Step 7: Verifying College Dashboard', async () => {
        logger.info('Step 7: Verifying College Dashboard');
        expect(
          await collegeLoginPage.isDashboardDisplayed(),
          'College dashboard should be displayed',
        ).toBeTruthy();
      });

      logger.info('College login and Dashboard verification completed successfully.');
    },
  );
});
