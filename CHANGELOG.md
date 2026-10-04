# Changelog

All notable changes to the **SubNetCalc-Electron** desktop application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-05

### Added

- **Pure TypeScript Subnet Engine**:
  - Full IPv4 classless subnet calculations with RFC 791 and RFC 3021 (/31 point-to-point) compliance.
  - Full IPv6 128-bit subnet calculation with RFC 4291 and RFC 5952 canonical formatting.
  - RFC 4193 Unique Local IPv6 Unicast Address (ULA) generator with cryptographically secure global ID entropy.
  - Interactive binary bit visualizer with color-coded network prefix, subnet bits, and interface/host bits.
  - Copy-to-clipboard actions with visual toast notifications for all network calculation metrics.
  - Non-blocking DNS PTR reverse lookup and MaxMind GeoIP country/city identification via Electron IPC.
  - Real-time calculation history with persistent local session drawer and rapid reload.
  - Dynamic theme support (Midnight Slate dark theme and Snow White light theme).

- **High-Density Fixed Viewport UI**:
  - Two-column zero-scroll layout calibrated for 1060×700 fixed desktop bounds.
  - HTML5 native `<dialog>` About modal with keyboard `Escape` dismissal, focus trapping, and ARIA attributes.
  - High-contrast buttons and alert banners compliant with WCAG AAA accessibility contrast guidelines (>5.6:1 and >10.5:1).

- **Memory Governance & Stability**:
  - Integrated memory watch daemon monitoring process RSS every 60 seconds with automatic GC threshold governance (<100 MB).
  - Clean promise lifecycles with strict DNS timer clearing on abort and resolution.

- **Build & Packaging**:
  - Electron 44.5.1, React 19.3.0, and Vite 8.3.2 build architecture.
  - Universal macOS packaging (`release/SubNetCalc-1.0.0-arm64.dmg` for Apple Silicon and `release/SubNetCalc-1.0.0.dmg` for Intel x64).
  - Standalone transparent application launcher icon (`build/icon.png` and `build/icon.icns`).

### Security & Hardening

- Hardened Content Security Policy (CSP) without `'unsafe-inline'`.
- Strict Electron isolation: `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- Zero vulnerable dependencies reported across `npm audit` (0 vulnerabilities).

### Documentation

- Added comprehensive [`DOCNOTE.md`](DOCNOTE.md) recording 13-pillar code verification report and RFC compliance matrix.
- Added comprehensive [`CHANGELOG.md`](CHANGELOG.md) adhering to Keep a Changelog.
