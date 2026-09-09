/**
 * Failure artifact capture: URL, page title, full-page screenshot and console logs.
 * Wired into tests/fixtures/test-fixtures.ts, so every spec gets it for free.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Page, TestInfo } from '@playwright/test';
import { SCREENSHOT_DIR } from '@config/app.config';
import { logger } from './logger';

const safeName = (value: string): string =>
  value.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 120);

export const captureFailureArtifacts = async (
  page: Page,
  testInfo: TestInfo,
  consoleLogs: string[],
): Promise<void> => {
  const name = safeName(testInfo.title);

  try {
    logger.error(`FAILED: ${testInfo.title}`);
    logger.error(`  URL:   ${page.url()}`);
    logger.error(`  Title: ${await page.title()}`);

    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('failure-screenshot', { path: screenshotPath, contentType: 'image/png' });

    if (consoleLogs.length > 0) {
      logger.error(`  Console (${consoleLogs.length} entries):`);
      consoleLogs.forEach((entry) => logger.error(`    ${entry}`));
      await testInfo.attach('browser-console', {
        body: consoleLogs.join('\n'),
        contentType: 'text/plain',
      });
    }
  } catch (error) {
    logger.warn(`Could not capture failure artifacts: ${(error as Error).message}`);
  }
};
