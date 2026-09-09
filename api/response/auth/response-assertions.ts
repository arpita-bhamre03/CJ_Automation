/**
 * Reusable response assertions for the auth domain.
 *
 * This is the one place assertions are allowed outside tests/: they are named,
 * reusable expectations over an API response, not UI verification.
 */
import { expect } from '@playwright/test';
import type { ApiResponse } from '@api/interface/api-client.interface';

export const expectStatus = (response: ApiResponse, expected: number): void => {
  expect(response.status, `Expected HTTP ${expected}, got ${response.status}`).toBe(expected);
};

export const expectSuccess = (response: ApiResponse): void => {
  expect(response.ok, `Expected a 2xx response, got ${response.status}`).toBeTruthy();
};

export const expectJsonContentType = (response: ApiResponse): void => {
  expect(response.headers['content-type'] ?? '').toContain('application/json');
};

export const expectBodyHasKeys = (response: ApiResponse, keys: string[]): void => {
  const body = response.body as Record<string, unknown>;
  for (const key of keys) {
    expect(body, `Response body is missing key "${key}"`).toHaveProperty(key);
  }
};
