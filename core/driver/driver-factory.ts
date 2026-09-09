/**
 * Browser/context construction options.
 *
 * Playwright Test owns the browser lifecycle, so this factory supplies the
 * context options used by playwright.config.ts and by any test that needs a
 * second, differently-configured context (for example a second portal session).
 */
import { Browser, BrowserContext, Page } from '@playwright/test';
import { timeouts, viewport } from '@config/app.config';
import { settings } from '@config/settings';
import { resolvePortalUrl, type Portal } from '@core/platform/platform';

export interface ContextOptions {
  portal?: Portal;
  recordVideo?: boolean;
}

export class DriverFactory {
  static contextOptions(options: ContextOptions = {}) {
    return {
      viewport,
      ignoreHTTPSErrors: true,
      baseURL: options.portal ? resolvePortalUrl(options.portal) : undefined,
    };
  }

  static get headless(): boolean {
    return settings.headless;
  }

  /** Create an isolated context+page, e.g. for a second portal in one test. */
  static async newPageForPortal(browser: Browser, portal: Portal): Promise<Page> {
    const context: BrowserContext = await browser.newContext(
      DriverFactory.contextOptions({ portal }),
    );
    const page = await context.newPage();
    page.setDefaultTimeout(timeouts.action);
    page.setDefaultNavigationTimeout(timeouts.navigation);
    return page;
  }
}
