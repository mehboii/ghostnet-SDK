/** Configuration options for the GhostNet client. */
export interface GhostNetOptions {
  /** WebSocket endpoint URL. Defaults to the production GhostNet relay. */
  endpoint?: string;
  /** Enable debug logging to console. Defaults to false. */
  debug?: boolean;
}

/** An Ed25519 identity on the GhostNet mesh. */
export interface Identity {
  /** BIP-39 mnemonic seed phrase (12 words). */
  seedPhrase: string;
  /** Raw 32-byte Ed25519 public key. */
  publicKeyBytes: Uint8Array;
  /** Hex-encoded Ed25519 public key (64 hex chars). For display/transmission only. */
  publicKey: string;
  /** Raw 32-byte Ed25519 private key seed. Zeroed on dispose(). */
  privateKeyBytes: Uint8Array;
  /** BLAKE3 hash of the public key, prefixed with "0x". */
  nodeId: string;
  /** Zero all secret key material. Call when identity is no longer needed. */
  dispose: () => void;
}

/** An incoming decrypted message from a peer. */
export interface IncomingMessage {
  /** Node ID of the sender. */
  from: string;
  /** Decrypted message payload as a UTF-8 string. */
  data: string;
  /** Server-assigned timestamp (ms since epoch). */
  timestamp: number;
}

/** Event map for the GhostNet client. */
export interface GhostNetEvents {
  message: (msg: IncomingMessage) => void;
  error: (err: Error) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
}
