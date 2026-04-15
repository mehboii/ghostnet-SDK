import { describe, it, expect } from 'vitest';
import { GhostNet, ConnectionError, IdentityError, EncryptionError } from '../src/index.js';
import { createIdentity, loadIdentity } from '../src/crypto/identity.js';
import { encrypt, decrypt, edPrivateToX25519, edPublicToX25519 } from '../src/crypto/encryption.js';
import { hexToBytes } from '@noble/hashes/utils';

describe('Security: Identity attacks', () => {
  it('rejects empty seed phrase', () => {
    expect(() => loadIdentity('')).toThrow(IdentityError);
  });

  it('rejects seed phrase with extra words appended', () => {
    const id = createIdentity();
    const tampered = id.seedPhrase + ' abandon';
    expect(() => loadIdentity(tampered)).toThrow(IdentityError);
  });

  it('rejects seed phrase with one word swapped', () => {
    const id = createIdentity();
    const words = id.seedPhrase.split(' ');
    words[0] = 'zzzzzzz';
    expect(() => loadIdentity(words.join(' '))).toThrow(IdentityError);
  });

  it('rejects numeric string as seed phrase', () => {
    expect(() => loadIdentity('1234567890')).toThrow(IdentityError);
  });

  it('rejects SQL injection in seed phrase', () => {
    expect(() => loadIdentity("'; DROP TABLE users; --")).toThrow(IdentityError);
  });

  it('rejects extremely long string as seed phrase', () => {
    const longString = 'abandon '.repeat(10000);
    expect(() => loadIdentity(longString)).toThrow(IdentityError);
  });

  it('rejects seed phrase with null bytes', () => {
    expect(() => loadIdentity('abandon\x00ability\x00able\x00about\x00above\x00absent\x00absorb\x00abstract\x00absurd\x00abuse\x00access\x00accident')).toThrow(IdentityError);
  });

  it('private key in identity cannot be used to impersonate with different seed', () => {
    const alice = createIdentity();
    const bob = createIdentity();
    expect(alice.privateKey).not.toBe(bob.privateKey);
    expect(alice.nodeId).not.toBe(bob.nodeId);
  });
});

describe('Security: Encryption attacks', () => {
  function makeRecipientKeys() {
    const id = createIdentity();
    const pub = edPublicToX25519(hexToBytes(id.publicKey));
    const priv = edPrivateToX25519(hexToBytes(id.privateKey).slice(0, 32));
    return { id, pub, priv };
  }

  it('decrypt fails on all-zero packet of correct length', () => {
    const { priv } = makeRecipientKeys();
    const fakePacket = new Uint8Array(32 + 12 + 32); // pub + nonce + min ciphertext
    expect(() => decrypt(fakePacket, priv)).toThrow(EncryptionError);
  });

  it('decrypt fails on random garbage bytes', () => {
    const { priv } = makeRecipientKeys();
    const garbage = new Uint8Array(128);
    crypto.getRandomValues(garbage);
    expect(() => decrypt(garbage, priv)).toThrow(EncryptionError);
  });

  it('decrypt fails when ciphertext is bit-flipped (integrity check)', () => {
    const { pub, priv } = makeRecipientKeys();
    const packet = encrypt('secret message', pub);
    // Flip a bit in the ciphertext area (after pub + nonce)
    packet[44 + 5] ^= 0xff;
    expect(() => decrypt(packet, priv)).toThrow(EncryptionError);
  });

  it('decrypt fails when nonce is tampered', () => {
    const { pub, priv } = makeRecipientKeys();
    const packet = encrypt('secret message', pub);
    // Flip a bit in the nonce area
    packet[32 + 3] ^= 0xff;
    expect(() => decrypt(packet, priv)).toThrow(EncryptionError);
  });

  it('decrypt fails when ephemeral pubkey is tampered', () => {
    const { pub, priv } = makeRecipientKeys();
    const packet = encrypt('secret message', pub);
    // Flip a bit in the ephemeral pubkey
    packet[5] ^= 0xff;
    expect(() => decrypt(packet, priv)).toThrow(EncryptionError);
  });

  it('replay: same packet decrypts the same way (no replay protection at crypto layer)', () => {
    const { pub, priv } = makeRecipientKeys();
    const packet = encrypt('hello', pub);
    const copy = new Uint8Array(packet);
    // Both should decrypt identically — replay protection is transport-layer responsibility
    expect(decrypt(packet, priv)).toBe(decrypt(copy, priv));
  });

  it('encrypt rejects empty recipient public key', () => {
    expect(() => encrypt('hello', new Uint8Array(0))).toThrow(EncryptionError);
  });

  it('encrypt rejects wrong-length recipient public key', () => {
    expect(() => encrypt('hello', new Uint8Array(16))).toThrow(EncryptionError);
  });

  it('handles unicode and emoji in plaintext', () => {
    const { pub, priv } = makeRecipientKeys();
    const message = '你好世界 🔐🌐 مرحبا';
    const packet = encrypt(message, pub);
    expect(decrypt(packet, priv)).toBe(message);
  });

  it('handles empty string plaintext', () => {
    const { pub, priv } = makeRecipientKeys();
    const packet = encrypt('', pub);
    expect(decrypt(packet, priv)).toBe('');
  });

  it('handles very large plaintext (1MB)', () => {
    const { pub, priv } = makeRecipientKeys();
    const bigMessage = 'A'.repeat(1024 * 1024);
    const packet = encrypt(bigMessage, pub);
    expect(decrypt(packet, priv)).toBe(bigMessage);
  });
});

describe('Security: Client-level attacks', () => {
  it('rejects ws:// (unencrypted) endpoint', () => {
    expect(() => new GhostNet({ endpoint: 'ws://evil.com' })).toThrow(ConnectionError);
  });

  it('rejects http:// endpoint', () => {
    expect(() => new GhostNet({ endpoint: 'http://evil.com' })).toThrow(ConnectionError);
  });

  it('rejects empty string endpoint', () => {
    expect(() => new GhostNet({ endpoint: '' })).toThrow(ConnectionError);
  });

  it('rejects javascript: protocol endpoint', () => {
    expect(() => new GhostNet({ endpoint: 'javascript:alert(1)' })).toThrow(ConnectionError);
  });

  it('rejects data: URI endpoint', () => {
    expect(() => new GhostNet({ endpoint: 'data:text/html,<h1>pwned</h1>' })).toThrow(ConnectionError);
  });

  it('cannot send before connecting', async () => {
    const gn = new GhostNet();
    gn.createIdentity();
    await expect(gn.send('0xpeer', 'hello')).rejects.toThrow(ConnectionError);
  });

  it('cannot connect without identity', async () => {
    const gn = new GhostNet();
    await expect(gn.connect()).rejects.toThrow(ConnectionError);
  });

  it('getIdentity returns null before creation', () => {
    const gn = new GhostNet();
    expect(gn.getIdentity()).toBeNull();
  });

  it('disconnect is safe to call when not connected', () => {
    const gn = new GhostNet();
    expect(() => gn.disconnect()).not.toThrow();
  });

  it('disconnect is safe to call multiple times', () => {
    const gn = new GhostNet();
    gn.disconnect();
    gn.disconnect();
    gn.disconnect();
  });
});
