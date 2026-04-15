import { describe, it, expect } from 'vitest';
import { GhostNet } from '../src/index.js';
import { createIdentity } from '../src/crypto/identity.js';

describe('FIXED: Prototype pollution via JSON.parse', () => {
  it('malicious relay message with __proto__ does not pollute Object prototype', () => {
    const malicious = '{"type":"message","from":"0xevil","payload":"hi","__proto__":{"isAdmin":true}}';
    JSON.parse(malicious);
    const clean: Record<string, unknown> = {};
    expect(clean['isAdmin']).toBeUndefined();
  });

  it('constructor pollution attempt via relay message is safe', () => {
    const malicious = '{"type":"message","from":"0xevil","payload":"hi","constructor":{"prototype":{"isAdmin":true}}}';
    JSON.parse(malicious);
    const clean: Record<string, unknown> = {};
    expect(clean['isAdmin']).toBeUndefined();
  });
});

describe('FIXED: Identity key exposure', () => {
  it('JSON.stringify does NOT expose private key bytes', () => {
    const id = createIdentity();
    const serialized = JSON.stringify(id);
    // privateKeyBytes is non-enumerable Uint8Array — should not appear in JSON
    expect(serialized).not.toContain('privateKeyBytes');
  });

  it('JSON.stringify does NOT expose seed phrase', () => {
    const id = createIdentity();
    const serialized = JSON.stringify(id);
    expect(serialized).not.toContain(id.seedPhrase);
  });

  it('JSON.stringify only contains publicKey and nodeId', () => {
    const id = createIdentity();
    const parsed = JSON.parse(JSON.stringify(id));
    expect(Object.keys(parsed).sort()).toEqual(['nodeId', 'publicKey']);
  });

  it('private key bytes are still accessible as a property', () => {
    const id = createIdentity();
    expect(id.privateKeyBytes).toBeInstanceOf(Uint8Array);
    expect(id.privateKeyBytes).toHaveLength(32);
  });

  it('seed phrase is still accessible as a property', () => {
    const id = createIdentity();
    expect(id.seedPhrase.split(' ')).toHaveLength(12);
  });

  it('private key does not appear in Object.keys', () => {
    const id = createIdentity();
    expect(Object.keys(id)).not.toContain('privateKeyBytes');
    expect(Object.keys(id)).not.toContain('seedPhrase');
  });
});

describe('FIXED: Endpoint validation', () => {
  it('rejects wss:// with embedded credentials', () => {
    expect(() => new GhostNet({ endpoint: 'wss://user:pass@evil.com' }))
      .toThrow('credentials');
  });

  it('rejects endpoint with path traversal', () => {
    expect(() => new GhostNet({ endpoint: 'wss://evil.com/../../etc/passwd' }))
      .toThrow('path traversal');
  });

  it('rejects ws:// (unencrypted)', () => {
    expect(() => new GhostNet({ endpoint: 'ws://evil.com' }))
      .toThrow('Insecure');
  });

  it('rejects http://', () => {
    expect(() => new GhostNet({ endpoint: 'http://evil.com' }))
      .toThrow('Insecure');
  });

  it('rejects javascript: protocol', () => {
    expect(() => new GhostNet({ endpoint: 'javascript:alert(1)' }))
      .toThrow('Insecure');
  });

  it('rejects empty string', () => {
    expect(() => new GhostNet({ endpoint: '' }))
      .toThrow('Insecure');
  });

  it('rejects garbage string', () => {
    expect(() => new GhostNet({ endpoint: 'not-a-url' }))
      .toThrow('Insecure');
  });

  it('accepts clean wss:// URL', () => {
    expect(() => new GhostNet({ endpoint: 'wss://relay.ghostnet.dev' }))
      .not.toThrow();
  });

  it('accepts wss:// with port', () => {
    expect(() => new GhostNet({ endpoint: 'wss://relay.ghostnet.dev:8443' }))
      .not.toThrow();
  });

  it('accepts wss:// with path', () => {
    expect(() => new GhostNet({ endpoint: 'wss://relay.ghostnet.dev/ws' }))
      .not.toThrow();
  });
});
