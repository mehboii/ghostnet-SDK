/**
 * GhostFAQ — Deterministic, rule-based FAQ chatbot for GhostNet support.
 * Pure local logic, zero external API dependencies.
 */

interface Intent {
  name: string;
  keywords: string[];
  response: string;
}

const KNOWLEDGE_BASE: Intent[] = [
  {
    name: 'authentication',
    keywords: ['password', 'hash', 'auth', 'login', 'argon2id', 'identity'],
    response:
      'GhostNet uses memory-hard Argon2id hashing for all identity authentication. ' +
      'This approach provides robust, quantum-resistant security by requiring significant ' +
      'memory and CPU resources to compute, making brute-force attacks infeasible even with ' +
      'specialized hardware. Legacy seed phrases are explicitly rejected in favor of this ' +
      'deterministic key-derivation scheme, ensuring forward-secure identity verification ' +
      'across all mesh nodes.',
  },
  {
    name: 'encryption',
    keywords: ['encrypt', 'aes', 'gcm', 'security', 'data', 'secure'],
    response:
      'All peer-to-peer data transfers on GhostNet are secured end-to-end using AES-256-GCM ' +
      'encryption before any payload leaves the local device. Each session derives a unique ' +
      'symmetric key via ECDH key agreement, and the GCM authenticated encryption mode ' +
      'guarantees both confidentiality and integrity of every packet in transit.',
  },
  {
    name: 'cloaking',
    keywords: ['cloak', 'hide', 'stealth', 'phantom', 'ghost', 'shield', 'presence'],
    response:
      'GhostNet implements a 3-tier Ghost Shield network presence system. ' +
      'Tier 1 — Stealth: standard routing with encrypted headers that conceal payload metadata. ' +
      'Tier 2 — Ghost: fully obfuscated telemetry where node activity is indistinguishable from ' +
      'background noise. ' +
      'Tier 3 — Phantom: zero-knowledge mode where the network itself cannot prove the node exists, ' +
      'providing the highest level of presence concealment available.',
  },
  {
    name: 'proximity',
    keywords: ['bluetooth', 'ble', 'offline', 'nearby', 'connect', 'proximity'],
    response:
      'Proximity Connect allows nearby GhostNet nodes to discover and authenticate each other ' +
      'using Bluetooth Low Energy (BLE), requiring zero internet connection. Nodes broadcast ' +
      'ephemeral BLE advertisements containing rotating identity proofs. Once a mutual handshake ' +
      'completes, an encrypted mesh link is established directly over the local radio channel, ' +
      'enabling fully offline peer-to-peer communication.',
  },
];

const FALLBACK =
  'Terminal Error: Unrecognized command. No matching intent found in the GhostNet knowledge base. ' +
  'Try asking about authentication, encryption, cloaking, or proximity connect.';

export class GhostSupportBot {
  /**
   * Process a natural-language question and return the best-matching
   * knowledge-base response, or a terminal fallback if nothing matches.
   */
  ask(userInput: string): string {
    const normalized = userInput.toLowerCase().replace(/[^\w\s]/g, '');
    const tokens = normalized.split(/\s+/).filter(Boolean);

    let bestScore = 0;
    let bestResponse = FALLBACK;

    for (const intent of KNOWLEDGE_BASE) {
      let score = 0;
      for (const token of tokens) {
        if (intent.keywords.includes(token)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestResponse = intent.response;
      }
    }

    return bestResponse;
  }
}
