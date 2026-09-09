/**
 * Generic Playwright wrappers shared by every page object.
 *
 * Layer rules:
 *  - No CentraJob-specific business logic here.
 *  - No assertions here. Page objects return values; tests assert on them.
 *  - Methods are public so helpers and derived pages can compose them.
 */
import { Locator, Page } from '@playwright/test';
import { timeouts } from '@config/app.config';
import { logger } from '@helpers/logger';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    logger.debug(`Navigating to ${url}`);
    await this.page.goto(url);
  }

  async waitForVisible(locator: Locator, timeout = timeouts.element): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async click(locator: Locator): Promise<void> {
    await this.waitForVisible(locator);
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await this.waitForVisible(locator);
    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    await this.waitForVisible(locator);
    return (await locator.textContent()) ?? '';
  }

  /** Non-throwing visibility query, for tests that assert on presence/absence. */
  async isVisible(locator: Locator, timeout = timeouts.element): Promise<boolean> {
    try {
      await this.waitForVisible(locator, timeout);
      return true;
    } catch {
      return false;
    }
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }
}
