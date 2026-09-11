/**
 * Project-level constants that are not environment-specific:
 * timeouts, viewport, and the artifact directory layout.
 */
import * as path from 'path';
import { settings } from './settings';

export const PROJECT_ROOT = path.resolve(__dirname, '..');
export const TESTDATA_DIR = path.join(PROJECT_ROOT, 'testdata');
export const REPORT_DIR = path.join(PROJECT_ROOT, settings.reportsDir);
export const LOG_DIR = path.join(REPORT_DIR, 'logs');
export const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');
export const DOWNLOADS_DIR = path.join(REPORT_DIR, 'downloads');

export const timeouts = {
  test: 45_000,
  /**
   * Per-test limit for a watched (headed) run. SLOW_MO pauses before every action
   * and TYPE_DELAY types character by character, so a flow that takes ~30s
   * headless - employer sign-up, admin login with emailed code - runs well past
   * the 45s headless limit when watched.
   */
  watchedTest: 180_000,
  expect: 15_000,
  action: 20_000,
  navigation: 30_000,
  /** Default wait used by BasePage helpers. */
  element: 15_000,
};

export const viewport = { width: 1440, height: 1200 };
