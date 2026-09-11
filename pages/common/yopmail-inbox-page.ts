/**
 * Yopmail disposable inbox - used to read emailed verification codes.
 *
 * Every CentraJob DEV persona has a yopmail.com address, so any portal flow that
 * emails a code (admin sign-in MFA today) reads it here. Shared across portals,
 * hence pages/common/.
 *
 * Structure, read off the live site: the home page has an "Enter your inbox here"
 * box (#login) and a "Check Inbox" button. The inbox itself is two iframes - the
 * message list (#ifinbox) and the reading pane (#ifmail). The newest message is
 * first in the list, and in a CentraJob OTP email the code sits alone in a <div>.
 *
 * FRESHNESS: the inbox keeps old codes, and message timestamps are not reliable
 * (observed ~20 minutes ahead of local time). A code is therefore only trusted
 * when its message id differs from the newest id noted BEFORE the code was
 * requested - see peekLatestMessageId() and waitForNewMessage().
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import { FrameLocator, Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { settings } from '@config/settings';
import { logger } from '@helpers/logger';

export class YopmailInboxPage extends BasePage {
  static readonly BASE_URL = 'https://yopmail.com/en/';

  // ===== LOCATORS: home page =====
  readonly inboxNameInput: Locator;
  readonly checkInboxButton: Locator;

  // ===== LOCATORS: inbox =====
  readonly refreshButton: Locator;
  readonly inboxFrame: FrameLocator;
  readonly messages: Locator;
  readonly mailFrame: FrameLocator;
  readonly mailBody: Locator;

  constructor(page: Page) {
    super(page);
    this.inboxNameInput = page.locator('#login');
    this.checkInboxButton = page.locator('button[title="Check Inbox @yopmail.com"]');
    this.refreshButton = page.locator('#refresh');
    this.inboxFrame = page.frameLocator('#ifinbox');
    this.messages = this.inboxFrame.locator('.m');
    this.mailFrame = page.frameLocator('#ifmail');
    this.mailBody = this.mailFrame.locator('body');
  }

  /** Yopmail inboxes are addressed by the part before the @. */
  private static mailboxOf(address: string): string {
    return address.split('@')[0];
  }

  // ===== NAVIGATION =====
  async navigateToHome(): Promise<void> {
    await this.navigateTo(YopmailInboxPage.BASE_URL);
    await this.waitForVisible(this.inboxNameInput);
  }

  // ===== ACTIONS =====
  async enterInboxName(address: string): Promise<void> {
    await this.fill(this.inboxNameInput, YopmailInboxPage.mailboxOf(address));
  }

  async clickCheckInbox(): Promise<void> {
    await this.click(this.checkInboxButton);
    await this.waitForVisible(this.refreshButton);
  }

  /**
   * Open an inbox the way a person does - home page, type the address, Check
   * Inbox - with this tab in front, so a watched run shows every step.
   */
  async searchInbox(address: string): Promise<void> {
    logger.info(`Opening Yopmail inbox for ${YopmailInboxPage.mailboxOf(address)}@yopmail.com`);
    await this.bringToFront();
    await this.navigateToHome();
    await this.enterInboxName(address);
    await this.clickCheckInbox();
  }

  /**
   * The newest message id in an inbox, read WITHOUT bringing this tab to the
   * front. Taken before a code is requested, as the freshness baseline, so it
   * stays out of sight in a watched run. Null for an empty inbox.
   */
  async peekLatestMessageId(address: string): Promise<string | null> {
    const mailbox = encodeURIComponent(YopmailInboxPage.mailboxOf(address));
    await this.navigateTo(`${YopmailInboxPage.BASE_URL}?login=${mailbox}`);
    await this.waitForVisible(this.refreshButton);
    return this.getLatestMessageId();
  }

  async refreshInbox(): Promise<void> {
    await this.click(this.refreshButton);
  }

  /**
   * Refresh until a message other than `previousId` is at the top of the list,
   * and return its id. Delivery normally takes a few seconds.
   */
  async waitForNewMessage(
    previousId: string | null,
    timeoutMs = 90_000,
    pollMs = 3_000,
  ): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const latest = await this.getLatestMessageId();
      if (latest && latest !== previousId) {
        logger.info('New Yopmail message arrived');
        return latest;
      }
      await this.page.waitForTimeout(pollMs);
      await this.refreshInbox();
    }
    throw new Error(
      `No new Yopmail message arrived within ${timeoutMs / 1000}s ` +
        `(the newest message is still ${previousId ?? 'none'}).`,
    );
  }

  /** Open a message by id and wait until the reading pane is showing it. */
  async openMessage(messageId: string): Promise<void> {
    await this.click(this.inboxFrame.locator(`[id="${messageId}"] button.lm`));

    // The reading pane's URL carries the message id without the list's "e_" prefix.
    const token = messageId.replace(/^e_/, '').slice(0, 20);
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (this.page.frame({ name: 'ifmail' })?.url().includes(token)) return;
      await this.page.waitForTimeout(250);
    }
    throw new Error(`Yopmail did not open message ${messageId} in the reading pane.`);
  }

  /**
   * Highlight and select the code in the open email, so a watched run shows
   * exactly what is being copied. Purely visual: it changes only this tab's copy
   * of the page, and the pause is SLOW_MO-based, so it is 0 in CI.
   */
  async highlightVerificationCode(code: string): Promise<void> {
    const codeElement = this.mailFrame.getByText(code, { exact: true }).first();
    await this.waitForVisible(codeElement);
    await codeElement.evaluate((element) => {
      const el = element as HTMLElement;
      el.scrollIntoView({ block: 'center' });
      el.style.outline = '3px solid #e53935';
      el.style.backgroundColor = '#fff59d';
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
    await this.page.waitForTimeout(settings.slowMo * 3);
  }

  async close(): Promise<void> {
    await this.page.close();
  }

  // ===== QUERIES =====
  /** Id of the newest message, or null when the inbox is empty. */
  async getLatestMessageId(): Promise<string | null> {
    const first = this.messages.first();
    if (!(await this.isVisible(first, 10_000))) return null;
    return first.getAttribute('id');
  }

  async getLatestMessageSubject(): Promise<string> {
    return (await this.getText(this.messages.first().locator('.lms'))).trim();
  }

  /**
   * The six-digit code in the open message. Anchored on the sentence the
   * CentraJob OTP email uses, falling back to the first six-digit number. Polls
   * briefly because the reading pane can still be loading after openMessage().
   */
  async getVerificationCode(timeoutMs = 10_000): Promise<string> {
    await this.waitForVisible(this.mailBody);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const text = await this.mailBody.innerText();
      const code =
        text.match(/verify your email address\.?\s*(\d{6})\b/i)?.[1] ??
        text.match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
      await this.page.waitForTimeout(500);
    }
    throw new Error('No six-digit code found in the open Yopmail message.');
  }
}
