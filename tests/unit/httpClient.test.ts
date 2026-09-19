import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { createHttpClient } from '../../src/core/api/httpClient';
import { AppError } from '../../src/core/api/errors';

function respondWith(data: unknown): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

describe('createHttpClient', () => {
  it('GETs baseURL + path and returns the response body', async () => {
    const adapter = jest.fn(respondWith({ ok: true }));
    const client = createHttpClient({ baseURL: 'http://api.test', adapter });

    await expect(client.get('/pairs/meta')).resolves.toEqual({ ok: true });

    const config = adapter.mock.calls[0]![0];
    expect(config.baseURL).toBe('http://api.test');
    expect(config.url).toBe('/pairs/meta');
    expect(config.method).toBe('get');
    expect(config.timeout).toBeGreaterThan(0);
  });

  it('turns an HTTP failure into an AppError with the status', async () => {
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('failed', 'ERR_BAD_RESPONSE', config, undefined, {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {},
        config,
        data: {},
      });
    };
    const client = createHttpClient({ baseURL: 'http://api.test', adapter });

    const error = await client.get('/pairs/meta').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ kind: 'http', status: 503, retryable: true });
  });

  it('turns a connection failure into a retryable network AppError', async () => {
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    };
    const client = createHttpClient({ baseURL: 'http://api.test', adapter });

    await expect(client.get('/pairs/meta')).rejects.toMatchObject({ kind: 'network', retryable: true });
  });

  it('turns a timeout into a retryable timeout AppError', async () => {
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED', config);
    };
    const client = createHttpClient({ baseURL: 'http://api.test', adapter });

    await expect(client.get('/pairs/meta')).rejects.toMatchObject({ kind: 'timeout', retryable: true });
  });
});
