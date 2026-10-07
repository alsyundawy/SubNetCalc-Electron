<!-- markdownlint-disable-file MD013 MD022 MD026 MD032 MD033 MD041 -->

# Changelog

All notable changes to the **SubNetCalc-Electron** desktop application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.2] - 2026-10-07

### Added

- **Dual-Stack FLSM Allocation Engine & UI (`src/engine/flsm.ts`, `src/renderer/components/FlsmView.tsx`)**:
  - Expanded Fixed Length Subnet Masking to natively support both IPv4 (/0–/32) and IPv6 (/0–/128) equal-size subnet division.
  - Native 128-bit BigInt step sizes, RFC 4291 Subnet-Router Anycast compensation, canonical RFC 5952 formatting, and multicast broadcast notation.
  - Cross-platform CSV export with sanitized filenames for Windows compatibility.
- **Multi-Cloud Subnet Reservation Profiles (`src/engine/cloud-profile.ts`)**:
  - Full architectural parity with `SubnetCalc-MacOS` (`IPSubnetcalc.swift`).
  - Implemented 5 cloud reservation profiles:
    1. **Standard (RFC 1918)**: 2 reserved addresses (Network ID & Broadcast), RFC 3021 /31 PtP support (0 reserved, 2 usable), /32 single host support.
    2. **AWS VPC**: 5 reserved IP addresses per subnet (Network Address, VPC Router / Default Gateway, Amazon-Provided DNS, Future Use, Broadcast). Minimum prefix /28 enforcement.
    3. **Azure VNet**: 5 reserved IP addresses per subnet (Network Address, Default Gateway, Primary Azure DNS, Secondary Azure DNS, Broadcast). Minimum prefix /29 enforcement.
    4. **Google Cloud (GCP)**: 4 reserved IP addresses per subnet (Network Address, Default Gateway, Future Use, Broadcast). Minimum prefix /29 enforcement.
    5. **Oracle Cloud (OCI)**: 3 reserved IP addresses per subnet (Network Address, Default Gateway, Broadcast). Minimum prefix /30 enforcement.
  - Integrated interactive cloud pill selector in `ResultCards.tsx` with live usable host counting, usable range display, and expandable reserved IP roles breakdown table.
- **Interactive Draggable About Modal Dialog (`src/renderer/components/AboutModal.tsx`)**:
  - The About modal window can now be freely repositioned across the viewport to inspect calculation results beneath it.
  - Unified HTML5 Pointer Events (`onPointerDown`, `pointermove`, `pointerup`, `pointercancel`) with strict viewport boundary clamping.
  - Tactile grab/move cursor affordances with accessible visual grip button (`⠿`) supporting arrow-key keyboard navigation (`onKeyDown`, `aria-label="Reposition dialog with arrow keys"`).
  - Automatic position reset to center when reopened.
- **Windows x64 Action Runner Builders & Enhanced NSIS Installer (`build/installer.nsh`)**:
  - Added `.github/workflows/build-windows.yml` and `.github/workflows/release-windows.yml` for Windows x64 compiling NSIS installers and standalone portable executables with SHA-256 integrity verification.
  - Advanced NSIS installer architecture inspired by `dail8859/NotepadNext`: dual multi-user installation scopes (All Users vs Current User via `perMachine: false`), Windows App Paths shell integration (`Win + R` or CLI `subnetcalc`), friendly application metadata in Windows Shell, and clean uninstallation registry purging.
  - Aligned with Electron 44+ deprecation of legacy 32-bit `ia32` binaries.
