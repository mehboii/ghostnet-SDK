import { ConnectionError } from './errors.js';
import { Logger } from './logger.js';

const DEFAULT_RECONNECT_BASE_MS = 1000;
const DEFAULT_RECONNECT_MAX_MS = 30_000;
const DEFAULT_RECONNECT_FACTOR = 2;

export interface TransportEvents {
  open: () => void;
  close: (reason: string) => void;
  message: (data: Uint8Array | string) => void;
  error: (err: Error) => void;
}

type EventName = keyof TransportEvents;

/**
 * WebSocket wrapper with automatic reconnect and exponential backoff.
 *
 * Works with both the browser `WebSocket` global and the `ws` npm package
 * in Node.js. Detection is automatic — no configuration needed.
 *
 * @example
 * ```ts
 * const transport = new Transport('wss://relay.ghostnet.dev', logger);
 * transport.on('message', (data) => console.log(data));
 * await transport.connect();
 * ```
 */
export class Transport {
  private url: string;
  private logger: Logger;
  private ws: WebSocket | null = null;
  private listeners: { [K in EventName]: Set<TransportEvents[K]> } = {
    open: new Set(),
    close: new Set(),
    message: new Set(),
    error: new Set(),
  };
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  constructor(url: string, logger: Logger) {
    this.url = url;
    this.logger = logger;
  }

  /**
   * Register an event listener.
   *
   * @example
   * ```ts
   * transport.on('open', () => console.log('connected'));
   * ```
   */
  on<K extends EventName>(event: K, handler: TransportEvents[K]): void {
    this.listeners[event].add(handler);
  }

  /**
   * Remove an event listener.
   *
   * @example
   * ```ts
   * transport.off('open', myHandler);
   * ```
   */
  off<K extends EventName>(event: K, handler: TransportEvents[K]): void {
    this.listeners[event].delete(handler);
  }

  /**
   * Open the WebSocket connection. Resolves when the socket is open,
   * rejects if the initial connection fails.
   *
   * @example
   * ```ts
   * await transport.connect();
   * ```
   */
  async connect(): Promise<void> {
    this.intentionalClose = false;
    return this.createSocket();
  }

  /**
   * Gracefully close the WebSocket. Disables reconnect.
   *
   * @example
   * ```ts
   * transport.disconnect();
   * ```
   */
  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close(1000, 'client disconnect');
      this.ws = null;
    }
  }

  /**
   * Send raw data over the open socket.
   *
   * @throws {ConnectionError} If the socket is not open.
   *
   * @example
   * ```ts
   * transport.send(JSON.stringify({ type: 'msg', payload: '...' }));
   * ```
   */
  send(data: string | Uint8Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new ConnectionError('WebSocket is not connected');
    }
    this.ws.send(data);
  }

  /** Whether the socket is currently open. */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private createSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Connecting to ${this.url}`);

      // Use native WebSocket in browsers, ws package in Node
      const WS = typeof globalThis.WebSocket !== 'undefined'
        ? globalThis.WebSocket
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- conditional require for Node.js; dynamic import() cannot be used synchronously here
        : (require('ws') as typeof WebSocket);

      const ws = new WS(this.url);
      // Node ws needs binaryType set for Uint8Array
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        this.ws = ws;
        this.reconnectAttempt = 0;
        this.logger.debug('Connected');
        this.emit('open');
        resolve();
      };

      ws.onclose = (event: CloseEvent) => {
        const reason = event.reason || `code ${event.code}`;
        this.logger.debug(`Disconnected: ${reason}`);
        this.ws = null;
        this.emit('close', reason);

        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      };

      ws.onerror = () => {
        const err = new ConnectionError(`WebSocket error on ${this.url}`);
        this.emit('error', err);
        // If this is the initial connection attempt, reject the promise.
        if (!this.ws) {
          reject(err);
        }
      };

      ws.onmessage = (event: MessageEvent) => {
        const data = event.data instanceof ArrayBuffer
          ? new Uint8Array(event.data)
          : (event.data as string);
        this.emit('message', data);
      };
    });
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      DEFAULT_RECONNECT_BASE_MS * (DEFAULT_RECONNECT_FACTOR ** this.reconnectAttempt),
      DEFAULT_RECONNECT_MAX_MS,
    );
    this.reconnectAttempt++;
    this.logger.debug(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);

    this.reconnectTimer = setTimeout(() => {
      this.createSocket().catch((err: unknown) => {
        this.logger.warn(`Reconnect failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emit<K extends EventName>(event: K, ...args: Parameters<TransportEvents[K]>): void {
    for (const handler of this.listeners[event]) {
      (handler as (...a: unknown[]) => void)(...args);
    }
  }
}
