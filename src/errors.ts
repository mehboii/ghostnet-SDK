/**
 * Base error class for all GhostNet SDK errors.
 *
 * @example
 * ```ts
 * try {
 *   await ghostnet.connect();
 * } catch (err) {
 *   if (err instanceof GhostNetError) {
 *     console.error(`[${err.code}] ${err.message}`);
 *   }
 * }
 * ```
 */
export class GhostNetError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'GhostNetError';
    this.code = code;
  }
}

/**
 * Thrown when a WebSocket connection fails or is unexpectedly closed.
 *
 * @example
 * ```ts
 * ghostnet.on('error', (err) => {
 *   if (err instanceof ConnectionError) {
 *     console.error('Connection lost:', err.message);
 *   }
 * });
 * ```
 */
export class ConnectionError extends GhostNetError {
  constructor(message: string) {
    super(message, 'ERR_CONNECTION');
    this.name = 'ConnectionError';
  }
}

/**
 * Thrown when identity creation or loading fails.
 *
 * @example
 * ```ts
 * try {
 *   const identity = ghostnet.loadIdentity('invalid words');
 * } catch (err) {
 *   if (err instanceof IdentityError) {
 *     console.error('Bad seed phrase:', err.message);
 *   }
 * }
 * ```
 */
export class IdentityError extends GhostNetError {
  constructor(message: string) {
    super(message, 'ERR_IDENTITY');
    this.name = 'IdentityError';
  }
}

/**
 * Thrown when message encryption or decryption fails.
 *
 * @example
 * ```ts
 * try {
 *   await ghostnet.send(peerId, 'hello');
 * } catch (err) {
 *   if (err instanceof EncryptionError) {
 *     console.error('Encryption failed:', err.message);
 *   }
 * }
 * ```
 */
export class EncryptionError extends GhostNetError {
  constructor(message: string) {
    super(message, 'ERR_ENCRYPTION');
    this.name = 'EncryptionError';
  }
}

/**
 * Thrown when a message is sent to an unknown or unreachable peer.
 *
 * @example
 * ```ts
 * try {
 *   await ghostnet.send('0xdeadbeef...', 'hello');
 * } catch (err) {
 *   if (err instanceof PeerNotFoundError) {
 *     console.error('Peer offline:', err.peerId);
 *   }
 * }
 * ```
 */
export class PeerNotFoundError extends GhostNetError {
  readonly peerId: string;

  constructor(peerId: string) {
    super(`Peer not found: ${peerId}`, 'ERR_PEER_NOT_FOUND');
    this.name = 'PeerNotFoundError';
    this.peerId = peerId;
  }
}