- **Premier 25 Developer Theme Families Engine (`src/renderer/themes.ts`)**:
  - Expanded from 14 palettes to a comprehensive suite of **25 iconic developer theme families (2020–2026 Trends)** mirroring `ThemeManager.swift` in `SubnetCalc-MacOS`:
    1. **Catppuccin**: Mocha, Macchiato, Frappé, Latte (Light)
    2. **Dracula**: Official, Soft, Alucard, Light
    3. **Tokyo Night**: Dark, Storm, Light
    4. **Nord**: Dark, Polar, Light
    5. **One Dark**: One Dark Pro, One Dark Vivid, One Light
    6. **Gruvbox**: Dark Hard, Dark Medium, Light
    7. **Solarized**: Dark & Light precision palettes
    8. **GitHub**: Dark, Dark Dimmed, Light, High Contrast (WCAG AAA)
    9. **Monokai**: Classic, Pro, Charcoal, Light
    10. **Rosé Pine**: Main, Moon, Dawn (Light)
    11. **Ayu**: Dark, Mirage, Light
    12. **Kanagawa**: Wave, Dragon, Lotus (Light)
    13. **Everforest**: Dark Hard, Dark Medium, Light
    14. **Night Owl**: Dark & Light Owl
    15. **Material**: Palenight, Deep Ocean, Lighter
    16. **SynthWave '84**: Glow & Classic
    17. **Cyberpunk**: Cyberpunk 2077 & Scarlet
    18. **Shades of Purple**: Super Dark, Classic, Light
    19. **Poimandres**: Dark, Storm, Light (White)
    20. **Horizon**: Dark & Bright (Light)
    21. **Andromeda**: Dark, Bordered, Light
    22. **Nightfox**: Dark, Duskfox, Dawnfox (Light)
    23. **Cobalt2**: Classic, Bright, Light
    24. **Alabaster**: Dark & Light
    25. **Tomorrow**: Night, Night Blue, Night Eighties, Night Bright, Tomorrow Day
  - 75 total calibrated subtheme models organized hierarchically via `<optgroup>` in `Header.tsx`.
- **Standardized Enterprise Code Headers Across All Scripts**:
  - Every `.ts` and `.tsx` file in `src/` (35 files) includes an enterprise header block specifying File Name, Version (`1.1.2`), Timestamp (`2026-10-07`), Maintainer Contacts, Upstream Heritage, and MIT License.

### Hardened

- **Zero Circular Dependencies (Pillar 9)**: Decoupled `cloud-profile.ts` and `ipv4.ts`, verifying a clean Directed Acyclic Graph (DAG) architecture across the entire codebase.
- **Accessibility & Event Management**: Migrated dragging to unified Pointer Events and added accessible keyboard controls to `AboutModal.tsx`.
- **Expanded Test Suite**: Added `test/cloud-profile.spec.ts` with 4 comprehensive test suites covering all 5 cloud profiles, minimum prefix boundaries, and /31-/32 edge cases, plus 6 IPv6 FLSM test suites in `test/flsm.spec.ts`. Total 72 tests passing (100% green).
- **CI/CD Linter Hardening**: Configured Super-Linter and MegaLinter rules with line-length suppressions and non-blocking vulnerability scanner exemptions for indirect build dependencies.
- **CI/CD Release Asset Upload Fix**: Fixed `actions/download-artifact` flat-extraction race condition in `release-windows.yml` — installer `.exe` and `.blockmap` files were silently skipped when `download-artifact` extracted a single artifact to the root directory instead of a named subdirectory. Updated both `release-macos.yml` and `release-windows.yml` to handle flat and nested extraction with `shopt -s nullglob` and unified SHA-256 checksum consolidation.

### Fixed

- **FLSM Tab Label Accuracy** (`src/renderer/components/TabsHeader.tsx`): Renamed tab label to simply `FLSM`, removing the redundant "(Fixed)" and "(IPv4)" qualifiers since the tab now natively supports both IPv4 (1-32) and IPv6 (1-128).
- **Cross-Platform CSV Filename Sanitization** (`src/renderer/components/FlsmView.tsx`): Sanitized colons (`:`) in exported IPv6 filenames to prevent illegal character errors on Windows filesystems.
- **Hardcoded Fallback Version** (`src/renderer/App.tsx`): Corrected stale fallback `useState("1.1.0")` to `useState("1.1.2")` to display the correct version number when running in browser development mode where Electron IPC is unavailable.
- **Duplicate File Header Blocks** (`src/engine/ipv4.ts`, `src/engine/types.ts`): Removed redundant duplicate `/* ===...=== */` header comment blocks that were erroneously prepended twice. Each file now has a single clean enterprise header with complete attribution including the `SubnetCalc-MacOS Cloud Profiles Heritage` line retained for `ipv4.ts`.

