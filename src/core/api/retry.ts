import { computeBackoffMs, type BackoffOptions } from '../utils/backoff';
import { toAppError } from './errors';

const REST_BACKOFF: BackoffOptions = { baseMs: 500, capMs: 8000, jitterRatio: 0.2 };

/** Retries after the first failure, so a persistently failing request is attempted 1 + MAX_RETRIES times. */
export const MAX_RETRIES = 3;

/** Signature matches TanStack Query's `retry` option (`failureCount` is the number of failures so far, 0-based). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < MAX_RETRIES && toAppError(error).retryable;
}

/** Signature matches TanStack Query's `retryDelay` option. */
export function retryDelayMs(failureCount: number): number {
  return computeBackoffMs(failureCount, REST_BACKOFF);
}
