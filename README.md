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

## API

### `new GhostNet(options?)`

| Option     | Type      | Default                            | Description             |
| ---------- | --------- | ---------------------------------- | ----------------------- |
| `endpoint` | `string`  | `wss://ghostnet-ji-production...`  | WebSocket relay URL     |
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
| `.send(peerId, message)`  | `Promise<void>` | Send encrypted message to a peer   |

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

## Crypto scheme

| Primitive         | Algorithm                        |
| ----------------- | -------------------------------- |
| Identity key      | Ed25519 (from BIP-39 seed)       |
| Node ID           | BLAKE3 hash of public key        |
| Key exchange      | X25519 ECDH (ephemeral keypair)  |
| Key derivation    | HKDF-SHA256                      |
| Message encryption| AES-256-GCM                      |

## Dependencies

| Package           | Why                                                    |
| ----------------- | ------------------------------------------------------ |
| `@noble/curves`   | Ed25519 + X25519 — audited, zero-dep, cross-platform   |
| `@noble/hashes`   | BLAKE3, HKDF, SHA-256 — same family, audited           |
| `bip39`           | BIP-39 mnemonic generation and validation              |
| `ws`              | WebSocket client for Node.js (browsers use native WS)  |

4 runtime deps. Zero peer deps.

## Roadmap

The following features are planned for future releases:

- **v0.2** — GhostNet Pay (micropayments over the mesh)
- **v0.2** — Ghost Radar (peer discovery)
- **v0.2** — Ghost Shield cloaking
- **v0.3** — Ghost Cards (portable identity cards)
- **v0.3** — Proximity Connect (local mesh via BLE/mDNS)

## License

[MIT](./LICENSE) — N11X Labs
