import { describe, it, expect } from 'vitest';
import { GhostNet, ConnectionError } from '../src/index.js';

describe('GhostNet client', () => {
  it('creates and retrieves an identity', () => {
    const gn = new GhostNet();
    expect(gn.getIdentity()).toBeNull();

    const id = gn.createIdentity();
    expect(id.nodeId).toMatch(/^0x/);
    expect(gn.getIdentity()).toBe(id);
  });

  it('loads an identity from a seed phrase', () => {
    const gn1 = new GhostNet();
    const id1 = gn1.createIdentity();

    const gn2 = new GhostNet();
    const id2 = gn2.loadIdentity(id1.seedPhrase);
    expect(id2.nodeId).toBe(id1.nodeId);
  });

  it('throws ConnectionError when connecting without identity', async () => {
    const gn = new GhostNet();
    await expect(gn.connect()).rejects.toThrow(ConnectionError);
  });

  it('throws ConnectionError when sending while disconnected', async () => {
    const gn = new GhostNet();
    gn.createIdentity();
    await expect(gn.send('0xpeer', 'hello')).rejects.toThrow('Not connected');
  });

  it('rejects insecure ws:// endpoints', () => {
    expect(() => new GhostNet({ endpoint: 'ws://localhost:9999' }))
      .toThrow('Insecure WebSocket endpoint rejected');
  });

  it('accepts secure wss:// endpoints', () => {
    expect(() => new GhostNet({ endpoint: 'wss://relay.example.com' }))
      .not.toThrow();
  });

  it('registers and fires event listeners', () => {
    const gn = new GhostNet();
    const errors: Error[] = [];
    const handler = (err: Error) => errors.push(err);

    gn.on('error', handler);
    gn.off('error', handler);
    expect(errors).toHaveLength(0);
  });
});
