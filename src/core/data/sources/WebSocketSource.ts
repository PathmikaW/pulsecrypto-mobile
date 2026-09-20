import { computeBackoffMs } from '../../utils/backoff';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

const BACKOFF_BASE_MS = 1000;
const BACKOFF_CAP_MS = 30000;
const BACKOFF_JITTER_RATIO = 0.2;

export interface WebSocketSourceOptions {
  url: string;
  /** ~MAX_CONSECUTIVE_SKIPS * BROADCAST_INTERVAL_MS; mirrors the backend's eviction threshold (ADR-B4). */
  staleConnectionTimeoutMs?: number;
  onMessage: (raw: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  /** Called once a second with the messages received in that window. */
  onMessageRate?: (messagesPerSecond: number) => void;
  /** Injectable for tests — defaults to the global `WebSocket`. */
  createSocket?: (url: string) => WebSocket;
  /** Injectable clock for tests. */
  now?: () => number;
}

// Framework-agnostic connection state machine (ADR-M6): backoff + jitter reconnection and broadcast-silence liveness, no ping/pong.
// Separate from useWebSocket so it is unit-testable without React or a real socket.
export class WebSocketSource {
  private readonly url: string;
  private readonly staleConnectionTimeoutMs: number;
  private readonly onMessage: (raw: string) => void;
  private readonly onStatusChange: (status: ConnectionStatus) => void;
  private readonly onMessageRate?: (messagesPerSecond: number) => void;
  private readonly createSocket: (url: string) => WebSocket;
  private readonly now: () => number;

  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempt = 0;
  private lastMessageAt = 0;
  private messagesSinceLastRateTick = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private silenceCheckTimer: ReturnType<typeof setInterval> | null = null;
  private rateTimer: ReturnType<typeof setInterval> | null = null;
  private stopped = true;
  private backgroundPaused = false;

  constructor(options: WebSocketSourceOptions) {
    this.url = options.url;
    this.staleConnectionTimeoutMs = options.staleConnectionTimeoutMs ?? 1000;
    this.onMessage = options.onMessage;
    this.onStatusChange = options.onStatusChange;
    this.onMessageRate = options.onMessageRate;
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url));
    this.now = options.now ?? Date.now;
  }

  start(): void {
    this.stopped = false;
    this.connect();
    if (this.onMessageRate && !this.rateTimer) {
      this.rateTimer = setInterval(() => {
        this.onMessageRate?.(this.messagesSinceLastRateTick);
        this.messagesSinceLastRateTick = 0;
      }, 1000);
    }
  }

  /** Stops reconnection attempts and closes the active socket — used on app background. */
  stop(): void {
    this.stopped = true;
    this.clearReconnectTimer();
    this.clearSilenceCheck();
    if (this.rateTimer) {
      clearInterval(this.rateTimer);
      this.rateTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.setStatus('disconnected');
  }

  /** App backgrounded (ADR-M7): leave an active socket alone, but stop reconnecting if it drops. */
  pauseReconnectOnBackground(): void {
    this.backgroundPaused = true;
  }

  /** App foregrounded: resume reconnecting, immediately if already disconnected. */
  resumeOnForeground(): void {
    this.backgroundPaused = false;
    if (this.status === 'disconnected' && !this.stopped) {
      this.clearReconnectTimer();
      this.reconnectAttempt = 0;
      this.connect();
    }
  }

  private connect(): void {
    this.setStatus(this.reconnectAttempt === 0 ? 'connecting' : 'reconnecting');
    const socket = this.createSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.lastMessageAt = this.now();
      this.setStatus('connected');
      this.startSilenceCheck();
    };
    socket.onmessage = (event) => {
      this.lastMessageAt = this.now();
      this.messagesSinceLastRateTick += 1;
      this.onMessage(typeof event.data === 'string' ? event.data : String(event.data));
    };
    socket.onerror = () => {
      // onclose always follows onerror for WebSocket — reconnection is scheduled there.
    };
    socket.onclose = () => {
      this.clearSilenceCheck();
      if (this.stopped) return;
      this.setStatus('disconnected');
      this.scheduleReconnect();
    };
  }

  private startSilenceCheck(): void {
    this.clearSilenceCheck();
    this.silenceCheckTimer = setInterval(() => {
      if (this.now() - this.lastMessageAt > this.staleConnectionTimeoutMs) {
        this.clearSilenceCheck();
        this.setStatus('disconnected');
        this.socket?.close();
      }
    }, this.staleConnectionTimeoutMs / 2);
  }

  private clearSilenceCheck(): void {
    if (this.silenceCheckTimer) {
      clearInterval(this.silenceCheckTimer);
      this.silenceCheckTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.backgroundPaused) return;
    this.setStatus('reconnecting');
    const delay = this.nextBackoffDelay();
    this.reconnectAttempt += 1;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      if (!this.stopped) this.connect();
    }, delay);
  }

  private nextBackoffDelay(): number {
    return computeBackoffMs(this.reconnectAttempt, {
      baseMs: BACKOFF_BASE_MS,
      capMs: BACKOFF_CAP_MS,
      jitterRatio: BACKOFF_JITTER_RATIO,
    });
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.onStatusChange(status);
  }
}
