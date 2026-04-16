#!/usr/bin/env node
/**
 * mDNS Local Discovery — Discovery Script
 *
 * Listens for GhostNet nodes announcing themselves on the local network
 * via mDNS and prints their identity details.
 *
 * REQUIREMENTS:
 *   - Node.js >= 18
 *   - npm install bonjour-service
 *   - Both devices on the same local network
 *
 * USAGE:
 *   node mdns-discover.mjs
 *
 * NOTE: Cannot be CI-tested — requires LAN. Provided for manual two-device testing.
 */

async function discover() {
  let Bonjour;
  try {
    Bonjour = (await import('bonjour-service')).Bonjour;
  } catch {
    console.error('[mDNS Discover] ERROR: bonjour-service not installed.');
    console.error('  Run: npm install bonjour-service');
    process.exit(1);
  }

  const bonjour = new Bonjour();

  console.log('[mDNS Discover] Scanning local network for GhostNet peers...\n');

  const browser = bonjour.find({ type: 'ghostnet' });

  browser.on('up', (service) => {
    console.log(`[mDNS Discover] Found peer!`);
    console.log(`  Name:      ${service.name}`);
    console.log(`  Host:      ${service.host}:${service.port}`);
    console.log(`  Node ID:   ${service.txt?.nodeId || 'unknown'}`);
    console.log(`  Public Key: ${service.txt?.publicKey || 'unknown'}`);
    console.log(`  Version:   ${service.txt?.version || 'unknown'}`);
    console.log('');
  });

  browser.on('down', (service) => {
    console.log(`[mDNS Discover] Peer left: ${service.name}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[mDNS Discover] Stopping...');
    browser.stop();
    bonjour.destroy();
    process.exit(0);
  });
}

discover().catch(console.error);
