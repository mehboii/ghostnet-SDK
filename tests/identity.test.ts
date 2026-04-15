import { describe, it, expect } from 'vitest';
import { createIdentity, loadIdentity } from '../src/crypto/identity.js';

describe('Identity', () => {
  it('creates a new identity with valid fields', () => {
    const id = createIdentity();

    expect(id.seedPhrase.split(' ')).toHaveLength(12);
    expect(id.publicKey).toMatch(/^[0-9a-f]{64}$/);
    expect(id.publicKeyBytes).toBeInstanceOf(Uint8Array);
    expect(id.publicKeyBytes).toHaveLength(32);
    expect(id.privateKeyBytes).toBeInstanceOf(Uint8Array);
    expect(id.privateKeyBytes).toHaveLength(32);
    expect(id.nodeId).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('loads the same identity deterministically from a seed phrase', () => {
    const original = createIdentity();
    const restored = loadIdentity(original.seedPhrase);

    expect(restored.publicKey).toBe(original.publicKey);
    expect(restored.nodeId).toBe(original.nodeId);
    expect(Buffer.from(restored.privateKeyBytes)).toEqual(Buffer.from(original.privateKeyBytes));
  });

  it('produces different identities for different seed phrases', () => {
    const a = createIdentity();
    const b = createIdentity();

    expect(a.nodeId).not.toBe(b.nodeId);
    expect(a.publicKey).not.toBe(b.publicKey);
  });

  it('throws IdentityError for an invalid seed phrase', () => {
    expect(() => loadIdentity('not a valid mnemonic')).toThrow('Invalid BIP-39 seed phrase');
  });

  it('throws IdentityError for empty string', () => {
    expect(() => loadIdentity('')).toThrow('Invalid BIP-39 seed phrase');
  });
});
