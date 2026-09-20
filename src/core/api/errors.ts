import { isAxiosError, isCancel } from 'axios';
import { ZodError } from 'zod';

export type AppErrorKind = 'network' | 'timeout' | 'http' | 'validation' | 'cancelled' | 'unknown';

/** The one error shape every failure on the REST path is normalized to (ADR-M12). */
export interface AppErrorInfo {
  kind: AppErrorKind;
  message: string;
  /** HTTP status, when the server answered. */
  status?: number;
  /** Whether repeating the same request could plausibly succeed. */
  retryable: boolean;
  /** Key in the `common` i18n namespace for a user-facing message. */
  i18nKey: string;
}

// Transient statuses only; a 4xx such as 400/404 would fail identically on every retry.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export class AppError extends Error implements AppErrorInfo {
  readonly kind: AppErrorKind;
  readonly status?: number;
  readonly retryable: boolean;
  readonly i18nKey: string;

  constructor(info: Omit<AppErrorInfo, 'i18nKey'> & { i18nKey?: string }, options?: { cause?: unknown }) {
    super(info.message, options);
    this.name = 'AppError';
    this.kind = info.kind;
    this.status = info.status;
    this.retryable = info.retryable;
    this.i18nKey = info.i18nKey ?? `errors.${info.kind}`;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (isCancel(error)) {
    return new AppError(
      { kind: 'cancelled', message: 'Request cancelled', retryable: false },
      { cause: error }
    );
  }

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new AppError(
        { kind: 'timeout', message: 'Request timed out', retryable: true },
        { cause: error }
      );
    }
    const status = error.response?.status;
    if (status !== undefined) {
      return new AppError(
        {
          kind: 'http',
          status,
          message: `Request failed with status ${status}`,
          retryable: RETRYABLE_STATUS.has(status),
          i18nKey: status >= 500 ? 'errors.server' : 'errors.http',
        },
        { cause: error }
      );
    }
    return new AppError(
      { kind: 'network', message: 'Network unreachable', retryable: true },
      { cause: error }
    );
  }

  if (error instanceof ZodError) {
    return new AppError(
      { kind: 'validation', message: 'Response did not match the expected contract', retryable: false },
      { cause: error }
    );
  }

  return new AppError(
    { kind: 'unknown', message: error instanceof Error ? error.message : String(error), retryable: false },
    { cause: error }
  );
}
