/**
 * Feature-flag overrides for the browser under test.
 *
 * CentraJob gates some behaviour behind Firebase Remote Config flags that the
 * browser fetches at runtime (project "centrajob-employer", shared by the
 * portals). Overriding a flag here changes only what THIS test browser receives -
 * the Firebase project, the app code and the backend are untouched, and no other
 * user or browser is affected.
 *
 * Layer: helpers (test setup). No locators, no assertions.
 */
import { Page } from '@playwright/test';
import { logger } from './logger';

const REMOTE_CONFIG_FETCH = /firebaseremoteconfig\.googleapis\.com\/.*:fetch/;

interface RemoteConfigResponse {
  state?: string;
  entries?: Record<string, string>;
}

/**
 * Force a Remote Config value for every config fetch this page makes. Call it
 * before the app fetches its config - i.e. before navigating or signing in.
 * Values are strings, as Remote Config transmits them ("true", not true).
 */
export const forceRemoteConfigFlag = async (
  page: Page,
  key: string,
  value: string,
): Promise<void> => {
  await page.route(REMOTE_CONFIG_FETCH, async (route) => {
    const response = await route.fetch();

    let json: RemoteConfigResponse | undefined;
    try {
      json = (await response.json()) as RemoteConfigResponse;
    } catch {
      json = undefined;
    }

    // A NO_CHANGE response carries no entries and tells the SDK to keep its cache.
    // Fresh test browsers always get a full UPDATE, so there is nothing to patch
    // here - pass it through rather than fabricate a partial config.
    if (!json?.entries) {
      logger.warn(`Remote Config fetch had no entries (state=${json?.state}); ${key} not overridden`);
      await route.fulfill({ response });
      return;
    }

    json.entries = { ...json.entries, [key]: value };
    logger.info(`Remote Config override for this browser: ${key}=${value}`);
    await route.fulfill({ response, json });
  });
};
