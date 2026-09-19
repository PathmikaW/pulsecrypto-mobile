import { create, type AxiosAdapter, type AxiosInstance } from 'axios';
import { API_BASE_URL } from './config';
import { toAppError } from './errors';

// A stalled request must fail so the retry policy (retry.ts) can act on it; there is no default timeout.
export const REQUEST_TIMEOUT_MS = 10_000;

export interface ApiClientOptions {
  baseURL: string;
  timeoutMs?: number;
  /** Injectable for tests. */
  adapter?: AxiosAdapter;
}

export function createApiClient({
  baseURL,
  timeoutMs = REQUEST_TIMEOUT_MS,
  adapter,
}: ApiClientOptions): AxiosInstance {
  const instance = create({ baseURL, timeout: timeoutMs, headers: { Accept: 'application/json' }, adapter });

  // Every failure leaves the client as an AppError, so callers never inspect axios errors.
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(toAppError(error))
  );

  return instance;
}

/** The app's single API client. Only data sources (core/data/sources) use it — enforced by ESLint. */
export const apiClient = createApiClient({ baseURL: API_BASE_URL });
