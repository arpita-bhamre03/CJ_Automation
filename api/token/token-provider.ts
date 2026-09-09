/**
 * Single place where API auth tokens are obtained and cached, so no API test
 * ever repeats a login call.
 *
 * STATUS: scaffold. The token field name in the login response is unknown, so
 * extractToken() lists the likely candidates and throws a clear error rather
 * than guessing silently. Tighten it once a real response is captured.
 */
import { getCredentials } from '@config/settings';
import type { Portal } from '@core/platform/platform';
import { AuthService } from '@api/service/auth/auth-service';
import { logger } from '@helpers/logger';

const TOKEN_FIELDS = ['token', 'accessToken', 'access_token', 'jwtToken', 'idToken'];

export class TokenProvider {
  private static cache = new Map<Portal, string>();

  private static extractToken(body: Record<string, unknown>): string {
    for (const field of TOKEN_FIELDS) {
      const value = body?.[field];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    // Some APIs nest the token one level down.
    const nested = body?.['data'];
    if (nested && typeof nested === 'object') {
      return TokenProvider.extractToken(nested as Record<string, unknown>);
    }
    throw new Error(
      `Could not find an auth token in the login response. ` +
        `Checked fields: ${TOKEN_FIELDS.join(', ')}. ` +
        `Update TOKEN_FIELDS in api/token/token-provider.ts with the real field name.`,
    );
  }

  /** Fetch (and cache) a bearer token for a portal persona. */
  static async getToken(portal: Portal): Promise<string> {
    const cached = TokenProvider.cache.get(portal);
    if (cached) return cached;

    const { username, password } = getCredentials(portal);
    const service = new AuthService();

    try {
      logger.info(`Requesting API token for ${portal}`);
      const response = await service.login({ email: username, password });

      if (!response.ok) {
        throw new Error(`Login API returned ${response.status} for portal "${portal}".`);
      }

      const token = TokenProvider.extractToken(response.body as Record<string, unknown>);
      TokenProvider.cache.set(portal, token);
      return token;
    } finally {
      await service.dispose();
    }
  }

  static clear(): void {
    TokenProvider.cache.clear();
  }
}
