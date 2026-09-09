/**
 * Fluent builder for API requests. Keeps header/auth/body assembly out of
 * services and tests.
 */
import type { ApiRequest, HttpMethod } from '@api/interface/api-client.interface';

export class RequestBuilder {
  private request: ApiRequest;

  private constructor(method: HttpMethod, path: string) {
    this.request = { method, path, headers: { 'Content-Type': 'application/json' } };
  }

  static get(path: string): RequestBuilder {
    return new RequestBuilder('GET', path);
  }

  static post(path: string): RequestBuilder {
    return new RequestBuilder('POST', path);
  }

  static put(path: string): RequestBuilder {
    return new RequestBuilder('PUT', path);
  }

  static patch(path: string): RequestBuilder {
    return new RequestBuilder('PATCH', path);
  }

  static delete(path: string): RequestBuilder {
    return new RequestBuilder('DELETE', path);
  }

  withHeader(name: string, value: string): this {
    this.request.headers = { ...this.request.headers, [name]: value };
    return this;
  }

  withBearerToken(token: string): this {
    return this.withHeader('Authorization', `Bearer ${token}`);
  }

  withQuery(query: Record<string, string | number | boolean>): this {
    this.request.query = { ...this.request.query, ...query };
    return this;
  }

  withBody(body: unknown): this {
    this.request.body = body;
    return this;
  }

  build(): ApiRequest {
    return { ...this.request };
  }
}
