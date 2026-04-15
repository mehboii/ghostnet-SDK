import { ed25519 } from '@noble/curves/ed25519';

/**
 * @internal
 * Sign a message with an Ed25519 private key seed.
 *
 * @param message - The data to sign.
 * @param privateKey - 32-byte Ed25519 private key seed.
 * @returns 64-byte Ed25519 signature.
 *
 * @example
 * ```ts
 * const sig = sign(data, identity.privateKeyBytes);
 * ```
 */
export function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey);
}

/**
 * @internal
 * Verify an Ed25519 signature.
 *
 * @param signature - 64-byte Ed25519 signature.
 * @param message   - The original signed data.
 * @param publicKey - 32-byte Ed25519 public key.
 * @returns `true` if valid, `false` otherwise.
 *
 * @example
 * ```ts
 * const valid = verify(sig, data, peerPublicKeyBytes);
 * ```
 */
export function verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}
