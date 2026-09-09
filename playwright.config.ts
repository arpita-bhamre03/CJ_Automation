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

const traceMode =
  (process.env.TRACE_MODE as 'off' | 'on' | 'on-first-retry' | 'retain-on-failure') ??
  'on-first-retry';
const videoMode =
  (process.env.VIDEO_MODE as 'off' | 'on' | 'retain-on-failure' | 'on-first-retry') ??
  'retain-on-failure';

export default defineConfig({
  testDir: './tests',
  timeout: timeouts.test,
  expect: { timeout: timeouts.expect },
  fullyParallel: false,
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
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport },
    },
  ],
  outputDir: 'test-results',
  metadata: {
    environment: envName,
    project: 'CentraJob Automation',
  },
});
