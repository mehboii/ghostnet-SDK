import { describe, it, expect } from 'vitest';
import {
  GhostNetError,
  ConnectionError,
  IdentityError,
  EncryptionError,
  PeerNotFoundError,
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
});
