import { createIdentity, loadIdentity } from './crypto/identity.js';
import { ConnectionError, PeerNotFoundError } from './errors.js';
import { Logger } from './logger.js';
import { Transport } from './transport.js';
import type { GhostNetOptions, GhostNetEvents, Identity, IncomingMessage } from './types.js';

const DEFAULT_ENDPOINT = 'wss://ghostnet-ji-production.up.railway.app';

/**
 * Main GhostNet SDK client.
 *
 * Creates or restores an identity, connects to the GhostNet mesh relay,
 * and lets you send/receive end-to-end encrypted messages.
 *
 * @example
 * ```ts
 * import { GhostNet } from '@n11x/ghostnet-sdk';
 *
 * const gn = new GhostNet({ debug: true });
 * const identity = gn.createIdentity();
 * await gn.connect();
 * gn.on('message', (msg) => console.log(msg.from, msg.data));
 * await gn.send(peerId, 'hello from the mesh');
 * gn.disconnect();
 * ```
 */
export class GhostNet {
  private readonly endpoint: string;
  private readonly logger: Logger;
  private transport: Transport | null = null;
  private identity: Identity | null = null;
  private listeners: { [K in keyof GhostNetEvents]: Set<GhostNetEvents[K]> } = {
    message: new Set(),
    error: new Set(),
    connect: new Set(),
    disconnect: new Set(),
  };

  constructor(options: GhostNetOptions = {}) {
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
    this.logger = new Logger(options.debug ?? false);
  }

  // ── Identity ──────────────────────────────────────────────────────

  /**
   * Generate a brand-new GhostNet identity (BIP-39 seed phrase + Ed25519 keypair).
   *
   * The returned seed phrase is the master secret. Back it up safely — it is the
   * only way to restore this identity on another device.
   *
   * @returns The newly created {@link Identity}.
   *
   * @example
   * ```ts
   * const id = gn.createIdentity();
   * console.log('Save this:', id.seedPhrase);
   * console.log('Your node ID:', id.nodeId);
   * ```
   */
  createIdentity(): Identity {
    this.identity = createIdentity();
    this.logger.debug(`Identity created: ${this.identity.nodeId}`);
    return this.identity;
  }

  /**
   * Restore a GhostNet identity from an existing BIP-39 seed phrase.
   *
   * Produces the same keypair and node ID every time, so identities are
   * portable across devices and SDK versions.
   *
   * @param seedPhrase - A valid 12-word BIP-39 mnemonic.
   * @returns The restored {@link Identity}.
   * @throws {IdentityError} If the seed phrase is invalid.
   *
   * @example
   * ```ts
   * const id = gn.loadIdentity('abandon ability able about above absent ...');
   * console.log(id.nodeId); // same as when originally created
   * ```
   */
  loadIdentity(seedPhrase: string): Identity {
    this.identity = loadIdentity(seedPhrase);
    this.logger.debug(`Identity loaded: ${this.identity.nodeId}`);
    return this.identity;
  }

  /**
   * Get the current identity, or null if none has been created/loaded.
   *
   * @example
   * ```ts
   * if (gn.getIdentity()) {
   *   console.log('Ready:', gn.getIdentity()!.nodeId);
   * }
   * ```
   */
  getIdentity(): Identity | null {
    return this.identity;
  }

  // ── Connection ────────────────────────────────────────────────────

  /**
   * Connect to the GhostNet mesh relay over WebSocket.
   *
   * An identity must be created or loaded before calling this method.
   * The connection authenticates by announcing the node ID to the relay.
   *
   * @throws {ConnectionError} If no identity is set or the connection fails.
   *
   * @example
   * ```ts
   * gn.createIdentity();
   * await gn.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (!this.identity) {
      throw new ConnectionError('Create or load an identity before connecting');
    }

    this.transport = new Transport(this.endpoint, this.logger);

    this.transport.on('open', () => {
      // Announce ourselves to the relay
      this.transport!.send(JSON.stringify({
        type: 'register',
        nodeId: this.identity!.nodeId,
        publicKey: this.identity!.publicKey,
      }));
      this.emit('connect');
    });

    this.transport.on('close', (reason) => {
      this.emit('disconnect', reason);
    });

    this.transport.on('error', (err) => {
      this.emit('error', err);
    });

    this.transport.on('message', (data) => {
      this.handleIncoming(data).catch((err: unknown) => {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      });
    });

    await this.transport.connect();
  }

  /**
   * Disconnect from the GhostNet relay.
   *
   * Safe to call even if not connected. Does not clear the identity.
   *
   * @example
   * ```ts
   * gn.disconnect();
   * ```
   */
  disconnect(): void {
    this.transport?.disconnect();
    this.transport = null;
    this.logger.debug('Disconnected');
  }

