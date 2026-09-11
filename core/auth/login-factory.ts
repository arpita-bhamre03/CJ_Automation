/**
 * Centralised UI authentication.
 *
 * Tests never build a login flow by hand - they ask the factory for a logged-in
 * session on a named portal. Credentials come from the environment via
 * config/settings.ts, never from test data.
 */
import { Page } from '@playwright/test';
import { getCredentials, settings } from '@config/settings';
import { type Portal } from '@core/platform/platform';
import { CandidateLoginPage } from '@pages/candidate/login-page';
import { EmployerLoginPage } from '@pages/employer/login-page';
import { CollegeLoginPage } from '@pages/college/login-page';
import { AdminLoginPage } from '@pages/admin/login-page';
import { YopmailInboxPage } from '@pages/common/yopmail-inbox-page';
import { forceRemoteConfigFlag } from '@helpers/feature-flags';
import { logger } from '@helpers/logger';

export class LoginFactory {
  /**
   * Log in to a portal using the persona credentials for that portal.
   */
  static async loginAs(page: Page, portal: Portal): Promise<void> {
    const { username, password } = getCredentials(portal);

    switch (portal) {
      case 'candidate': {
        const loginPage = new CandidateLoginPage(page);
        await loginPage.navigateToLoginPage();
        await loginPage.login(username, password);
        return;
      }
      case 'employer': {
        const loginPage = new EmployerLoginPage(page);
        await loginPage.navigateToLoginPage();
        await loginPage.login(username, password);
        await loginPage.waitForLoginResult();
        return;
      }
      case 'college': {
        const loginPage = new CollegeLoginPage(page);
        await loginPage.navigateToLoginPage();
        await loginPage.login(username, password);
        await loginPage.waitForLoginResult();
        return;
      }
      case 'admin':
        await LoginFactory.loginAsAdmin(page, username, password);
        return;
      default:
        logger.error(`No login implementation for portal "${portal}"`);
        throw new Error(
          `Login for the "${portal}" portal is not implemented. ` +
            `Add a page object under pages/${portal}/ first.`,
        );
    }
  }

  /**
   * Admin sign-in, completing the emailed-code step when the panel asks for one.
   * The code is read from the admin's Yopmail inbox in a second tab.
   */
  private static async loginAsAdmin(page: Page, username: string, password: string): Promise<void> {
    if (settings.adminMfa === 'force') {
      await forceRemoteConfigFlag(page, 'enableMFA', 'true');
    }

    const loginPage = new AdminLoginPage(page);
    const inbox = new YopmailInboxPage(await page.context().newPage());

    try {
      // Note the newest message first, in the background tab, so an older code
      // still in the inbox is never used.
      const baselineMessageId = await inbox.peekLatestMessageId(username);

      await loginPage.bringToFront();
      await loginPage.navigateToLoginPage();
      await loginPage.login(username, password);

      if ((await loginPage.waitForSignInOutcome()) === 'mfa') {
        await inbox.searchInbox(username);
        const messageId = await inbox.waitForNewMessage(baselineMessageId);
        await inbox.openMessage(messageId);
        const code = await inbox.getVerificationCode();
        await loginPage.bringToFront();
        await loginPage.enterVerificationCode(code);
        await loginPage.submitVerificationCode();
      }

      await loginPage.waitForDashboard();
    } finally {
      await inbox.close();
    }
  }
}
