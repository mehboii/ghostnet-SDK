import { describe, it, expect } from 'vitest';
import {
  GhostNetError,
  ConnectionError,
  IdentityError,
  EncryptionError,
  PeerNotFoundError,
  PayloadTooLargeError,
  RelayError,
  ReplayError,
  PeerVerificationError,
} from '../src/errors.js';

describe('Errors', () => {
  it('GhostNetError has name and code', () => {
    const err = new GhostNetError('test', 'ERR_TEST');
    expect(err.name).toBe('GhostNetError');
    expect(err.code).toBe('ERR_TEST');
    expect(err.message).toBe('test');
    expect(err).toBeInstanceOf(Error);
  });

  it('ConnectionError extends GhostNetError', () => {
    const err = new ConnectionError('lost');
    expect(err.code).toBe('ERR_CONNECTION');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('IdentityError extends GhostNetError', () => {
    const err = new IdentityError('bad seed');
    expect(err.code).toBe('ERR_IDENTITY');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('EncryptionError extends GhostNetError', () => {
    const err = new EncryptionError('aes fail');
    expect(err.code).toBe('ERR_ENCRYPTION');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('PeerNotFoundError includes peerId', () => {
    const err = new PeerNotFoundError('0xabc');
    expect(err.code).toBe('ERR_PEER_NOT_FOUND');
    expect(err.peerId).toBe('0xabc');
    expect(err.message).toContain('0xabc');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('PayloadTooLargeError includes size info', () => {
    const err = new PayloadTooLargeError(100000, 65536);
    expect(err.code).toBe('ERR_PAYLOAD_TOO_LARGE');
    expect(err.actualBytes).toBe(100000);
    expect(err.maxBytes).toBe(65536);
    expect(err.message).toContain('100000');
    expect(err.message).toContain('65536');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('RelayError includes relay code', () => {
    const err = new RelayError('rate limited', 'RATE_LIMIT');
    expect(err.code).toBe('ERR_RELAY');
    expect(err.relayCode).toBe('RATE_LIMIT');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('ReplayError includes nonce', () => {
    const err = new ReplayError('abc123');
    expect(err.code).toBe('ERR_REPLAY');
    expect(err.nonce).toBe('abc123');
    expect(err.message).toContain('abc123');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('PeerVerificationError includes peerId and reason', () => {
    const err = new PeerVerificationError('0xdead', 'invalid signature');
    expect(err.code).toBe('ERR_PEER_VERIFICATION');
    expect(err.peerId).toBe('0xdead');
    expect(err.message).toContain('0xdead');
    expect(err.message).toContain('invalid signature');
    expect(err).toBeInstanceOf(GhostNetError);
  });

  it('All errors are instanceof Error', () => {
    const errors = [
      new GhostNetError('t', 'T'),
      new ConnectionError('t'),
      new IdentityError('t'),
      new EncryptionError('t'),
      new PeerNotFoundError('0x0'),
      new PayloadTooLargeError(1, 0),
      new RelayError('t', 'T'),
      new ReplayError('n'),
      new PeerVerificationError('0x0', 'r'),
    ];
    for (const err of errors) {
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(GhostNetError);
      expect(typeof err.code).toBe('string');
      expect(typeof err.message).toBe('string');
    }
  });
});
