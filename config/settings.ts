/**
 * Resolved run settings, including credentials read from the environment.
 *
 * Layer rule: credentials are NEVER hard-coded and NEVER defaulted. A missing
 * environment variable throws immediately rather than silently running a test
 * with placeholder credentials (which produces a misleading auth failure).
 */
import { currentEnvironment, type Portal } from './config';

export interface Credentials {
  username: string;
  password: string;
}

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable "${key}". ` +
        `Copy .env.example to .env and provide a value. Credentials are never defaulted.`,
    );
  }
  return value;
};

/** Credentials for a portal persona, read lazily so unused personas need no env vars. */
export const getCredentials = (portal: Portal): Credentials => {
  const prefix = portal.toUpperCase();
  return {
    username: requireEnv(`${prefix}_USERNAME`),
    password: requireEnv(`${prefix}_PASSWORD`),
  };
};

const numberFromEnv = (key: string, fallback: number): number => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const settings = {
  environment: currentEnvironment.name,
  timeout: currentEnvironment.timeout,
  retryCount: currentEnvironment.retryCount,
  headless: (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false',
  reportsDir: process.env.REPORTS_DIR ?? 'reports',

  /**
   * Watch-the-run controls. Both default to 0 so CI is never slowed down.
   *
   * slowMo   - milliseconds Playwright pauses before each action, so you can see
   *            which control it is about to operate on.
   * typeDelay - milliseconds between keystrokes. Above 0, BasePage.fill() types
   *            character by character instead of setting the value in one shot,
   *            which is the only way the text is actually visible going in.
   */
  slowMo: numberFromEnv('SLOW_MO', 0),
  typeDelay: numberFromEnv('TYPE_DELAY', 0),
};

/** Mirrors get_settings() from the framework spec. */
export const getSettings = () => settings;
