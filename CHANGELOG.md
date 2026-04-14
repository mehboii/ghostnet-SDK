# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-14

### Added

- `GhostNet` client class with identity management, WebSocket connectivity, and messaging
- BIP-39 seed phrase based identity creation and restoration
- Ed25519 keypair derivation with BLAKE3 node IDs
- Hybrid encryption: X25519 ECDH + HKDF-SHA256 + AES-256-GCM
- WebSocket transport with automatic reconnect and exponential backoff
- Typed error hierarchy: `GhostNetError`, `ConnectionError`, `IdentityError`, `EncryptionError`, `PeerNotFoundError`
- Debug logging toggle
- Dual ESM + CJS build output with TypeScript declarations
- Full test suite (vitest)
- CI pipeline (GitHub Actions)
