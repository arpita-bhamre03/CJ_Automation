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

  /** Switch to this page's tab - for flows that hop between two tabs. */
  async bringToFront(): Promise<void> {
    await this.page.bringToFront();
  }

  /**
   * Set a field's value in one go, even when TYPE_DELAY is set. For inputs that
   * rewrite their value on every keystroke (e.g. auto-prefixing a URL), where
   * typing character by character would garble what ends up in the field.
   */
  async fillWithoutTyping(locator: Locator, value: string): Promise<void> {
    await this.waitForVisible(locator);
    await locator.fill(value);
  }

  /** Attach a file to a file input. Works on hidden inputs, as most upload widgets use. */
  async uploadFile(locator: Locator, filePath: string): Promise<void> {
    await locator.setInputFiles(filePath);
  }

  /** Non-throwing check that some text is on screen, e.g. a confirmation toast. */
  async isTextDisplayed(text: string, timeout = timeouts.element): Promise<boolean> {
    return this.isVisible(this.page.getByText(text).first(), timeout);
  }

  /**
   * The editable input or textarea behind a form field, whether the app put the
   * data-testid on the element itself or on the MUI wrapper around it. Hidden
   * helper elements (MUI's autosize textarea, hidden value inputs) are skipped.
   */
  protected textFieldByTestId(testId: string): Locator {
    const own = `input[data-testid="${testId}"], textarea[data-testid="${testId}"]`;
    const inside =
      `[data-testid="${testId}"] input:not([type="hidden"]):not([aria-hidden="true"]), ` +
      `[data-testid="${testId}"] textarea:not([aria-hidden="true"])`;
    return this.page.locator(`${own}, ${inside}`).first();
  }
}
