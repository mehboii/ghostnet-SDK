#!/usr/bin/env node
/**
 * mDNS Local Discovery — Announcer Script
 *
 * Publishes this node's GhostNet identity on the local network via mDNS
 * (multicast DNS / Bonjour / Avahi) so peers on the same LAN can discover
 * each other without a relay server.
 *
 * REQUIREMENTS:
 *   - Node.js >= 18
 *   - npm install bonjour-service
 *   - Both devices on the same local network
 *
 * USAGE:
 *   node mdns-announce.mjs --seed "your twelve word seed phrase"
 *   node mdns-announce.mjs --port 9090
 *
 * NOTE: Cannot be CI-tested — requires LAN. Provided for manual two-device testing.
 */
import { GhostNet } from '@n11x/ghostnet-sdk';

const args = process.argv.slice(2);
const seedIdx = args.indexOf('--seed');
const seedPhrase = seedIdx !== -1 ? args[seedIdx + 1] : null;
const portIdx = args.indexOf('--port');
const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : 9876;

// 1. Create or restore identity
const gn = new GhostNet({ debug: true });
const identity = seedPhrase ? gn.loadIdentity(seedPhrase) : gn.createIdentity();

console.log(`[mDNS Announce] Node ID: ${identity.nodeId}`);
console.log(`[mDNS Announce] Public Key: ${identity.publicKey}`);

/**
 * Publish the GhostNet service via mDNS.
 */
async function announce() {
  let Bonjour;
  try {
    Bonjour = (await import('bonjour-service')).Bonjour;
  } catch {
    console.error('[mDNS Announce] ERROR: bonjour-service not installed.');
    console.error('  Run: npm install bonjour-service');
    process.exit(1);
  }

  const bonjour = new Bonjour();

  const service = bonjour.publish({
    name: `ghostnet-${identity.nodeId.slice(0, 10)}`,
    type: 'ghostnet',
    port,
    txt: {
      nodeId: identity.nodeId,
      publicKey: identity.publicKey,
      version: '0.1.0',
    },
  });

  service.on('up', () => {
    console.log(`[mDNS Announce] Published on port ${port}. Press Ctrl+C to stop.`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[mDNS Announce] Unpublishing...');
    service.stop(() => {
      bonjour.destroy();
      identity.dispose();
      process.exit(0);
    });
  });
}

announce().catch(console.error);
