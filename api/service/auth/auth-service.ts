/**
 * Account/auth domain service.
 *
 * STATUS: scaffold, not yet exercised by any test.
 *
 * The endpoint paths below are NOT invented - they were read from the employer
 * frontend's endpoint catalogue (centrajob_employer_frontend/src/api/endpoints.ts,
 * `API_ENDPOINTS.account`). The request/response shapes are still unknown, so
 * `login()` is typed loosely and must be tightened once a sample payload is
 * available.
 */
import { AbstractService } from '@api/abstract/abstract-service';
import { RequestBuilder } from '@api/builder/request-builder';
import type { ApiResponse } from '@api/interface/api-client.interface';

/** Verified against the employer frontend endpoint catalogue. */
export const ACCOUNT_ENDPOINTS = {
  login: '/api/Account/LogIn',
  sendOtp: '/api/Account/SendOTP',
  verifyOtp: '/api/Account/VerifyOTP',
  refreshToken: '/api/Account/RefreshToken',
  changePassword: '/api/Account/ChangePassword',
} as const;

export interface LoginRequest {
  [key: string]: unknown;
}

/** Shape unconfirmed - widen/narrow once a real response is captured. */
export interface LoginResponse {
  [key: string]: unknown;
}

export class AuthService extends AbstractService {
  constructor() {
    super('account');
  }

  async login(payload: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.execute<LoginResponse>(
      RequestBuilder.post(ACCOUNT_ENDPOINTS.login).withBody(payload).build(),
    );
  }

  async refreshToken(payload: Record<string, unknown>): Promise<ApiResponse<LoginResponse>> {
    return this.execute<LoginResponse>(
      RequestBuilder.post(ACCOUNT_ENDPOINTS.refreshToken).withBody(payload).build(),
    );
  }
}
