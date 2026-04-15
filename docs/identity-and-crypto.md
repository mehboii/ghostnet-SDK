# Identity & Cryptography

## Overview

GhostNet uses a layered cryptographic identity system:

```
BIP-39 Seed Phrase (12 words)
  └── Ed25519 Keypair (signing & identity)
        ├── Public Key → BLAKE3 hash → Node ID
        └── X25519 Keypair (encryption, derived from Ed25519)
```

## Identity Generation

### Step 1: Seed Phrase

A 12-word BIP-39 mnemonic is generated using cryptographically secure randomness. This is the master secret — everything else is deterministically derived from it.

```ts
const identity = gn.createIdentity();
// identity.seedPhrase = "abandon ability able about above absent ..."
```

### Step 2: Key Derivation

The BIP-39 seed (64 bytes) is derived from the mnemonic. The first 32 bytes become the Ed25519 private key seed.

```
mnemonic → BIP-39 seed (64 bytes) → first 32 bytes → Ed25519 seed
```

### Step 3: Ed25519 Keypair

The Ed25519 public key is derived from the seed. This keypair is used for identity verification.

### Step 4: Node ID

The node ID is the BLAKE3 hash of the Ed25519 public key, prefixed with `0x`:

```
nodeId = "0x" + BLAKE3(publicKey)
```

This is your address on the mesh. Share it freely — it's public.

### Step 5: X25519 Keys (for Encryption)

Ed25519 keys are converted to X25519 keys for Diffie-Hellman key exchange using the birational Edwards-to-Montgomery map:

```
Ed25519 private → X25519 private (edwardsToMontgomeryPriv)
Ed25519 public  → X25519 public  (edwardsToMontgomeryPub)
```

## Encryption Scheme

Messages use **hybrid encryption** with ephemeral keys:

```
                    Sender                              Recipient
                    ------                              ---------
1. Generate ephemeral X25519 keypair
2. ECDH(ephemeral_priv, recipient_pub) → shared_secret
3. HKDF-SHA256(shared_secret, info="ghostnet-packet-encryption") → AES key
4. AES-256-GCM(AES key, random nonce, plaintext) → ciphertext
5. Send: [ephemeral_pub | nonce | ciphertext + auth_tag]

                                                 6. Extract ephemeral_pub, nonce, ciphertext
                                                 7. ECDH(recipient_priv, ephemeral_pub) → shared_secret
                                                 8. HKDF-SHA256(shared_secret) → AES key
                                                 9. AES-256-GCM decrypt → plaintext
```

### Packet Format

```
Byte offset  Length  Field
──────────── ──────  ─────
0            32      Ephemeral X25519 public key
32           12      AES-GCM nonce (random)
44           var     Ciphertext + GCM authentication tag (16 bytes)
```

### Why Ephemeral Keys?

Every message generates a new random X25519 keypair. This provides:

- **Forward secrecy**: Compromising a long-term key doesn't reveal past messages
- **No key reuse**: Each message uses a unique AES key
- **Ciphertext unlinkability**: Two messages to the same recipient look unrelated

## Cryptographic Primitives

| Primitive          | Algorithm      | Library          | Purpose                     |
| ------------------ | -------------- | ---------------- | --------------------------- |
| Seed phrase        | BIP-39         | `bip39`          | Human-readable master secret |
| Signing key        | Ed25519        | `@noble/curves`  | Identity keypair            |
| Node ID            | BLAKE3         | `@noble/hashes`  | Public address              |
| Key exchange       | X25519 ECDH    | `@noble/curves`  | Shared secret derivation    |
| Key derivation     | HKDF-SHA256    | `@noble/hashes`  | AES key from shared secret  |
| Message encryption | AES-256-GCM    | `@noble/ciphers` | Authenticated encryption    |

All crypto libraries are from the [noble](https://paulmillr.com/noble/) family — audited, zero-dependency, and cross-platform.

## Deterministic Restoration

The same seed phrase always produces the same identity:

```ts
const gn1 = new GhostNet();
const id1 = gn1.createIdentity();

const gn2 = new GhostNet();
const id2 = gn2.loadIdentity(id1.seedPhrase);

id1.nodeId === id2.nodeId;       // true
id1.publicKey === id2.publicKey; // true
```

This means identities are portable across devices, platforms, and SDK versions.

## Security Properties

| Property               | Status  | Notes                                          |
| ---------------------- | ------- | ---------------------------------------------- |
| Forward secrecy        | Yes     | Ephemeral keys per message                     |
| Authenticated encryption | Yes   | AES-256-GCM with auth tag                      |
| Key isolation          | Yes     | Signing keys (Ed25519) separate from encryption keys (X25519) |
| Seed zeroing           | Partial | Best-effort memory zeroing after derivation     |
| Private key protection | Yes     | Non-enumerable, excluded from JSON serialization |
| No telemetry           | Yes     | SDK sends zero analytics or diagnostics         |
