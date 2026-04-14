import { ed25519 } from '@noble/curves/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import * as bip39 from 'bip39';
import { IdentityError } from '../errors.js';
import type { Identity } from '../types.js';

/**
 * Derive a 32-byte Ed25519 seed from a BIP-39 mnemonic.
 *
 * Uses the first 32 bytes of the 64-byte BIP-39 seed (no passphrase).
 * This matches the standard approach: BIP-39 seed → Ed25519 signing key.
 */
function seedFromMnemonic(mnemonic: string): Uint8Array {
  const seed64 = bip39.mnemonicToSeedSync(mnemonic);
  return seed64.slice(0, 32);
}

/**
 * Create a brand-new GhostNet identity with a fresh BIP-39 seed phrase.
 *
 * The 12-word mnemonic is the master secret — store it safely.
 * The Ed25519 keypair and BLAKE3 node ID are deterministically derived.
 *
 * @example
 * ```ts
 * const id = createIdentity();
 * console.log(id.seedPhrase); // "abandon ability able ..."
 * console.log(id.nodeId);     // "0x7f3a..."
 * ```
 */
export function createIdentity(): Identity {
  const mnemonic = bip39.generateMnemonic();
  return deriveIdentity(mnemonic);
}

/**
 * Restore a GhostNet identity from an existing BIP-39 seed phrase.
 *
 * The same seed phrase always produces the same keypair and node ID,
 * making identities portable across devices and SDK versions.
 *
 * @param seedPhrase - A valid 12-word BIP-39 mnemonic.
 * @throws {IdentityError} If the mnemonic is invalid.
 *
 * @example
 * ```ts
 * const id = loadIdentity('abandon ability able ...');
 * console.log(id.nodeId); // deterministic
 * ```
 */
export function loadIdentity(seedPhrase: string): Identity {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new IdentityError('Invalid BIP-39 seed phrase');
  }
  return deriveIdentity(seedPhrase);
}

/**
 * Derive the full identity (keypair + node ID) from a mnemonic.
 */
function deriveIdentity(mnemonic: string): Identity {
  const seed = seedFromMnemonic(mnemonic);
  const privateKeyBytes = seed;
  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);

  // Node ID = BLAKE3 hash of the raw 32-byte public key, prefixed "0x"
  const nodeIdBytes = blake3(publicKeyBytes);
  const nodeId = '0x' + bytesToHex(nodeIdBytes);

  // Encode private key as 64-byte expanded form (seed || public) for compat
  const fullPrivateKey = new Uint8Array(64);
  fullPrivateKey.set(privateKeyBytes, 0);
  fullPrivateKey.set(publicKeyBytes, 32);

  return {
    seedPhrase: mnemonic,
    publicKey: bytesToHex(publicKeyBytes),
    privateKey: bytesToHex(fullPrivateKey),
    nodeId,
  };
}