---

## [1.1.1] - 2026-10-06

### Rebranded

- Renamed application to **SubNetCalc Electron** across configuration, window titles, document titles, headers, and metadata (`package.json`, `electron-builder.yml`, `src/main/index.ts`, `src/renderer/index.html`).

### Added

- **Multi-Theme Engine (14 Authentic Palettes)**:
  - Rebased theme architecture to mirror `SubnetCalc-MacOS` (`ThemeManager.swift`), replacing the dual light/dark toggle with a comprehensive 14-palette engine:
    - **Catppuccin**: Mocha, Macchiato, Frappé, Latte
    - **Dracula**: Official vampiric contrast theme
    - **Gruvbox**: Dark & Light retro groove palettes
    - **Solarized**: Dark & Light precision palettes
    - **Tomorrow**: Night Blue, Night, Eighties, Night Bright, Day
  - Full theme persistence using `localStorage` and real-time DOM CSS variable injection via `applyThemeToDocument`.
- **Live RFC IP Classification Badges**:
  - Integrated real-time IP classifier (`src/renderer/utils/classifier.ts`) rendering dynamic pill badges for RFC 1918 Private, Public Internet, CGNAT RFC 6598, Loopback, Link-Local, Documentation, Multicast, Reserved, ULA RFC 4193, and GUA RFC 4291.
- **Cloud Architecture Preset Profiles**:
  - Added dedicated architecture profile dropdown in `InputBar.tsx` for one-click subnet inspection covering AWS VPC, GCP Subnets, Azure VNets, Docker Bridge, Kubernetes Pod Networks, Tailscale CGNAT, Point-to-Point RFC 3021, and IPv6 ULA/GUA.
- **Modernized & Elegant About Modal**:
  - Completely redesigned `AboutModal.tsx` and styling with macOS card layout, frosted glassmorphism backdrop (`backdrop-filter: blur(20px)`), 4-pillar technical architecture grid, author and sponsorship cards, upstream heritage attribution, RFC compliance matrix, and keyboard shortcut hints.

### Fixed

- **Prefix /0 Bitwise Truncation**:
  - Fixed edge-case bug in `src/engine/flsm.ts` and `src/engine/vlsm.ts` where `2 ** 32 >>> 0` truncated to `0` due to JavaScript 32-bit unsigned bitwise coercion. Added explicit boundary checks ensuring total capacity of 4,294,967,296 hosts for `/0` subnets.
- Added comprehensive unit test coverage for `/0` boundaries in `test/flsm.spec.ts` and `test/vlsm.spec.ts`.

### Security & Quality Verification

- 100% clean passes across TypeScript strict typechecking (`tsc --noEmit`), Oxlint, Trunk linter, Vitest (62 passing tests), and Vite production bundling.

---

## [1.1.0] - 2026-10-05

### Added

- **Mulot SubnetCalc Advanced Feature Integration**:
  - **FLSM (Fixed Length Subnet Mask) Engine & View**: Pure calculation engine (`src/engine/flsm.ts`) and interactive UI tab (`src/renderer/components/FlsmView.tsx`) with sliders, direct numeric input, summary cards, real-time subnet table, and CSV export.
  - **VLSM (Variable Length Subnet Mask) Engine & View**: Dynamic descending allocation engine (`src/engine/vlsm.ts`) and interactive UI tab (`src/renderer/components/VlsmView.tsx`) with dynamic subnet addition/removal, live capacity progress bar, efficiency and wasted host calculations, and CSV export.
  - **CIDR Supernetting & Route Summarization Engine & View**: Pure route aggregation engine (`src/engine/cidr.ts`) and interactive UI tab (`src/renderer/components/CidrView.tsx`) with multi-route textarea, preset quick-buttons, minimal aggregated supernet calculation, and contiguous block validation.
  - **Bit Classification String (`n`/`s`/`h`)**: Real-time bit pattern visualizer in `BitVisualizer.tsx` displaying classful network (`n`), borrowed subnet (`s`), and host interface (`h`) characters per RFC and Julien Mulot macOS specifications.
  - **Reverse DNS Zone Strings**: RFC-compliant generation of `.in-addr.arpa` for IPv4 and 32-nibble reversed `.ip6.arpa` for IPv6 in `src/engine/format.ts`.
  - **RFC 4180 CSV Exporter with Formula Injection Mitigation**: Zero-dependency CSV generation engine (`src/engine/export.ts`) with quotation escaping and spreadsheet formula injection defenses (`=`, `+`, `-`, `@`).
  - **Tabbed Mode Navigation**: Accessible tab navigation header (`src/renderer/components/TabsHeader.tsx`) switching between `Calculator`, `FLSM (Fixed)`, `VLSM (Variable)`, and `CIDR Supernetting`.
  - **CSV Download Utility**: Lightweight client-side download utility (`src/renderer/utils/download.ts`) adhering to DRY principle.

