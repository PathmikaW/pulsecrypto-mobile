import { WebSocketSource } from '../../src/core/data/sources/WebSocketSource';

class MockSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;
  close() {
    this.closed = true;
    this.onclose?.();
  }
}

describe('WebSocketSource', () => {
  let now: number;
  let sockets: MockSocket[];
  let statuses: string[];
  let messages: string[];
  let rates: number[];

  beforeEach(() => {
    jest.useFakeTimers();
    now = 0;
    sockets = [];
    statuses = [];
    messages = [];
    rates = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createSource(staleMs = 1000) {
    return new WebSocketSource({
      url: 'ws://test',
      staleConnectionTimeoutMs: staleMs,
      onMessage: (raw) => messages.push(raw),
      onStatusChange: (status) => statuses.push(status),
      onMessageRate: (rate) => rates.push(rate),
      now: () => now,
      createSocket: () => {
        const socket = new MockSocket();
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
    });
  }

  it('transitions connecting -> connected on open, and forwards raw messages', () => {
    const source = createSource();
    source.start();
    expect(statuses).toEqual(['connecting']);

    sockets[0].onopen?.();
    expect(statuses).toEqual(['connecting', 'connected']);

    sockets[0].onmessage?.({ data: '{"pair":"BTCUSDT"}' });
    expect(messages).toEqual(['{"pair":"BTCUSDT"}']);

    source.stop();
  });

  it('reconnects with exponential backoff after the socket closes unexpectedly', () => {
    const source = createSource();
    source.start();
    sockets[0].onopen?.();

    sockets[0].onclose?.();
    expect(statuses[statuses.length - 1]).toBe('reconnecting');
    expect(sockets).toHaveLength(1);

    jest.advanceTimersByTime(1300); // base 1000ms + max 20% jitter
    expect(sockets).toHaveLength(2);

    source.stop();
  });

  it('treats the connection as dead once broadcast silence exceeds the stale timeout, with no ping/pong involved', () => {
    const source = createSource(1000);
    source.start();
    sockets[0].onopen?.();
    expect(statuses).toEqual(['connecting', 'connected']);

    now += 1500; // no message received in this window
    jest.advanceTimersByTime(600); // silence check runs every staleMs/2 = 500ms

    // The mock socket's close() fires onclose synchronously, so the state machine moves
    // straight through 'disconnected' into 'reconnecting' within this same tick — a real
    // socket's close event is async, so 'disconnected' would be visibly held briefly, but
    // the transition sequence itself is identical either way.
    expect(statuses).toContain('disconnected');
    expect(statuses[statuses.length - 1]).toBe('reconnecting');
    expect(sockets[0].closed).toBe(true);

    source.stop();
  });

  it('does not reconnect while paused for backgrounding', () => {
    const source = createSource();
    source.start();
    sockets[0].onopen?.();

    source.pauseReconnectOnBackground();
    sockets[0].onclose?.();

    jest.advanceTimersByTime(10_000);
    expect(sockets).toHaveLength(1); // no reconnect attempted while backgrounded

    source.stop();
  });

  it('resumeOnForeground reconnects immediately if disconnected, bypassing the backoff wait', () => {
    const source = createSource();
    source.start();
    sockets[0].onopen?.();
    source.pauseReconnectOnBackground();
    sockets[0].onclose?.();
    expect(sockets).toHaveLength(1);

    source.resumeOnForeground();
    expect(sockets).toHaveLength(2);

    source.stop();
  });

  it('reports the message count received in each 1s window via onMessageRate', () => {
    const source = createSource();
    source.start();
    sockets[0].onopen?.();

    sockets[0].onmessage?.({ data: '1' });
    sockets[0].onmessage?.({ data: '2' });
    sockets[0].onmessage?.({ data: '3' });
    jest.advanceTimersByTime(1000);

    expect(rates).toEqual([3]);

    sockets[0].onmessage?.({ data: '4' });
    jest.advanceTimersByTime(1000);

    expect(rates).toEqual([3, 1]);

    source.stop();
  });

  it('stop() tears down the socket and stops further reconnection attempts', () => {
    const source = createSource();
    source.start();
    sockets[0].onopen?.();

    source.stop();
    expect(statuses[statuses.length - 1]).toBe('disconnected');

    jest.advanceTimersByTime(10_000);
    expect(sockets).toHaveLength(1); // stop() closed the socket without scheduling a reconnect
  });
});
