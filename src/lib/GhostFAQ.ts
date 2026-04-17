/**
 * GhostFAQ — Deterministic, rule-based FAQ chatbot for GhostNet support.
 * Pure local logic, zero external API dependencies.
 */

interface QA {
  keywords: string[];
  phrases: string[];
  response: string;
}

interface Category {
  name: string;
  entries: QA[];
}

const KNOWLEDGE_BASE: Category[] = [
  {
    name: 'authentication',
    entries: [
      {
        keywords: ['create', 'account', 'register', 'signup'],
        phrases: ['create account', 'sign up'],
        response:
          'There are no accounts. GhostNet generates a BIP-39 seed phrase (12 words) — that IS your identity. No email, no phone, no server storing your credentials.',
      },
      {
        keywords: ['lose', 'lost', 'forgot', 'recover', 'recovery', 'backup'],
        phrases: ['lose seed', 'lost seed', 'forgot password', 'seed phrase'],
        response:
          "It's gone. No recovery, no \"forgot password.\" GhostNet has zero knowledge of your identity. Write it down, store it offline.",
      },
      {
        keywords: ['nodeid', 'blake3'],
        phrases: ['node id', 'what is node', 'whats a node'],
        response:
          'Your Node ID is your public identity on the mesh. It\'s a BLAKE3 hash of your Ed25519 public key — derived from your seed phrase. Share it freely, it reveals nothing about your private key.',
      },
      {
        keywords: ['multiple', 'devices', 'sync'],
        phrases: ['same identity', 'multiple devices'],
        response:
          'Yes. Enter the same 12-word seed phrase on any device and your identity (keys + Node ID) regenerates deterministically.',
      },
      {
        keywords: ['pin', 'digit'],
        phrases: ['whats the pin', 'pin for', 'local protection'],
        response:
          'The PIN is local protection only. Your private key is encrypted with a 6-digit PIN hashed via Argon2id. If someone grabs your device, they still can\'t access your keys without the PIN.',
      },
      {
        keywords: ['argon2id', 'auth', 'login'],
        phrases: ['password hash', 'auth work', 'argon2id'],
        response:
          'GhostNet uses memory-hard Argon2id hashing for identity authentication. This provides robust, quantum-resistant security by requiring significant memory and CPU resources, making brute-force attacks infeasible. Legacy seed phrases are explicitly rejected in favor of this deterministic key-derivation scheme.',
      },
    ],
  },
  {
    name: 'encryption',
    entries: [
      {
        keywords: ['algorithm', 'ed25519', 'x25519', 'hkdf', 'ephemeral'],
        phrases: ['what encryption', 'encryption does', 'encryption use'],
        response:
          'Ed25519 for identity, X25519 ECDH for key exchange, HKDF-SHA256 for key derivation, and AES-256-GCM for message encryption. Every message gets a unique ephemeral key.',
      },
      {
        keywords: ['decrypt'],
        phrases: ['read my messages', 'ghostnet read', 'can ghostnet see'],
        response:
          'No. Messages are encrypted on your device before they leave. The relay transports ciphertext — it cannot decrypt anything.',
      },
      {
        keywords: ['intercept', 'intercepted', 'mitm', 'sniff', 'capture'],
        phrases: ['intercepts my', 'someone intercepts', 'man in middle'],
        response:
          'They get an encrypted blob. Without your private key and the ephemeral session key, it\'s computationally infeasible to decrypt.',
      },
      {
        keywords: ['metadata', 'timing', 'header', 'fingerprint'],
        phrases: ['metadata protected', 'metadata safe'],
        response:
          'Partially. Message content is fully encrypted. With Ghost Shield enabled (Phantom/Spectre tier), metadata like sender identity and timing patterns are also obfuscated.',
      },
      {
        keywords: ['signal'],
        phrases: ['different from signal', 'vs signal', 'compare signal'],
        response:
          "Similar principles (Double Ratchet vs our ephemeral ECDH), but GhostNet is peer-to-peer mesh — no central server holding your messages. Signal still routes through their servers.",
      },
      {
        keywords: ['aes', 'gcm', 'e2e', 'encrypted'],
        phrases: ['end to end', 'aes 256', 'data encrypted'],
        response:
          'All peer-to-peer data transfers on GhostNet are secured end-to-end using AES-256-GCM encryption before any payload leaves the local device. Each session derives a unique symmetric key via ECDH key agreement.',
      },
    ],
  },
  {
    name: 'cloaking',
    entries: [
      {
        keywords: ['shield'],
        phrases: ['ghost shield', 'what is ghost shield'],
        response:
          'Ghost Shield is a 3-tier cloaking system that controls how visible you are on the mesh. Stealth (tier 1), Ghost (tier 2), Phantom (tier 3), plus Full Ghost Protocol for maximum anonymity.',
      },
      {
        keywords: ['tiers', 'levels'],
        phrases: ['each tier', 'tier do', 'tier difference'],
        response:
          'Stealth hides your online status. Ghost additionally masks your Node ID from passive scanning. Phantom routes messages through multiple relay hops, making traffic analysis nearly impossible.',
      },
      {
        keywords: ['protocol'],
        phrases: ['full ghost protocol', 'ghost protocol', 'maximum anonymity'],
        response:
          'Full Ghost Protocol means all three tiers active simultaneously — hidden status, masked identity, multi-hop routing, plus decoy traffic generation. You become effectively invisible on the mesh.',
      },
      {
        keywords: [],
        phrases: ['ghost shield free', 'cloaking cost', 'shield price', 'cloaking free'],
        response:
          'Stealth mode is included in the free Ghost tier. Ghost and Phantom cloaking require the Phantom (\u20B999/mo) or Spectre (\u20B9499/mo) plan.',
      },
      {
        keywords: ['slow', 'latency', 'delay'],
        phrases: ['slow down', 'shield speed', 'shield slow', 'shield performance'],
        response:
          'Slightly. Multi-hop routing adds latency (typically 50-200ms per hop). For most use cases it\'s imperceptible.',
      },
      {
        keywords: ['cloak', 'stealth', 'phantom', 'cloaking'],
        phrases: ['hide presence', 'go invisible', 'cloak mode'],
        response:
          'GhostNet implements a 3-tier Ghost Shield network presence system. Tier 1 — Stealth: conceals payload metadata. Tier 2 — Ghost: obfuscated telemetry. Tier 3 — Phantom: zero-knowledge mode where the network cannot prove the node exists.',
      },
    ],
  },
  {
    name: 'proximity',
    entries: [
      {
        keywords: ['proximity'],
        phrases: ['proximity connect', 'what is proximity'],
        response:
          'Proximity Connect discovers nearby GhostNet users via Bluetooth Low Energy and mDNS — no internet required. Think AirDrop but for encrypted mesh messaging.',
      },
      {
        keywords: ['offline'],
        phrases: ['without internet', 'no internet', 'work offline'],
        response:
          "Yes. That's the point. Two devices within BLE range (~10-30m) can exchange encrypted messages directly, no relay server needed.",
      },
      {
        keywords: ['detect', 'strangers', 'scan'],
        phrases: ['random people', 'detect me', 'people detect'],
        response:
          'Only if you enable Proximity Connect. It\'s opt-in. With Ghost Shield active, your BLE beacon is also anonymized.',
      },
      {
        keywords: ['range', 'meters', 'distance'],
        phrases: ['whats the range', 'how far', 'ble range'],
        response:
          'BLE range is typically 10-30 meters indoors, up to 50m outdoors. For wider offline mesh coverage, GhostNet Node relays (Raspberry Pi, coming soon) extend this.',
      },
      {
        keywords: ['bluetooth', 'ble', 'nearby'],
        phrases: ['bluetooth connect', 'ble connect'],
        response:
          'Proximity Connect allows nearby GhostNet nodes to discover and authenticate each other using Bluetooth Low Energy (BLE), requiring zero internet connection. Nodes broadcast ephemeral BLE advertisements containing rotating identity proofs.',
      },
    ],
  },
  {
    name: 'general',
    entries: [
      {
        keywords: ['pricing', 'subscription'],
        phrases: ['ghostnet free', 'is it free', 'how much', 'pricing plan'],
        response:
          'The Ghost tier is free forever — identity, encryption, messaging. Phantom (\u20B999/mo) and Spectre (\u20B9499/mo) add advanced cloaking, priority relay, and GhostNet Pay.',
      },
      {
        keywords: ['opensource', 'license', 'mit'],
        phrases: ['open source', 'source code', 'is ghostnet open'],
        response:
          'The SDK is open source (MIT license). The core relay infrastructure is not, to prevent malicious forks.',
      },
      {
        keywords: ['platform', 'platforms', 'android', 'ios', 'desktop'],
        phrases: ['what platforms', 'which platforms', 'supported platforms'],
        response:
          'Web (any modern browser), mobile (Android/iOS via React Native), and Node.js backends. Desktop coming soon.',
      },
      {
        keywords: ['built', 'founder', 'n11x', 'team', 'created'],
        phrases: ['who built', 'who made', 'who created'],
        response:
          'N11X Labs. Solo-founded, privacy-first, built on cryptography not corporate promises.',
      },
      {
        keywords: ['government', 'enforcement', 'court', 'subpoena', 'legal', 'compel'],
        phrases: ['government force', 'hand over data', 'law enforcement'],
        response:
          "There's nothing to hand over. GhostNet doesn't store messages, doesn't hold your keys, and doesn't know your identity. You can't be compelled to give what you don't have.",
      },
      {
        keywords: ['telegram', 'whatsapp'],
        phrases: ['different from telegram', 'vs telegram', 'compare telegram', 'vs whatsapp'],
        response:
          "Telegram's \"secret chats\" are E2E encrypted but regular chats aren't. Telegram stores messages on their servers. GhostNet is E2E encrypted by default, peer-to-peer, and stores nothing server-side.",
      },
      {
        keywords: ['contact', 'reach', 'someone'],
        phrases: ['contact another', 'message someone', 'send message', 'find user', 'reach user'],
        response:
          'You need their Node ID (a hex string). Exchange it via Ghost Cards (ephemeral QR code), in person, or through any channel you trust.',
      },
      {
        keywords: ['pay', 'payment', 'usdc', 'polygon', 'wallet'],
        phrases: ['ghostnet pay', 'payment layer', 'send money'],
        response:
          'GhostNet Pay is a privacy-first payment layer using stealth addresses on Polygon (USDC). Coming in v0.2. No payment history visible on-chain tied to your real identity.',
      },
    ],
  },
];

const FALLBACK =
  'Terminal Error: Unrecognized command. No matching intent found in the GhostNet knowledge base. ' +
  'Try asking about authentication, encryption, cloaking, proximity connect, pricing, or platforms.';

export class GhostSupportBot {
  ask(userInput: string): string {
    const normalized = userInput.toLowerCase().replace(/[^\w\s]/g, '');
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const joined = tokens.join(' ');

    let bestScore = 0;
    let bestResponse = FALLBACK;

    for (const category of KNOWLEDGE_BASE) {
      for (const entry of category.entries) {
        let score = 0;

        for (const phrase of entry.phrases) {
          if (joined.includes(phrase)) {
            score += 3 * phrase.split(' ').length;
          }
        }

        for (const token of tokens) {
          if (entry.keywords.includes(token)) {
            score += 2;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestResponse = entry.response;
        }
      }
    }

    return bestResponse;
  }
}