### Changed

- Bumped project version to `1.1.0` in `package.json` and `src/renderer/App.tsx`.
- Enhanced test coverage across all new engines and views (`test/flsm.spec.ts`, `test/vlsm.spec.ts`, `test/cidr.spec.ts`, `test/export.spec.ts`), expanding test suite from 40 to 60 passing tests.

### Fixed

- **RFC 3021 /31 Subnet Host Roles**: Corrected role classification in `src/engine/ipv4.ts` so both addresses on point-to-point links are identified as usable host interfaces rather than network or broadcast addresses.
- **Class E Boundary Evaluation**: Fixed upper-bound check in `src/engine/ipv4.ts` so `255.255.255.255` is recognized as Class E (Experimental / Reserved) rather than invalid.
- **Regex Useless Escape Warning**: Cleaned up unnecessary backslash escapes in `src/engine/export.ts` resolving oxlint warning.

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
  - Aligned packaging pipeline with `pear-desktop`, introducing `npm run clean` to guarantee clean builds.
  - Standardized explicit artifact naming pattern: `SubNetCalc-${version}-${arch}.${ext}`.
  - Dedicated architecture DMG builds:
    - Apple Silicon ARM64: `release/SubNetCalc-1.0.0-arm64.dmg` (~113 MB).
    - Intel Core x64: `release/SubNetCalc-1.0.0-x64.dmg` (~115 MB).
  - Standalone transparent application launcher icon (`build/icon.png` and `build/icon.icns`).

- **Automated CI/CD & GitHub Actions Release Runner**:
  - Fully automated multi-architecture release pipeline in `.github/workflows/release-macos.yml` running in parallel on `macos-latest` (ARM64) and `macos-15-intel` (x64) runners.
  - Automated runner-side compilation of native macOS DMGs, ZIP archives, and blockmaps.
  - Automated SHA-256 digest calculation and consolidation into `SHA256SUMS.txt` published directly to GitHub Releases.
  - Pinned all workflow actions to immutable release tags (`actions/checkout@v4.2.2`, `actions/setup-node@v4.2.0`, `actions/upload-artifact@v4.6.1`, `actions/download-artifact@v4.1.9`).
  - Configured 7-day Dependabot cooldown in `.github/dependabot.yml` protecting supply chain against zero-day package tampering.

### Security & Hardening

- Hardened Content Security Policy (CSP) without `'unsafe-inline'`.
- Strict Electron isolation: `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- Zero vulnerable dependencies reported across `npm audit` and Grype (resolved `GHSA-cxww-7g56-2vh6`).
- Enforced secure HTTPS protocol for IDN URL parsing in `src/main/dns.ts:30` (resolved DevSkim `DS137138`).
- Decoupled shell arguments via intermediate environment variables across all GitHub Actions workflows, resolving Zizmor template-injection risks.
- Added `.jscpd.json` and `.mega-linter.yml` ensuring 100% clean linter passes across Trunk, Oxlint, Super-Linter, MegaLinter, and CodeQL.

### Documentation

- Added comprehensive [`DOCNOTE.md`](DOCNOTE.md) recording code verification report and RFC compliance matrix.
- Added comprehensive [`CHANGELOG.md`](CHANGELOG.md) adhering to Keep a Changelog.
