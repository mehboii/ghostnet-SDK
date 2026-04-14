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
  /** Hex-encoded Ed25519 public key (64 hex chars). */
  publicKey: string;
  /** Hex-encoded Ed25519 private key (128 hex chars — 64-byte expanded seed). */
  privateKey: string;
  /** BLAKE3 hash of the public key, prefixed with "0x". */
  nodeId: string;
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
