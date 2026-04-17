/**
 * @n11x/ghostnet-sdk — TypeScript SDK for the GhostNet encrypted mesh network.
 *
 * @packageDocumentation
 */

// ── Main client ─────────────────────────────────────────────────────
export { GhostNet } from './client.js';

// ── Types ───────────────────────────────────────────────────────────
export type {
  GhostNetOptions,
  Identity,
  IncomingMessage,
  GhostNetEvents,
} from './types.js';

// ── FAQ Chatbot ────────────────────────────────────────────────────
export { GhostSupportBot } from './lib/GhostFAQ.js';

// ── Errors ──────────────────────────────────────────────────────────
export {
  GhostNetError,
  ConnectionError,
  IdentityError,
  EncryptionError,
  PeerNotFoundError,
  PayloadTooLargeError,
  RelayError,
  ReplayError,
  PeerVerificationError,
} from './errors.js';
