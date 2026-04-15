import { ed25519 } from '@noble/curves/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { bytesToHex } from '@noble/hashes/utils';
import * as bip39 from 'bip39';
import { IdentityError } from '../errors.js';
import type { Identity } from '../types.js';

/**
 * Derive a 32-byte Ed25519 seed from a BIP-39 mnemonic.
 * Zeroes the full 64-byte BIP-39 seed after slicing.
 */
function seedFromMnemonic(mnemonic: string): Uint8Array {
  const seed64 = new Uint8Array(bip39.mnemonicToSeedSync(mnemonic));
  const seed32 = new Uint8Array(32);
  seed32.set(seed64.subarray(0, 32));
  seed64.fill(0);
  return seed32;
}

/**
 * Create a brand-new GhostNet identity with a fresh BIP-39 seed phrase.
 *
 * The 12-word mnemonic is the master secret — store it safely.
 * The Ed25519 keypair and BLAKE3 node ID are deterministically derived.
 *
 * Call `identity.dispose()` when the identity is no longer needed to
 * zero private key material from memory.
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
 *
 * All key material is stored as Uint8Array to allow explicit zeroing.
 * String hex representations are only created for public (non-secret) data.
 */
function deriveIdentity(mnemonic: string): Identity {
  // Derive seed — seedFromMnemonic zeroes the 64-byte parent
  const seed = seedFromMnemonic(mnemonic);

  // Copy seed into private key buffer (seed is zeroed below)
  const privateKeyBytes = new Uint8Array(32);
  privateKeyBytes.set(seed);

  const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);

  // Node ID = BLAKE3 hash of the raw 32-byte public key, prefixed "0x"
  const nodeIdBytes = blake3(publicKeyBytes);
  const nodeId = '0x' + bytesToHex(nodeIdBytes);
  const publicKey = bytesToHex(publicKeyBytes);

  // Zero the intermediate seed (privateKeyBytes is the live copy now)
  seed.fill(0);

  let disposed = false;

  const identity: Identity = {
    seedPhrase: mnemonic,
    publicKeyBytes: publicKeyBytes,
    publicKey,
    privateKeyBytes,
    nodeId,
    dispose() {
      if (!disposed) {
        privateKeyBytes.fill(0);
        disposed = true;
      }
    },
  };

  // Prevent secret fields from leaking via JSON.stringify or console.log.
  Object.defineProperty(identity, 'privateKeyBytes', {
    value: privateKeyBytes,
    enumerable: false,
    configurable: false,
  });
  Object.defineProperty(identity, 'seedPhrase', {
    value: mnemonic,
    enumerable: false,
    configurable: false,
  });
  Object.defineProperty(identity, 'dispose', {
    value: identity.dispose,
    enumerable: false,
    configurable: false,
  });

  // Custom toJSON — only public data
  Object.defineProperty(identity, 'toJSON', {
    value: () => ({
      publicKey: identity.publicKey,
      nodeId: identity.nodeId,
    }),
    enumerable: false,
  });

  return identity;
}
