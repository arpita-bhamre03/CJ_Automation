/**
 * Centralised UI authentication.
 *
 * Tests never build a login flow by hand - they ask the factory for a logged-in
 * session on a named portal. Credentials come from the environment via
 * config/settings.ts, never from test data.
 */
import { Page } from '@playwright/test';
import { getCredentials } from '@config/settings';
import { type Portal } from '@core/platform/platform';
import { CandidateLoginPage } from '@pages/candidate/login-page';
import { EmployerLoginPage } from '@pages/employer/login-page';
import { CollegeLoginPage } from '@pages/college/login-page';
import { logger } from '@helpers/logger';

export class LoginFactory {
  /**
   * Log in to a portal using the persona credentials for that portal.
   * The admin portal is not implemented yet - no page object exists for it,
   * and none is invented here.
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
      default:
        logger.error(`No login implementation for portal "${portal}"`);
        throw new Error(
          `Login for the "${portal}" portal is not implemented. ` +
            `Add a page object under pages/${portal}/ first.`,
        );
    }
  }
}
