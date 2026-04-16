#!/usr/bin/env node
/**
 * BLE Local Discovery — Scanner Script
 *
 * Scans for nearby GhostNet nodes broadcasting over Bluetooth Low Energy
 * and initiates a peer connection using the discovered node's public key.
 *
 * REQUIREMENTS:
 *   - Node.js >= 18
 *   - npm install @abandonware/noble
 *   - Bluetooth adapter on the host machine
 *   - Run with elevated permissions (sudo on Linux/macOS)
 *
 * USAGE:
 *   node ble-scanner.mjs --seed "your twelve word seed phrase here"
 *   node ble-scanner.mjs   # generates a new identity
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

console.log(`[BLE Scanner] Node ID: ${identity.nodeId}`);

// 2. GhostNet BLE Service UUID (must match advertiser)
const GHOSTNET_SERVICE_UUID = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

/**
 * Start scanning for GhostNet peers.
 */
async function startScanning() {
  let noble;
  try {
    noble = (await import('@abandonware/noble')).default;
  } catch {
    console.error('[BLE Scanner] ERROR: @abandonware/noble not installed.');
    console.error('  Run: npm install @abandonware/noble');
    process.exit(1);
  }

  const discoveredPeers = new Map();

  noble.on('stateChange', (state) => {
    if (state === 'poweredOn') {
      console.log('[BLE Scanner] Bluetooth powered on. Scanning...');
      noble.startScanning([GHOSTNET_SERVICE_UUID], false);
    } else {
      console.log(`[BLE Scanner] Bluetooth state: ${state}`);
    }
  });

  noble.on('discover', (peripheral) => {
    const name = peripheral.advertisement.localName || 'unknown';
    const id = peripheral.id;

    if (discoveredPeers.has(id)) return;
    discoveredPeers.set(id, peripheral);

    console.log(`[BLE Scanner] Found GhostNet peer: ${name} (${id})`);
    console.log(`  RSSI: ${peripheral.rssi} dBm`);
    console.log(`  Service UUIDs: ${peripheral.advertisement.serviceUuids?.join(', ')}`);

    // Connect to read nodeId and publicKey characteristics
    peripheral.connect((err) => {
      if (err) {
        console.error(`[BLE Scanner] Failed to connect to ${id}:`, err);
        return;
      }
      console.log(`[BLE Scanner] Connected to ${id}. Reading characteristics...`);

      peripheral.discoverAllServicesAndCharacteristics((err, services, chars) => {
        if (err) {
          console.error(`[BLE Scanner] Discovery failed:`, err);
          peripheral.disconnect();
          return;
        }

        for (const char of chars) {
          char.read((err, data) => {
            if (!err && data) {
              console.log(`[BLE Scanner]   Characteristic ${char.uuid}: ${data.toString('utf8')}`);
            }
          });
        }

        // Disconnect after reading
        setTimeout(() => {
          peripheral.disconnect();
          console.log(`[BLE Scanner] Disconnected from ${id}`);
        }, 2000);
      });
    });
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[BLE Scanner] Stopping...');
    noble.stopScanning();
    identity.dispose();
    process.exit(0);
  });
}

startScanning().catch(console.error);
