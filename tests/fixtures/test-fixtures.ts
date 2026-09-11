/**
 * The single entry point for every spec:
 *
 *   import { test, expect } from '@fixtures/test-fixtures';
 *
 * Provides environment/config fixtures, one thin fixture per page object, a
 * credentials fixture, console-log capture and automatic failure artifacts.
 *
 * Layer rule: tests never construct page objects - they take them from here.
 */
import { test as base, expect } from '@playwright/test';
import { currentEnvironment, type AppEnvironmentConfig } from '@config/config';
import { getCredentials, type Credentials } from '@config/settings';
import { resolvePortalUrl } from '@core/platform/platform';
import { CandidateLoginPage } from '@pages/candidate/login-page';
import { EmployerLoginPage } from '@pages/employer/login-page';
import { EmployerSignUpPage } from '@pages/employer/signup-page';
import { CollegeLoginPage } from '@pages/college/login-page';
import { AdminLoginPage } from '@pages/admin/login-page';
import { YopmailInboxPage } from '@pages/common/yopmail-inbox-page';
import { captureFailureArtifacts } from '@helpers/failure-artifact';
import { logger } from '@helpers/logger';

type CentraJobFixtures = {
  // ---- environment ----
  environment: AppEnvironmentConfig;
  candidateUrl: string;
  employerUrl: string;
  collegeUrl: string;
  adminUrl: string;

  // ---- credentials ----
  candidateUser: Credentials;
  employerUser: Credentials;
  collegeUser: Credentials;
  adminUser: Credentials;

  // ---- page objects ----
  candidateLoginPage: CandidateLoginPage;
  employerLoginPage: EmployerLoginPage;
  employerSignUpPage: EmployerSignUpPage;
  collegeLoginPage: CollegeLoginPage;
  adminLoginPage: AdminLoginPage;
  yopmailInboxPage: YopmailInboxPage;

  // ---- diagnostics ----
  consoleLogs: string[];
};

export const test = base.extend<CentraJobFixtures>({
  // ===== ENVIRONMENT =====
  environment: async ({}, use) => {
    await use(currentEnvironment);
  },

  candidateUrl: async ({}, use) => {
    await use(resolvePortalUrl('candidate'));
  },

  employerUrl: async ({}, use) => {
    await use(resolvePortalUrl('employer'));
  },

  collegeUrl: async ({}, use) => {
    await use(resolvePortalUrl('college'));
  },

  adminUrl: async ({}, use) => {
    await use(resolvePortalUrl('admin'));
  },

  // ===== CREDENTIALS =====
  candidateUser: async ({}, use) => {
    await use(getCredentials('candidate'));
  },

  employerUser: async ({}, use) => {
    await use(getCredentials('employer'));
  },

  collegeUser: async ({}, use) => {
    await use(getCredentials('college'));
  },

  adminUser: async ({}, use) => {
    await use(getCredentials('admin'));
  },

  // ===== DIAGNOSTICS =====
  // auto:true so the listeners are attached BEFORE the test body runs - without
  // it the fixture would only be created when afterEach asks for it, by which
  // point every console message has already been missed.
  consoleLogs: [
    async ({ page }, use) => {
      const logs: string[] = [];
      page.on('console', (message) => logs.push(`[${message.type()}] ${message.text()}`));
      page.on('pageerror', (error) => logs.push(`[pageerror] ${error.message}`));
      await use(logs);
    },
    { auto: true },
  ],

  // ===== PAGE OBJECTS =====
  candidateLoginPage: async ({ page }, use) => {
    await use(new CandidateLoginPage(page));
  },

  employerLoginPage: async ({ page }, use) => {
    await use(new EmployerLoginPage(page));
  },

  employerSignUpPage: async ({ page }, use) => {
    await use(new EmployerSignUpPage(page));
  },

  collegeLoginPage: async ({ page }, use) => {
    await use(new CollegeLoginPage(page));
  },

  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },

  // Opened in its own tab of the same browser, so a watched run shows both the
  // portal and the inbox. The portal tab is brought back to the front first.
  yopmailInboxPage: async ({ context, page }, use) => {
    const mailTab = await context.newPage();
    await page.bringToFront();
    await use(new YopmailInboxPage(mailTab));
    await mailTab.close().catch(() => undefined);
  },
});

// ===== LOGGING + FAILURE ARTIFACTS =====
test.beforeEach(async ({}, testInfo) => {
  logger.info(`START: ${testInfo.titlePath.join(' > ')}`);
});

test.afterEach(async ({ page, consoleLogs }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await captureFailureArtifacts(page, testInfo, consoleLogs);
  }
  logger.info(`END:   ${testInfo.title} [${testInfo.status}] ${testInfo.duration}ms`);
});

export { expect };
