/**
 * Playwright runner configuration.
 *
 * Layer rule: this file holds run configuration only. URLs and timings come from
 * config/ - nothing environment-specific is hard-coded here.
 */
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// config/config.ts loads .env itself on import, so ordering is safe here despite
// import hoisting; this call is belt-and-braces for anything read directly below.
import { currentEnvironment, envName } from './config/config';
import { settings } from './config/settings';
import { timeouts, viewport } from './config/app.config';

dotenv.config();

/** A headed run is one someone is watching; it gets a maximized window and 1 worker. */
const watched = !settings.headless;

const traceMode =
  (process.env.TRACE_MODE as 'off' | 'on' | 'on-first-retry' | 'retain-on-failure') ??
  'on-first-retry';
const videoMode =
  (process.env.VIDEO_MODE as 'off' | 'on' | 'retain-on-failure' | 'on-first-retry') ??
  'retain-on-failure';

export default defineConfig({
  testDir: './tests',
  timeout: watched ? timeouts.watchedTest : timeouts.test,
  expect: { timeout: timeouts.expect },
  fullyParallel: false,
  // A watched run is sequential: parallel workers open several browser windows at
  // once, which is impossible to follow. Headless runs keep the default workers.
  workers: settings.headless ? undefined : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : currentEnvironment.retryCount,
  reporter: [
    ['html', { outputFolder: path.join(settings.reportsDir, 'html'), open: 'never' }],
    ['junit', { outputFile: path.join(settings.reportsDir, 'junit', 'results.xml') }],
    ['list'],
  ],
  use: {
    // Each spec navigates via a page object, which resolves its own portal URL
    // from config. baseURL is set to the environment default for relative paths.
    baseURL: currentEnvironment.baseUrl,
    trace: traceMode,
    video: videoMode,
    screenshot: 'only-on-failure',
    actionTimeout: timeouts.action,
    navigationTimeout: timeouts.navigation,
    headless: settings.headless,
    ignoreHTTPSErrors: true,
    // SLOW_MO pauses before each action so a headed run is watchable. 0 in CI.
    // A watched run opens maximized so the page fits the real screen.
    launchOptions: {
      slowMo: settings.slowMo,
      args: watched ? ['--start-maximized'] : [],
    },
  },
  projects: [
    {
      name: 'chromium',
      // Watched: no fixed viewport, so the page follows the maximized window rather
      // than a 1440x1200 canvas that overflows smaller screens. The device preset is
      // skipped too - its deviceScaleFactor cannot be combined with a null viewport.
      // Headless keeps the fixed desktop size so screenshots stay comparable.
      use: watched ? { browserName: 'chromium', viewport: null } : { ...devices['Desktop Chrome'], viewport },
    },
  ],
  outputDir: 'test-results',
  metadata: {
    environment: envName,
    project: 'CentraJob Automation',
  },
});
