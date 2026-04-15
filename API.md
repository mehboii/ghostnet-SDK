# API Reference — @n11x/ghostnet-sdk

Generated from TypeScript source. Only publicly exported symbols are listed.

## Entry Point

```
import { GhostNet, ... } from '@n11x/ghostnet-sdk';
```

Package exports (from `package.json`):
- ESM: `./dist/index.js` (types: `./dist/index.d.ts`)
- CJS: `./dist/index.cjs` (types: `./dist/index.d.cts`)

---

## Classes

### `GhostNet`

Main SDK client. Creates/restores identities, connects to the mesh relay, sends/receives E2E encrypted messages.

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `constructor` | `(options?: GhostNetOptions)` | `GhostNet` | Create client instance |
| `createIdentity` | `()` | `Identity` | Generate new BIP-39 identity |
| `loadIdentity` | `(seedPhrase: string)` | `Identity` | Restore identity from seed phrase |
| `getIdentity` | `()` | `Identity \| null` | Get current identity |
| `connect` | `()` | `Promise<void>` | Connect to relay (requires identity) |
| `disconnect` | `()` | `void` | Disconnect from relay |
| `send` | `(peerId: string, message: string)` | `Promise<void>` | Send encrypted message to peer |
| `on` | `<K>(event: K, handler: GhostNetEvents[K])` | `void` | Subscribe to event |
| `off` | `<K>(event: K, handler: GhostNetEvents[K])` | `void` | Unsubscribe from event |

---

## Error Classes

### `GhostNetError` (base)

| Property | Type | Description |
|----------|------|-------------|
| `code` | `string` | Error code identifier |
| `message` | `string` | Human-readable description |

### `ConnectionError` extends `GhostNetError`

Code: `ERR_CONNECTION`. Thrown on WebSocket connection failures.

### `IdentityError` extends `GhostNetError`

Code: `ERR_IDENTITY`. Thrown on invalid seed phrases or identity creation failures.

### `EncryptionError` extends `GhostNetError`

Code: `ERR_ENCRYPTION`. Thrown on encryption/decryption failures.

### `PeerNotFoundError` extends `GhostNetError`

Code: `ERR_PEER_NOT_FOUND`. Thrown when a peer is unreachable.

| Property | Type | Description |
|----------|------|-------------|
| `peerId` | `string` | The unreachable peer's node ID |

---

## Interfaces

### `GhostNetOptions`

```ts
interface GhostNetOptions {
  endpoint?: string;  // WebSocket URL (default: production relay, must be wss://)
  debug?: boolean;    // Enable debug logging (default: false)
}
```

### `Identity`

```ts
interface Identity {
  seedPhrase: string;           // 12-word BIP-39 mnemonic (non-enumerable)
  publicKeyBytes: Uint8Array;   // 32-byte Ed25519 public key
  publicKey: string;            // Hex-encoded public key
  privateKeyBytes: Uint8Array;  // 32-byte Ed25519 private seed (non-enumerable)
  nodeId: string;               // "0x" + BLAKE3(publicKey)
  dispose: () => void;          // Zeroes private key material
}
```

> `seedPhrase`, `privateKeyBytes`, and `dispose` are non-enumerable — they do not appear in `JSON.stringify()` or `console.log()` output.

### `IncomingMessage`

```ts
interface IncomingMessage {
  from: string;       // Sender's node ID
  data: string;       // Decrypted message payload
  timestamp: number;  // Server timestamp (ms since epoch)
}
```

### `GhostNetEvents`

```ts
interface GhostNetEvents {
  message: (msg: IncomingMessage) => void;
  error: (err: Error) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
}
```

---

## Internal Symbols (not exported)

The following are marked `@internal` and excluded from public type declarations:

- `Logger` — Debug logger class
- `Transport` — WebSocket wrapper with reconnect
- `sign()` / `verify()` — Ed25519 signing primitives
- `edPrivateToX25519()` / `edPublicToX25519()` — Curve conversion helpers
- `encrypt()` / `decrypt()` — Hybrid encryption (X25519 + AES-256-GCM)
- `createIdentity()` / `loadIdentity()` — Raw identity derivation (use `GhostNet` methods instead)
