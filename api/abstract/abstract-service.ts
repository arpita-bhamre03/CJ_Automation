/**
 * Base class for every API service. Owns the client and the shared plumbing so
 * concrete services contain only their domain calls.
 */
import { CentraJobApiClient, type ApiService } from '@api/client/centrajob-api-client';
import type { ApiRequest, ApiResponse } from '@api/interface/api-client.interface';

export abstract class AbstractService {
  protected readonly client: CentraJobApiClient;

  protected constructor(service: ApiService) {
    this.client = new CentraJobApiClient(service);
  }

  protected async execute<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>> {
    return this.client.send<T>(request);
  }

  async dispose(): Promise<void> {
    await this.client.dispose();
  }
}
