# Local Discovery Scripts

These scripts enable GhostNet peer discovery **without internet access** using Bluetooth Low Energy (BLE) and mDNS (local network).

> **These scripts cannot be tested by CI.** They require physical hardware (Bluetooth adapter) or two devices on the same LAN. They are provided for manual testing only.

## BLE Discovery (Air-Gap / Proximity)

Requires: `npm install @abandonware/noble`

**Device 1 — Advertise:**
```bash
sudo node ble-advertise.mjs --seed "your twelve word seed phrase"
```

**Device 2 — Scan:**
```bash
sudo node ble-scanner.mjs
```

The scanner will detect the advertiser's GhostNet node ID and public key over Bluetooth.

### Platform Notes
- **Linux**: Requires `sudo` or `cap_net_raw` capability
- **macOS**: Works without sudo (uses CoreBluetooth)
- **Windows**: Requires Windows 10+ with BLE support

## mDNS Discovery (Same LAN)

Requires: `npm install bonjour-service`

**Device 1 — Announce:**
```bash
node mdns-announce.mjs --seed "your twelve word seed phrase" --port 9876
```

**Device 2 — Discover:**
```bash
node mdns-discover.mjs
```

The discover script will print all GhostNet peers found on the local network.

## Security Notes

- These scripts expose the **public key** and **node ID** only — never the private key or seed phrase.
- BLE has limited range (~10m) which provides natural physical security.
- mDNS is LAN-only and not routable over the internet.
- For production use, add mutual authentication before exchanging messages.
