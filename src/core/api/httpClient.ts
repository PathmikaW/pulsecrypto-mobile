import { create, type AxiosAdapter } from 'axios';
import { API_BASE_URL } from './config';
import { toAppError } from './errors';

// A stalled request must fail so the retry policy (retry.ts) can act on it; fetch has no default timeout.
export const REQUEST_TIMEOUT_MS = 10_000;

export interface HttpClient {
  get<T>(path: string, options?: { signal?: AbortSignal }): Promise<T>;
}

export interface HttpClientOptions {
  baseURL: string;
  timeoutMs?: number;
  /** Injectable for tests. */
  adapter?: AxiosAdapter;
}

export function createHttpClient({
  baseURL,
  timeoutMs = REQUEST_TIMEOUT_MS,
  adapter,
}: HttpClientOptions): HttpClient {
  const instance = create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: 'application/json' },
    adapter,
  });

  // Every failure leaves this module as an AppError, so callers never inspect axios internals.
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(toAppError(error))
  );

  return {
    get: async <T>(path: string, options?: { signal?: AbortSignal }) =>
      (await instance.get<T>(path, { signal: options?.signal })).data,
  };
}

const httpClient = createHttpClient({ baseURL: API_BASE_URL });

export function httpGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return httpClient.get<T>(path, { signal });
}
