/**
 * ghost-faq-demo — Interactive terminal demo for GhostSupportBot.
 *
 * Usage:
 *   npx tsx examples/ghost-faq-demo/index.ts
 */
import * as readline from 'node:readline';
import { GhostSupportBot } from '../../src/index.js';

const bot = new GhostSupportBot();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('╔══════════════════════════════════════════════╗');
console.log('║       GhostNet Support Terminal v0.1         ║');
console.log('║  Ask about: auth, encryption, cloaking, BLE  ║');
console.log('║  Type "exit" to quit                         ║');
console.log('╚══════════════════════════════════════════════╝');
console.log();

function prompt() {
  rl.question('ghost> ', (input) => {
    const trimmed = input.trim();
    if (trimmed.toLowerCase() === 'exit') {
      console.log('Session terminated.');
      rl.close();
      return;
    }
    console.log();
    console.log(bot.ask(trimmed));
    console.log();
    prompt();
  });
}

prompt();
