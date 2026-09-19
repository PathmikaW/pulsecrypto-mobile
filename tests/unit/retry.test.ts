import { QueryClient } from '@tanstack/react-query';
import { AppError } from '../../src/core/api/errors';
import { queryClient } from '../../src/core/api/queryClient';
import { MAX_RETRIES, retryDelayMs, shouldRetry } from '../../src/core/api/retry';

const transient = () => new AppError({ kind: 'network', message: 'down', retryable: true });
const permanent = () => new AppError({ kind: 'http', status: 404, message: 'nope', retryable: false });

describe('shouldRetry', () => {
  it('retries retryable errors until the retry budget is spent', () => {
    for (let failureCount = 0; failureCount < MAX_RETRIES; failureCount++) {
      expect(shouldRetry(failureCount, transient())).toBe(true);
    }
    expect(shouldRetry(MAX_RETRIES, transient())).toBe(false);
  });

  it('never retries a non-retryable error', () => {
    expect(shouldRetry(0, permanent())).toBe(false);
  });
});

describe('retryDelayMs', () => {
  it('grows with the attempt and stays within the REST backoff cap (+jitter)', () => {
    const delays = [0, 1, 2, 3, 10].map(retryDelayMs);
    expect(delays[0]).toBeGreaterThanOrEqual(400);
    expect(delays[0]).toBeLessThanOrEqual(600);
    expect(delays[4]).toBeLessThanOrEqual(9600);
  });
});

describe('the app QueryClient retry wiring', () => {
  const defaults = queryClient.getDefaultOptions().queries!;
  const clients: QueryClient[] = [];
  // gcTime 0 and clear() so the cache's 5-minute garbage-collection timers can't keep Jest alive.
  const fastClient = () => {
    const client = new QueryClient({
      defaultOptions: { queries: { ...defaults, retryDelay: 1, gcTime: 0 } },
    });
    clients.push(client);
    return client;
  };

  afterEach(() => {
    clients.splice(0).forEach((client) => client.clear());
  });

  it('uses the shared policy', () => {
    expect(defaults.retry).toBe(shouldRetry);
    expect(defaults.retryDelay).toBe(retryDelayMs);
  });

  it('retries a transient failure and resolves once the request succeeds', async () => {
    const queryFn = jest
      .fn()
      .mockRejectedValueOnce(transient())
      .mockRejectedValueOnce(transient())
      .mockResolvedValue('data');

    await expect(fastClient().fetchQuery({ queryKey: ['a'], queryFn })).resolves.toBe('data');
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it('gives up after 1 + MAX_RETRIES attempts on a persistent transient failure', async () => {
    const queryFn = jest.fn().mockRejectedValue(transient());

    await expect(fastClient().fetchQuery({ queryKey: ['b'], queryFn })).rejects.toBeInstanceOf(AppError);
    expect(queryFn).toHaveBeenCalledTimes(1 + MAX_RETRIES);
  });

  it('does not retry a permanent failure', async () => {
    const queryFn = jest.fn().mockRejectedValue(permanent());

    await expect(fastClient().fetchQuery({ queryKey: ['c'], queryFn })).rejects.toMatchObject({
      status: 404,
    });
    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
