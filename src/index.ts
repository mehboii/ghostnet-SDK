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

// ── Errors ──────────────────────────────────────────────────────────
export {
  GhostNetError,
  ConnectionError,
  IdentityError,
  EncryptionError,
  PeerNotFoundError,
} from './errors.js';
