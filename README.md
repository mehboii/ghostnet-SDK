# @n11x/ghostnet-sdk

TypeScript SDK for integrating with the **GhostNet** encrypted mesh network.

GhostNet is a privacy-first peer-to-peer mesh built by [N11X Labs](https://github.com/n11x).
This SDK lets third-party apps join the mesh as a node — inheriting end-to-end
encryption, identity management, and private messaging out of the box.

**Runtimes:** Node 18+, modern browsers, React Native.

## Install

```bash
npm install @n11x/ghostnet-sdk
```

## Quickstart

```ts
import { GhostNet } from '@n11x/ghostnet-sdk';

const gn = new GhostNet({ debug: true });

// Create a new identity (or restore with gn.loadIdentity(seedPhrase))
const identity = gn.createIdentity();
console.log('Node ID:', identity.nodeId);
console.log('Seed phrase:', identity.seedPhrase); // back this up!

// Connect to the mesh
await gn.connect();

// Listen for messages
gn.on('message', (msg) => {
  console.log(`${msg.from}: ${msg.data}`);
});

// Send an encrypted message to a peer
await gn.send('0x<peer-node-id>', 'hello from the mesh!');

// Disconnect when done
gn.disconnect();
```

## Documentation

| Guide | Description |
| --- | --- |
| [Getting Started](./docs/getting-started.md) | Installation, quickstart, and first steps |
| [API Reference](./docs/api-reference.md) | Full method and type documentation |
| [Identity & Crypto](./docs/identity-and-crypto.md) | How keys, encryption, and identity work |
| [Error Handling](./docs/error-handling.md) | Error types, codes, and recovery patterns |
| [Security Model](./docs/security.md) | Threat model, guarantees, and limitations |
| [Examples](./docs/examples.md) | Node.js, Express, React, and two-node chat |

## API

### `new GhostNet(options?)`

| Option     | Type      | Default                            | Description             |
| ---------- | --------- | ---------------------------------- | ----------------------- |
| `endpoint` | `string`  | `wss://ghostnet-ji-production...`  | WebSocket relay URL (wss:// only) |
| `debug`    | `boolean` | `false`                            | Enable console logging  |

### Identity

| Method                        | Returns    | Description                              |
| ----------------------------- | ---------- | ---------------------------------------- |
| `.createIdentity()`           | `Identity` | Generate a new BIP-39 identity           |
| `.loadIdentity(seedPhrase)`   | `Identity` | Restore identity from a 12-word mnemonic |
| `.getIdentity()`              | `Identity \| null` | Current identity                  |

### Connection

| Method          | Returns         | Description                  |
| --------------- | --------------- | ---------------------------- |
| `.connect()`    | `Promise<void>` | Connect to the mesh relay    |
| `.disconnect()`  | `void`          | Gracefully disconnect        |

### Messaging

| Method                    | Returns         | Description                        |
| ------------------------- | --------------- | ---------------------------------- |
| `.send(peerId, message)`  | `Promise<void>` | Send encrypted message to a peer (max 64 KB) |

### Events

| Event          | Payload                                  | Description            |
| -------------- | ---------------------------------------- | ---------------------- |
| `message`      | `{ from: string, data: string, timestamp: number }` | Incoming message |
| `error`        | `Error`                                  | Connection/crypto error|
| `connect`      | —                                        | Connected to relay     |
| `disconnect`   | `string` (reason)                        | Disconnected           |

### Errors

All errors extend `GhostNetError` (which extends `Error`):

- `ConnectionError` — WebSocket connection failures
- `IdentityError` — invalid seed phrase or key derivation failure
- `EncryptionError` — encrypt/decrypt failures
- `PeerNotFoundError` — unknown or unreachable peer (includes `.peerId`)

## Crypto Scheme

| Primitive         | Algorithm                        |
| ----------------- | -------------------------------- |
| Identity key      | Ed25519 (from BIP-39 seed)       |
| Node ID           | BLAKE3 hash of public key        |
| Key exchange      | X25519 ECDH (ephemeral keypair)  |
| Key derivation    | HKDF-SHA256                      |
| Message encryption| AES-256-GCM                      |

All crypto primitives use audited [noble](https://paulmillr.com/noble/) libraries (Cure53 audit).

## Dependencies

| Package           | Why                                                    |
| ----------------- | ------------------------------------------------------ |
| `@noble/ciphers`  | AES-256-GCM — audited, pure JS, cross-platform         |
| `@noble/curves`   | Ed25519 + X25519 — audited, zero-dep, cross-platform   |
| `@noble/hashes`   | BLAKE3, HKDF, SHA-256 — same family, audited           |
| `bip39`           | BIP-39 mnemonic generation and validation              |
| `ws`              | WebSocket client for Node.js (browsers use native WS)  |

5 runtime deps. Zero peer deps.

## Security

- E2E encrypted messaging (X25519 + AES-256-GCM)
- Forward secrecy via ephemeral keys
- Private keys excluded from JSON serialization
- `wss://` enforced — insecure endpoints rejected
- No telemetry, no analytics, no phone-home
- 64 KB message size limit
- See [Security Model](./docs/security.md) for full details

## Roadmap

The following features are planned for future releases:

- **v0.2** — GhostNet Pay (micropayments over the mesh)
- **v0.2** — Ghost Radar (peer discovery)
- **v0.2** — Ghost Shield cloaking
- **v0.3** — Ghost Cards (portable identity cards)
- **v0.3** — Proximity Connect (local mesh via BLE/mDNS)

## License

[MIT](./LICENSE) — N11X Labs
