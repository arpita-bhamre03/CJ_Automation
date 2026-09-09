/**
 * Contract every API client implements. Services depend on this interface,
 * never on a concrete client, so the transport can be swapped without touching
 * service code.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  /** Path relative to the client base URL, e.g. '/api/Account/LogIn'. */
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
}

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
}

export interface IApiClient {
  send<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>>;
}
