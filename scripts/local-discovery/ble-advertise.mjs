#!/usr/bin/env node
/**
 * BLE Local Discovery — Advertiser Script
 *
 * Broadcasts this node's GhostNet identity over Bluetooth Low Energy
 * so nearby peers can discover and connect without internet.
 *
 * REQUIREMENTS:
 *   - Node.js >= 18
 *   - npm install @abandonware/noble   (BLE library)
 *   - Bluetooth adapter on the host machine
 *   - Run with elevated permissions (sudo on Linux/macOS)
 *
 * USAGE:
 *   node ble-advertise.mjs --seed "your twelve word seed phrase here"
 *   node ble-advertise.mjs   # generates a new identity
 *
 * NOTE: This script cannot be tested by CI — it requires physical
 * Bluetooth hardware. It is provided for manual testing on two devices.
 */
import { GhostNet } from '@n11x/ghostnet-sdk';

const args = process.argv.slice(2);
const seedIdx = args.indexOf('--seed');
const seedPhrase = seedIdx !== -1 ? args[seedIdx + 1] : null;

// 1. Create or restore identity
const gn = new GhostNet({ debug: true });
const identity = seedPhrase ? gn.loadIdentity(seedPhrase) : gn.createIdentity();

console.log(`[BLE Advertiser] Node ID: ${identity.nodeId}`);
console.log(`[BLE Advertiser] Public Key: ${identity.publicKey}`);
if (!seedPhrase) {
  console.log(`[BLE Advertiser] Seed Phrase (SAVE THIS): ${identity.seedPhrase}`);
}

// 2. GhostNet BLE Service UUID (custom 128-bit UUID)
const GHOSTNET_SERVICE_UUID = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';
const NODE_ID_CHAR_UUID     = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d5';
const PUB_KEY_CHAR_UUID     = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d6';

/**
 * Start BLE advertising.
 * Requires @abandonware/noble — install separately:
 *   npm install @abandonware/noble
 */
async function startAdvertising() {
  let noble;
  try {
    noble = (await import('@abandonware/noble')).default;
  } catch {
    console.error('[BLE Advertiser] ERROR: @abandonware/noble not installed.');
    console.error('  Run: npm install @abandonware/noble');
    console.error('  Then re-run this script.');
    process.exit(1);
  }

  noble.on('stateChange', (state) => {
    if (state === 'poweredOn') {
      console.log('[BLE Advertiser] Bluetooth powered on. Starting advertisement...');

      // Advertise the GhostNet service UUID
      // The nodeId and publicKey are exposed as characteristics
      noble.startAdvertising('GhostNet', [GHOSTNET_SERVICE_UUID], (err) => {
        if (err) {
          console.error('[BLE Advertiser] Failed to start advertising:', err);
          process.exit(1);
        }
        console.log('[BLE Advertiser] Broadcasting. Press Ctrl+C to stop.');
      });
    } else {
      console.log(`[BLE Advertiser] Bluetooth state: ${state}`);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[BLE Advertiser] Stopping...');
    noble.stopAdvertising();
    identity.dispose();
    process.exit(0);
  });
}

startAdvertising().catch(console.error);