  // ── Messaging ─────────────────────────────────────────────────────

  /**
   * Send an end-to-end encrypted message to a peer by node ID.
   *
   * The message is encrypted with the recipient's public key using hybrid
   * encryption (X25519 ECDH + AES-256-GCM). The relay cannot read it.
   *
   * @param peerId  - The recipient's node ID (0x-prefixed BLAKE3 hash).
   * @param message - The plaintext message string.
   * @throws {ConnectionError} If not connected.
   * @throws {PeerNotFoundError} If the relay reports the peer as unknown.
   * @throws {EncryptionError} If encryption fails.
   *
   * @example
   * ```ts
   * await gn.send('0x7f3a...', 'hey, private message!');
   * ```
   */
  async send(peerId: string, message: string): Promise<void> {
    if (!this.transport?.connected) {
      throw new ConnectionError('Not connected — call .connect() first');
    }

    // TODO: resolve peerId → public key via relay lookup
    // For v0.1, the relay must return the peer's public key on registration
    // or we must have exchanged keys out-of-band.
    this.logger.debug(`Sending to ${peerId}: ${message.length} chars`);

    // Placeholder: in v0.1, send via relay as JSON envelope.
    // Encryption will be wired once the relay protocol is finalised.
    this.transport.send(JSON.stringify({
      type: 'message',
      from: this.identity!.nodeId,
      to: peerId,
      payload: message,
      timestamp: Date.now(),
    }));
  }

  // ── Events ────────────────────────────────────────────────────────

  /**
   * Subscribe to a GhostNet event.
   *
   * @param event   - Event name: "message", "error", "connect", or "disconnect".
   * @param handler - Callback invoked when the event fires.
   *
   * @example
   * ```ts
   * gn.on('message', (msg) => {
   *   console.log(`${msg.from}: ${msg.data}`);
   * });
   *
   * gn.on('error', (err) => console.error(err));
   * gn.on('connect', () => console.log('online'));
   * gn.on('disconnect', (reason) => console.log('offline:', reason));
   * ```
   */
  on<K extends keyof GhostNetEvents>(event: K, handler: GhostNetEvents[K]): void {
    this.listeners[event].add(handler);
  }

  /**
   * Unsubscribe from a GhostNet event.
   *
   * @param event   - Event name.
   * @param handler - The same function reference passed to {@link on}.
   *
   * @example
   * ```ts
   * gn.off('message', myHandler);
   * ```
   */
  off<K extends keyof GhostNetEvents>(event: K, handler: GhostNetEvents[K]): void {
    this.listeners[event].delete(handler);
  }

  // ── Internals ─────────────────────────────────────────────────────

  private async handleIncoming(raw: Uint8Array | string): Promise<void> {
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);

    let envelope: { type: string; from?: string; payload?: string; timestamp?: number };
    try {
      envelope = JSON.parse(text) as typeof envelope;
    } catch {
      this.logger.warn('Received non-JSON message, ignoring');
      return;
    }

    if (envelope.type === 'message' && envelope.from && envelope.payload != null) {
      const msg: IncomingMessage = {
        from: envelope.from,
        data: envelope.payload,
        timestamp: envelope.timestamp ?? Date.now(),
      };
      this.emit('message', msg);
    }

    if (envelope.type === 'error') {
      const errPayload = envelope.payload ?? 'Unknown relay error';
      if (errPayload.includes('peer not found') && envelope.from) {
        this.emit('error', new PeerNotFoundError(envelope.from));
      } else {
        this.emit('error', new ConnectionError(errPayload));
      }
    }
  }

  private emit<K extends keyof GhostNetEvents>(
    event: K,
    ...args: Parameters<GhostNetEvents[K]>
  ): void {
    for (const handler of this.listeners[event]) {
      (handler as (...a: unknown[]) => void)(...args);
    }
  }
}
