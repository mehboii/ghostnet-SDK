import { describe, it, expect } from 'vitest';
import { GhostSupportBot } from '../src/index.js';

describe('GhostSupportBot', () => {
  const bot = new GhostSupportBot();

  describe('authentication intent', () => {
    it('matches a query about Argon2id', () => {
      const reply = bot.ask('How do I configure Argon2id?');
      expect(reply).toContain('Argon2id');
      expect(reply).toContain('quantum-resistant');
      expect(reply).toContain('seed phrases are explicitly rejected');
    });

    it('matches a query about password hashing', () => {
      const reply = bot.ask('How does password auth work?');
      expect(reply).toContain('Argon2id');
    });
  });

  describe('encryption intent', () => {
    it('matches a query about AES encryption', () => {
      const reply = bot.ask('Is my data encrypted with AES?');
      expect(reply).toContain('AES-256-GCM');
      expect(reply).toContain('before any payload leaves the local device');
    });
  });

  describe('cloaking intent', () => {
    it('matches a query about stealth mode', () => {
      const reply = bot.ask('How do I enable stealth cloaking?');
      expect(reply).toContain('Ghost Shield');
      expect(reply).toContain('Phantom');
      expect(reply).toContain('zero-knowledge');
    });

    it('matches a query about ghost shield', () => {
      const reply = bot.ask('What is ghost shield?');
      expect(reply).toContain('3-tier');
    });
  });

  describe('proximity intent', () => {
    it('matches a query about BLE connectivity', () => {
      const reply = bot.ask('Can I connect via Bluetooth offline?');
      expect(reply).toContain('Bluetooth Low Energy');
      expect(reply).toContain('zero internet connection');
    });
  });

  describe('fallback', () => {
    it('returns terminal error for unrelated input', () => {
      const reply = bot.ask('What is the weather today?');
      expect(reply).toContain('Terminal Error');
      expect(reply).toContain('Unrecognized command');
    });

    it('returns terminal error for empty input', () => {
      const reply = bot.ask('');
      expect(reply).toContain('Terminal Error');
    });
  });
});
