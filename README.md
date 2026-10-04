# SubNetCalc-Electron

<p align="center">
  <img src="build/icon.png" width="128" height="128" alt="SubNetCalc Logo" style="border-radius: 24px;" />
</p>

<p align="center">
  <strong>High-Precision IPv4 & IPv6 Subnet Calculator Desktop Application</strong><br />
  A modern, high-craft desktop application built with Electron, React, TypeScript, and Vite.
</p>

---

## Highlights

- **Complete Subnet Calculation**: Calculates Network, Netmask, Wildcard, Broadcast, Host Bits, Max Hosts, and Usable Host Ranges for any IPv4 or IPv6 prefix.
- **RFC 3021 /31 PtP Support**: Honors 31-bit point-to-point links (both addresses usable, no broadcast).
- **RFC 5952 Canonical IPv6**: Strict IETF canonical IPv6 string formatting and compression.
- **EUI-64 MAC Derivation**: Automatically detects EUI-64 interface identifiers and extracts the hardware MAC address.
- **Solicited-Node Multicast**: Generates RFC 4291 solicited-node multicast addresses (`ff02::1:ffXX:XXXX`).
- **RFC 4193 Unique Local IPv6 (ULA)**: Cryptographic 40-bit Global ID and ULA address generation.
- **Interactive Bit Visualizer**: Color-coded binary representation distinguishing network bits from host bits across octets and hextets.
- **Reverse DNS & GeoIP**: Fast, non-blocking asynchronous PTR resolution and optional GeoLite2 country lookup.
- **Dark & Light Modes**: Premium glassmorphic interface with Plus Jakarta Sans and JetBrains Mono typography.
- **Upstream Verified**: Rigorously validated with 100% test coverage against Dr. Thomas Dreibholz canonical subnetcalc CLI tool.

---

## Quick Start

### Prerequisites
- Node.js v20 or newer
- npm v10 or newer

### Installation
```bash
git clone https://github.com/alsyundawy/SubNetCalc-Electron.git
cd SubNetCalc-Electron
npm install
```

### Development Mode
```bash
npm run dev
# In another terminal:
npm run dev:electron
```

### Running Test Suite
Execute the Vitest suite covering unit tests and upstream CLI oracle comparison:
```bash
npm test
```

### Production Build & Packaging
```bash
# Build TypeScript engine, main process, preload, and renderer
npm run build

# Package installers for current OS (dmg for macOS, deb/AppImage for Linux, nsis for Windows)
npm run dist
```

---

## Optional GeoIP Setup

To enable offline GeoIP country resolution:
1. Download `GeoLite2-Country.mmdb` from MaxMind.
2. Place the file into your application userData directory:
   - macOS: `~/Library/Application Support/SubNetCalc/GeoLite2-Country.mmdb`
   - Linux: `~/.config/SubNetCalc/GeoLite2-Country.mmdb`
   - Windows: `%APPDATA%\SubNetCalc\GeoLite2-Country.mmdb`
   - Or place directly inside the project root directory during development.

---

## Upstream Attribution & License

- **GUI & TypeScript Engine**: Released under the [MIT License](LICENSE).
- **Inspiration & Algorithmic Attribution**: Behavior, network logic, and test cases inspired by **SubNetCalc** (v2.7.6) by **Dr. Thomas Dreibholz** (https://github.com/dreibh/subnetcalc). See [NOTICE.md](NOTICE.md) for full attribution details.
