import { AxiosError, CanceledError, type AxiosResponse } from 'axios';
import { z } from 'zod';
import { AppError, toAppError } from '../../src/core/api/errors';

function httpError(status: number): AxiosError {
  return new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse);
}

describe('toAppError', () => {
  it('maps a connection failure (no response) to a retryable network error', () => {
    const err = toAppError(new AxiosError('Network Error', 'ERR_NETWORK'));
    expect(err).toMatchObject({ kind: 'network', retryable: true, i18nKey: 'errors.network' });
  });

  it.each(['ECONNABORTED', 'ETIMEDOUT'])('maps %s to a retryable timeout', (code) => {
    expect(toAppError(new AxiosError('timeout', code))).toMatchObject({
      kind: 'timeout',
      retryable: true,
      i18nKey: 'errors.timeout',
    });
  });

  it.each([408, 429, 500, 502, 503, 504])('treats HTTP %i as retryable', (status) => {
    expect(toAppError(httpError(status))).toMatchObject({ kind: 'http', status, retryable: true });
  });

  it.each([400, 401, 403, 404, 422])('treats HTTP %i as not retryable', (status) => {
    expect(toAppError(httpError(status))).toMatchObject({ kind: 'http', status, retryable: false });
  });

  it('distinguishes server (5xx) from client (4xx) errors for the user-facing message', () => {
    expect(toAppError(httpError(503)).i18nKey).toBe('errors.server');
    expect(toAppError(httpError(404)).i18nKey).toBe('errors.http');
  });

  it('maps a cancelled request to a non-retryable cancellation', () => {
    expect(toAppError(new CanceledError())).toMatchObject({ kind: 'cancelled', retryable: false });
  });

  it('maps a contract-validation failure to a non-retryable validation error', () => {
    const zodError = z.object({ a: z.string() }).safeParse({}).error;
    expect(toAppError(zodError)).toMatchObject({ kind: 'validation', retryable: false });
  });

  it('maps anything else to a non-retryable unknown error, keeping the cause', () => {
    const cause = new Error('boom');
    const err = toAppError(cause);
    expect(err).toMatchObject({ kind: 'unknown', retryable: false, message: 'boom' });
    expect(err.cause).toBe(cause);
    expect(toAppError('a string')).toMatchObject({ kind: 'unknown', message: 'a string' });
  });

  it('returns an existing AppError unchanged', () => {
    const original = new AppError({ kind: 'network', message: 'x', retryable: true });
    expect(toAppError(original)).toBe(original);
  });
});
