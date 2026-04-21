/**
 * Hardware profiling script for identity generation.
 *
 * Measures CPU time, memory usage, and GC pressure during keypair generation.
 * Run with profiling flags:
 *
 *   node --cpu-prof scripts/profile-identity.mjs
 *   node --trace-gc scripts/profile-identity.mjs
 *   node --prof scripts/profile-identity.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Use the built CJS bundle so we test the actual shipped artifact
const { GhostNet } = require('../dist/index.cjs');

const ITERATIONS = 50;

console.log('=== GhostNet Identity Generation — Hardware Profile ===\n');
console.log(`Node.js: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`Iterations: ${ITERATIONS}\n`);

// Baseline memory
const baselineMem = process.memoryUsage();
console.log(`Baseline RSS: ${(baselineMem.rss / 1024 / 1024).toFixed(1)} MB`);
console.log(`Baseline Heap Used: ${(baselineMem.heapUsed / 1024 / 1024).toFixed(1)} MB\n`);

const times = [];
const memSnapshots = [];

for (let i = 0; i < ITERATIONS; i++) {
  const start = performance.now();

  const gn = new GhostNet();
  const identity = gn.createIdentity();

  const elapsed = performance.now() - start;
  times.push(elapsed);

  // Snapshot memory every 10 iterations
  if (i % 10 === 0) {
    const mem = process.memoryUsage();
    memSnapshots.push({
      iteration: i,
      rss: (mem.rss / 1024 / 1024).toFixed(1),
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1),
      heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1),
      external: (mem.external / 1024 / 1024).toFixed(1),
    });
  }

  // Clean up key material
  identity.dispose();
}

// Timing analysis
times.sort((a, b) => a - b);
const avg = times.reduce((a, b) => a + b) / times.length;
const median = times[Math.floor(times.length / 2)];
const p95 = times[Math.floor(times.length * 0.95)];
const p99 = times[Math.floor(times.length * 0.99)];
const min = times[0];
const max = times[times.length - 1];
const total = times.reduce((a, b) => a + b);

console.log('--- Timing Results ---\n');
console.log(`| Metric   | Value      |`);
console.log(`|----------|------------|`);
console.log(`| Total    | ${total.toFixed(1)}ms   |`);
console.log(`| Average  | ${avg.toFixed(2)}ms    |`);
console.log(`| Median   | ${median.toFixed(2)}ms    |`);
console.log(`| Min      | ${min.toFixed(2)}ms    |`);
console.log(`| Max      | ${max.toFixed(2)}ms    |`);
console.log(`| P95      | ${p95.toFixed(2)}ms    |`);
console.log(`| P99      | ${p99.toFixed(2)}ms    |`);

// Memory analysis
console.log('\n--- Memory Snapshots ---\n');
console.log('| Iteration | RSS (MB) | Heap Used (MB) | Heap Total (MB) |');
console.log('|-----------|----------|----------------|-----------------|');
for (const snap of memSnapshots) {
  console.log(`| ${String(snap.iteration).padStart(9)} | ${snap.rss.padStart(8)} | ${snap.heapUsed.padStart(14)} | ${snap.heapTotal.padStart(15)} |`);
}

// Final memory
const finalMem = process.memoryUsage();
const rssGrowth = (finalMem.rss - baselineMem.rss) / 1024 / 1024;
const heapGrowth = (finalMem.heapUsed - baselineMem.heapUsed) / 1024 / 1024;

console.log(`\n--- Memory Delta ---\n`);
console.log(`RSS growth: ${rssGrowth.toFixed(1)} MB`);
console.log(`Heap growth: ${heapGrowth.toFixed(1)} MB`);

// Verdict
console.log('\n--- Verdict ---\n');
if (avg > 2000) {
  console.log(`WARN: Average ${avg.toFixed(0)}ms exceeds 2s threshold.`);
  console.log('Identity generation is too slow for embedded/mobile. Tune parameters.');
} else if (avg > 500) {
  console.log(`CAUTION: Average ${avg.toFixed(0)}ms — acceptable for desktop, may be slow on Pi/mobile.`);
} else {
  console.log(`PASS: Average ${avg.toFixed(0)}ms — well within acceptable range for all targets.`);
}

if (rssGrowth > 50) {
  console.log(`WARN: RSS grew ${rssGrowth.toFixed(0)}MB over ${ITERATIONS} iterations — possible memory leak.`);
} else {
  console.log(`PASS: Memory stable (${rssGrowth.toFixed(1)}MB RSS growth over ${ITERATIONS} iterations).`);
}
