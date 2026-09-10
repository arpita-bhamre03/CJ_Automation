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
import { settings } from '@config/settings';
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

  /**
   * Set a field's value.
   *
   * With TYPE_DELAY=0 (the default, and always in CI) this is a single fill(),
   * which is the fastest and most reliable option. Above 0 it types character by
   * character so the input is visible during a watched run. Both paths clear the
   * field first, so they are interchangeable.
   */
  async fill(locator: Locator, value: string): Promise<void> {
    await this.waitForVisible(locator);
    await locator.fill('');

    if (settings.typeDelay > 0) {
      await locator.pressSequentially(value, { delay: settings.typeDelay });
      return;
    }

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

  async waitForHidden(locator: Locator, timeout = timeouts.element): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /** Non-throwing query for an element having gone away (detached or hidden). */
  async isHidden(locator: Locator, timeout = timeouts.element): Promise<boolean> {
    try {
      await this.waitForHidden(locator, timeout);
      return true;
    } catch {
      return false;
    }
  }

  async waitForUrl(pattern: RegExp, timeout = timeouts.navigation): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Wait for a control to become enabled. Playwright's click() already waits for
   * this, but its timeout message only says "element is not enabled"; this raises
   * a message that names the control, which matters for form-validation-gated
   * buttons where "still disabled" means "the form is invalid".
   */
  async waitForEnabled(locator: Locator, timeout = timeouts.element): Promise<void> {
    await this.waitForVisible(locator, timeout);

    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await locator.isEnabled()) return;
      await this.page.waitForTimeout(100);
    }

    throw new Error(
      `Control is still disabled after ${timeout}ms: ${locator}. ` +
        `If this is a submit button, the form is failing client-side validation.`,
    );
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
