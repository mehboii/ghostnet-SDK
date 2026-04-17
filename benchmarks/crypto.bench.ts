/**
 * Performance benchmarks for GhostNet SDK crypto operations.
 *
 * Run: npm run bench
 */
import { Bench } from 'tinybench';
import { createIdentity, loadIdentity } from '../src/crypto/identity.js';
import { encrypt, decrypt, edPrivateToX25519, edPublicToX25519 } from '../src/crypto/encryption.js';
import { sign, verify } from '../src/crypto/signing.js';

const bench = new Bench({ time: 2000 });

const identity = createIdentity();
const recipientIdentity = createIdentity();
const recipientX25519Pub = edPublicToX25519(recipientIdentity.publicKeyBytes);
const recipientX25519Priv = edPrivateToX25519(recipientIdentity.privateKeyBytes);
const testMessage = 'Hello GhostNet! This is a test message for benchmarking.';
const encryptedPacket = encrypt(testMessage, recipientX25519Pub);
const signatureData = new TextEncoder().encode('ghostnet:benchmark:test');
const signature = sign(signatureData, identity.privateKeyBytes);

bench
  .add('createIdentity()', () => {
    createIdentity();
  })
  .add('loadIdentity() from seed phrase', () => {
    loadIdentity(identity.seedPhrase);
  })
  .add('encrypt() short message (56B)', () => {
    encrypt(testMessage, recipientX25519Pub);
  })
  .add('decrypt() short message', () => {
    decrypt(encryptedPacket, recipientX25519Priv);
  })
  .add('encrypt() 1KB message', () => {
    encrypt('x'.repeat(1024), recipientX25519Pub);
  })
  .add('encrypt() 10KB message', () => {
    encrypt('x'.repeat(10240), recipientX25519Pub);
  })
  .add('sign() Ed25519', () => {
    sign(signatureData, identity.privateKeyBytes);
  })
  .add('verify() Ed25519', () => {
    verify(signature, signatureData, identity.publicKeyBytes);
  })
  .add('edPublicToX25519()', () => {
    edPublicToX25519(identity.publicKeyBytes);
  })
  .add('edPrivateToX25519()', () => {
    edPrivateToX25519(identity.privateKeyBytes);
  });

console.log('\n=== GhostNet SDK Performance Benchmarks ===\n');
console.log('Running benchmarks (2s per operation)...\n');

await bench.run();

console.log('| Operation | ops/sec | Avg (ms) | RME |');
console.log('|-----------|---------|----------|-----|');

for (const task of bench.tasks) {
  const r = task.result!;
  // tinybench v6: results are in r.latency and r.throughput
  const lat = (r as Record<string, unknown>).latency as Record<string, number> | undefined;
  const thr = (r as Record<string, unknown>).throughput as Record<string, number> | undefined;

  let opsPerSec: string;
  let avgMs: string;
  let rme: string;

  if (lat && thr) {
    opsPerSec = Math.round(thr.mean).toLocaleString();
    avgMs = (lat.mean).toFixed(4);
    rme = `±${lat.rme.toFixed(1)}%`;
  } else {
    // Fallback for older tinybench
    const hz = (r as Record<string, number>).hz ?? 0;
    const mean = (r as Record<string, number>).mean ?? 0;
    opsPerSec = Math.round(hz).toLocaleString();
    avgMs = (mean * 1000).toFixed(4);
    rme = 'n/a';
  }

  console.log(`| ${task.name.padEnd(35)} | ${opsPerSec.padStart(9)} | ${avgMs.padStart(8)} | ${rme.padStart(6)} |`);
}

console.log('\nDone.\n');
