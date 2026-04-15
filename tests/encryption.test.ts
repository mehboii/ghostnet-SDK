import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, edPrivateToX25519, edPublicToX25519 } from '../src/crypto/encryption.js';
import { createIdentity } from '../src/crypto/identity.js';
import { hexToBytes } from '@noble/hashes/utils';

describe('Encryption', () => {
  it('encrypts and decrypts a message roundtrip', () => {
    const recipient = createIdentity();
    const recipientPub = hexToBytes(recipient.publicKey);
    const recipientPrivSeed = hexToBytes(recipient.privateKey).slice(0, 32);

    const recipientX25519Pub = edPublicToX25519(recipientPub);
    const recipientX25519Priv = edPrivateToX25519(recipientPrivSeed);

    const plaintext = 'hello from the mesh';
    const packet = encrypt(plaintext, recipientX25519Pub);
    const decrypted = decrypt(packet, recipientX25519Priv);

    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for the same plaintext (ephemeral keys)', () => {
    const recipient = createIdentity();
    const recipientPub = edPublicToX25519(hexToBytes(recipient.publicKey));

    const a = encrypt('same message', recipientPub);
    const b = encrypt('same message', recipientPub);

    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });

  it('fails to decrypt with wrong key', () => {
    const recipient = createIdentity();
    const wrongRecipient = createIdentity();

    const recipientPub = edPublicToX25519(hexToBytes(recipient.publicKey));
    const wrongPrivSeed = hexToBytes(wrongRecipient.privateKey).slice(0, 32);
    const wrongX25519Priv = edPrivateToX25519(wrongPrivSeed);

    const packet = encrypt('secret', recipientPub);

    expect(() => decrypt(packet, wrongX25519Priv)).toThrow('Decryption failed');
  });

  it('fails on truncated packet', () => {
    const recipient = createIdentity();
    const recipientPrivSeed = hexToBytes(recipient.privateKey).slice(0, 32);
    const recipientX25519Priv = edPrivateToX25519(recipientPrivSeed);

    const shortPacket = new Uint8Array(10);
    expect(() => decrypt(shortPacket, recipientX25519Priv)).toThrow('Packet too short');
  });
});
