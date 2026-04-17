import { describe, it, expect } from 'vitest';
import { GhostSupportBot } from '../src/index.js';

describe('GhostSupportBot', () => {
  const bot = new GhostSupportBot();

  describe('authentication', () => {
    it('explains account creation', () => {
      const reply = bot.ask('How do I create an account on GhostNet?');
      expect(reply).toContain('seed phrase');
      expect(reply).toContain('No email');
    });

    it('explains seed phrase loss', () => {
      const reply = bot.ask('What if I lose my seed phrase?');
      expect(reply).toContain('No recovery');
    });

    it('explains Node ID', () => {
      const reply = bot.ask("What's a Node ID?");
      expect(reply).toContain('BLAKE3');
      expect(reply).toContain('Ed25519');
    });

    it('explains multi-device identity', () => {
      const reply = bot.ask('Can I use the same identity on multiple devices?');
      expect(reply).toContain('deterministically');
    });

    it('explains PIN protection', () => {
      const reply = bot.ask("What's the PIN for?");
      expect(reply).toContain('Argon2id');
      expect(reply).toContain('6-digit');
    });

    it('matches Argon2id auth query', () => {
      const reply = bot.ask('How do I configure Argon2id?');
      expect(reply).toContain('Argon2id');
    });
  });

  describe('encryption', () => {
    it('explains encryption algorithms', () => {
      const reply = bot.ask('What encryption does GhostNet use?');
      expect(reply).toContain('AES-256-GCM');
    });

    it('confirms GhostNet cannot read messages', () => {
      const reply = bot.ask('Can GhostNet read my messages?');
      expect(reply).toContain('cannot decrypt');
    });

    it('explains interception protection', () => {
      const reply = bot.ask('What happens if someone intercepts my message?');
      expect(reply).toContain('encrypted blob');
    });

    it('explains metadata protection', () => {
      const reply = bot.ask('Is metadata protected too?');
      expect(reply).toContain('Phantom');
    });

    it('compares to Signal', () => {
      const reply = bot.ask("How is this different from Signal?");
      expect(reply).toContain('peer-to-peer');
      expect(reply).toContain('Signal');
    });
  });

  describe('ghost shield & cloaking', () => {
    it('explains Ghost Shield', () => {
      const reply = bot.ask('What is Ghost Shield?');
      expect(reply).toContain('3-tier');
    });

    it('explains tier differences', () => {
      const reply = bot.ask('What does each tier do?');
      expect(reply).toContain('Stealth');
      expect(reply).toContain('Phantom');
    });

    it('explains Full Ghost Protocol', () => {
      const reply = bot.ask('What is Full Ghost Protocol?');
      expect(reply).toContain('invisible');
    });

    it('explains cloaking pricing', () => {
      const reply = bot.ask('Is Ghost Shield free?');
      expect(reply).toContain('Stealth');
    });

    it('explains latency impact', () => {
      const reply = bot.ask('Does Ghost Shield slow down messaging?');
      expect(reply).toContain('latency');
    });
  });

  describe('proximity connect', () => {
    it('explains Proximity Connect', () => {
      const reply = bot.ask('What is Proximity Connect?');
      expect(reply).toContain('Bluetooth Low Energy');
    });

    it('confirms offline capability', () => {
      const reply = bot.ask('Does it work without internet?');
      expect(reply).toContain('no relay server');
    });

    it('explains detection privacy', () => {
      const reply = bot.ask('Can random people detect me via BLE?');
      expect(reply).toContain('opt-in');
    });

    it('explains BLE range', () => {
      const reply = bot.ask("What's the range?");
      expect(reply).toContain('10-30 meters');
    });
  });

  describe('general', () => {
    it('explains pricing tiers', () => {
      const reply = bot.ask('Is GhostNet free?');
      expect(reply).toContain('free forever');
    });

    it('explains open source status', () => {
      const reply = bot.ask('Is GhostNet open source?');
      expect(reply).toContain('MIT license');
    });

    it('lists supported platforms', () => {
      const reply = bot.ask('What platforms does GhostNet support?');
      expect(reply).toContain('Android');
      expect(reply).toContain('iOS');
    });

    it('credits the builder', () => {
      const reply = bot.ask('Who built GhostNet?');
      expect(reply).toContain('N11X Labs');
    });

    it('explains government data requests', () => {
      const reply = bot.ask('Can governments force GhostNet to hand over data?');
      expect(reply).toContain('nothing to hand over');
    });

    it('compares to Telegram', () => {
      const reply = bot.ask('How is GhostNet different from Telegram?');
      expect(reply).toContain('peer-to-peer');
    });

    it('explains how to contact users', () => {
      const reply = bot.ask('How do I contact another user?');
      expect(reply).toContain('Node ID');
      expect(reply).toContain('Ghost Cards');
    });

    it('explains GhostNet Pay', () => {
      const reply = bot.ask('What is GhostNet Pay?');
      expect(reply).toContain('Polygon');
      expect(reply).toContain('USDC');
    });
  });

  describe('fallback', () => {
    it('returns terminal error for unrelated input', () => {
      const reply = bot.ask('What is the weather today?');
      expect(reply).toContain('Terminal Error');
    });

    it('returns terminal error for empty input', () => {
      const reply = bot.ask('');
      expect(reply).toContain('Terminal Error');
    });
  });
});
