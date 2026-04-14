import { x25519, edwardsToMontgomeryPub, edwardsToMontgomeryPriv } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from '@noble/hashes/utils';
import { EncryptionError } from '../errors.js';

const HKDF_INFO = new TextEncoder().encode('ghostnet-packet-encryption');

/** Copy a Uint8Array into a fresh ArrayBuffer (satisfies Web Crypto's BufferSource type). */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return buf;
}
const NONCE_LENGTH = 12;
const KEY_LENGTH = 32;
const EPHEMERAL_PUB_LENGTH = 32;

/**
 * Derive a 256-bit AES key from an X25519 shared secret via HKDF-SHA256.
 *
 * Uses the same `info` parameter as the main GhostNet app for compatibility.
 */
function deriveAesKey(sharedSecret: Uint8Array): Uint8Array {
  return hkdf(sha256, sharedSecret, undefined, HKDF_INFO, KEY_LENGTH);
}

/**
 * Import raw bytes as a CryptoKey for AES-GCM.
 * Works in browsers and Node 18+ (via globalThis.crypto).
 */
async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  // Copy into a fresh ArrayBuffer to satisfy Web Crypto's BufferSource type
  const buf = new ArrayBuffer(raw.byteLength);
  new Uint8Array(buf).set(raw);
  return globalThis.crypto.subtle.importKey(
    'raw',
    buf,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt a message for a recipient using hybrid encryption.
 *
 * Scheme (matches GhostNet main app):
 *   1. Generate ephemeral X25519 keypair
 *   2. ECDH with recipient's X25519 public key → shared secret
 *   3. HKDF-SHA256(shared secret, info="ghostnet-packet-encryption") → AES key
 *   4. AES-256-GCM encrypt the plaintext
 *   5. Output: [ephemeral pubkey 32B] + [nonce 12B] + [ciphertext+tag]
 *
 * @param plaintext  - UTF-8 message to encrypt.
 * @param recipientX25519Pub - Recipient's 32-byte X25519 public key.
 * @returns Encrypted packet as Uint8Array.
 *
 * @example
 * ```ts
 * const packet = await encrypt('hello', recipientPubBytes);
 * ```
 */
export async function encrypt(
  plaintext: string,
  recipientX25519Pub: Uint8Array,
): Promise<Uint8Array> {
  try {
    const ephemeralPriv = x25519.utils.randomPrivateKey();
    const ephemeralPub = x25519.getPublicKey(ephemeralPriv);
    const shared = x25519.getSharedSecret(ephemeralPriv, recipientX25519Pub);

    const aesKeyRaw = deriveAesKey(shared);
    const aesKey = await importAesKey(aesKeyRaw);
    const nonce = randomBytes(NONCE_LENGTH);

    const plaintextBytes = new TextEncoder().encode(plaintext);
    const ciphertext = new Uint8Array(
      await globalThis.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(nonce) },
        aesKey,
        toArrayBuffer(plaintextBytes),
      ),
    );

    // Pack: [ephemeral pub 32] [nonce 12] [ciphertext+tag]
    const packet = new Uint8Array(
      EPHEMERAL_PUB_LENGTH + NONCE_LENGTH + ciphertext.byteLength,
    );
    packet.set(ephemeralPub, 0);
    packet.set(nonce, EPHEMERAL_PUB_LENGTH);
    packet.set(ciphertext, EPHEMERAL_PUB_LENGTH + NONCE_LENGTH);
    return packet;
  } catch (err) {
    throw new EncryptionError(
      `Encryption failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Decrypt an incoming packet using the recipient's X25519 private key.
 *
 * Reverses the hybrid encryption scheme used by {@link encrypt}.
 *
 * @param packet  - The raw encrypted packet (ephemeral pub + nonce + ciphertext).
 * @param recipientX25519Priv - Recipient's 32-byte X25519 private key.
 * @returns Decrypted UTF-8 string.
 *
 * @example
 * ```ts
 * const message = await decrypt(packet, myPrivKeyBytes);
 * ```
 */
export async function decrypt(
  packet: Uint8Array,
  recipientX25519Priv: Uint8Array,
): Promise<string> {
  try {
    if (packet.length < EPHEMERAL_PUB_LENGTH + NONCE_LENGTH + 16) {
      throw new Error('Packet too short');
    }

    const ephemeralPub = packet.slice(0, EPHEMERAL_PUB_LENGTH);
    const nonce = packet.slice(
      EPHEMERAL_PUB_LENGTH,
      EPHEMERAL_PUB_LENGTH + NONCE_LENGTH,
    );
    const ciphertext = packet.slice(EPHEMERAL_PUB_LENGTH + NONCE_LENGTH);

    const shared = x25519.getSharedSecret(recipientX25519Priv, ephemeralPub);
    const aesKeyRaw = deriveAesKey(shared);
    const aesKey = await importAesKey(aesKeyRaw);

    const plaintextBytes = new Uint8Array(
      await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(nonce) },
        aesKey,
        toArrayBuffer(ciphertext),
      ),
    );

    return new TextDecoder().decode(plaintextBytes);
  } catch (err) {
    if (err instanceof EncryptionError) throw err;
    throw new EncryptionError(
      `Decryption failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Convert an Ed25519 private key seed (first 32 bytes) to an X25519 private key.
 *
 * Ed25519 and X25519 share the same underlying curve (Curve25519).
 * The conversion hashes the seed with SHA-512 and clamps the result,
 * but @noble/curves handles this internally — we just need the raw
 * 32-byte seed as the X25519 private scalar.
 *
 * @param ed25519Seed - The 32-byte Ed25519 private key seed.
 * @returns 32-byte X25519 private key.
 *
 * @example
 * ```ts
 * const x25519Priv = edPrivateToX25519(seed);
 * ```
 */
export function edPrivateToX25519(ed25519Seed: Uint8Array): Uint8Array {
  return edwardsToMontgomeryPriv(ed25519Seed);
}

/**
 * Convert an Ed25519 public key to an X25519 public key.
 *
 * Uses the birational map from the Ed25519 (twisted Edwards) point
 * to the corresponding Montgomery (X25519) u-coordinate.
 *
 * @param ed25519Pub - 32-byte Ed25519 public key.
 * @returns 32-byte X25519 public key.
 *
 * @example
 * ```ts
 * const x25519Pub = edPublicToX25519(identity.publicKey);
 * ```
 */
export function edPublicToX25519(ed25519Pub: Uint8Array): Uint8Array {
  return edwardsToMontgomeryPub(ed25519Pub);
}
