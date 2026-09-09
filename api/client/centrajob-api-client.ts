/**
 * Concrete API client built on Playwright's APIRequestContext, so API tests
 * reuse the same runtime as UI tests and need no extra HTTP dependency.
 *
 * STATUS: scaffold. Base URLs are read from the environment and are unset until
 * the API details are supplied (see README "API automation - pending"). No URL
 * is hard-coded or guessed here.
 */
import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { logger } from '@helpers/logger';
import type {
  ApiRequest,
  ApiResponse,
  IApiClient,
} from '@api/interface/api-client.interface';

/**
 * The backend is composed of several services. The employer frontend reads one
 * base URL per service (src/api/endpoints.ts), so the framework mirrors that.
 */
export type ApiService =
  | 'account'
  | 'admin'
  | 'employer'
  | 'college'
  | 'candidate'
  | 'notification';

const ENV_KEY: Record<ApiService, string> = {
  account: 'ACCOUNT_API_URL',
  admin: 'ADMIN_API_URL',
  employer: 'EMPLOYER_API_URL',
  college: 'COLLEGE_API_URL',
  candidate: 'CANDIDATE_API_URL',
  notification: 'NOTIFICATION_API_URL',
};

export const getServiceBaseUrl = (service: ApiService): string => {
  const key = ENV_KEY[service];
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `API base URL for the "${service}" service is not configured. ` +
        `Set ${key} in .env before running API tests.`,
    );
  }
  return value;
};

export class CentraJobApiClient implements IApiClient {
  private context?: APIRequestContext;

  constructor(private readonly service: ApiService) {}

  private async getContext(): Promise<APIRequestContext> {
    if (!this.context) {
      this.context = await playwrightRequest.newContext({
        baseURL: getServiceBaseUrl(this.service),
        ignoreHTTPSErrors: true,
      });
    }
    return this.context;
  }

  async send<T = unknown>(req: ApiRequest): Promise<ApiResponse<T>> {
    const context = await this.getContext();
    logger.debug(`API ${req.method} ${this.service}${req.path}`);

    const response = await context.fetch(req.path, {
      method: req.method,
      headers: req.headers,
      params: req.query,
      data: req.body as never,
    });

    let body: T;
    try {
      body = (await response.json()) as T;
    } catch {
      body = (await response.text()) as unknown as T;
    }

    logger.debug(`API ${req.method} ${req.path} -> ${response.status()}`);

    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
    };
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
    this.context = undefined;
  }
}
