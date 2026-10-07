/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/AboutModal.tsx
 * Version: 1.1.2
 * Date & Time: 2026-10-07T11:00:00+07:00
 *
 * Maintainer & Lead Developer:
 *   Harry Dertin Sutisna Alsyundawy (Alsyundawy IT Solution)
 *   Email: alsyundawy@gmail.com
 *   Website: https://alsyundawy.com
 *   GitHub: https://github.com/alsyundawy
 *
 * Original Heritage & Algorithmic Attribution:
 *   - Dr. Thomas Dreibholz (dreibh/subnetcalc - RFC Calculation Engine)
 *   - Julien Mulot (mulot/SubnetCalc - Original macOS Subnet Calculator)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/AboutModal.tsx
 * Version: 1.1.2
 * Date & Time: 2026-10-07T11:00:00+07:00
 *
 * Maintainer & Lead Developer:
 *   Harry Dertin Sutisna Alsyundawy (Alsyundawy IT Solution)
 *   Email: alsyundawy@gmail.com
 *   Website: https://alsyundawy.com
 *   GitHub: https://github.com/alsyundawy
 *
 * Original Heritage & Algorithmic Attribution:
 *   - Dr. Thomas Dreibholz (dreibh/subnetcalc - RFC Calculation Engine)
 *   - Julien Mulot (mulot/SubnetCalc - Original macOS Subnet Calculator)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import appIcon from "../assets/icon.png";

export type AboutModalProps = {
  readonly version: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
};

export function AboutModal({
  version,
  isOpen,
  onClose,
}: Readonly<AboutModalProps>): React.JSX.Element | null {
  // Draggable window state
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
  }>({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Reset position when opened
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Window drag event listeners

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const maxOffsetW = Math.max(100, window.innerWidth / 2 - 80);
    const maxOffsetH = Math.max(100, window.innerHeight / 2 - 80);

    const clampedX = Math.max(
      -maxOffsetW,
      Math.min(maxOffsetW, dragRef.current.initX + dx),
    );
    const clampedY = Math.max(
      -maxOffsetH,
      Math.min(maxOffsetH, dragRef.current.initY + dy),
    );

    setPosition({ x: clampedX, y: clampedY });
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only initiate drag if not clicking buttons or interactive links
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) {
      return;
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y,
    };
    setIsDragging(true);
  };

  if (!isOpen) return null;

  return (
    <dialog open aria-labelledby="about-modal-title" className="modal-overlay">
      <button
        type="button"
        className="modal-backdrop-btn"
        onClick={onClose}
        aria-label="Close dialog backdrop"
        tabIndex={-1}
      />

      <div
        className={`modal-content about-modal-elegant ${isDragging ? "is-dragging" : ""}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: isDragging ? "none" : "transform 0.08s ease-out",
        }}
      >
        {/* Modal Header with Draggable Gripper */}
        <div
          className="modal-header draggable-header"
          onPointerDown={handleHeaderPointerDown}
          title="Click and drag to move this dialog"
        >
          <div className="about-header-branding">
            <img
              src={appIcon}
              alt="SubNetCalc Electron Logo"
              className="about-header-icon"
            />
            <div>
              <div id="about-modal-title" className="modal-title">
                SubNetCalc Electron
              </div>
              <div className="about-subtitle-row">
                <span className="about-tag">Desktop Suite</span>
                <span className="about-tag tag-accent">
                  v{version || "1.1.2"}
                </span>
                <span className="about-tag tag-muted">MIT License</span>
              </div>
            </div>
          </div>

          <div className="about-header-actions">
            <button
              type="button"
              className="drag-indicator-handle"
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  setPosition((p) => ({ ...p, y: Math.max(-200, p.y - 10) }));
                } else if (e.key === "ArrowDown") {
                  setPosition((p) => ({ ...p, y: Math.min(200, p.y + 10) }));
                } else if (e.key === "ArrowLeft") {
                  setPosition((p) => ({ ...p, x: Math.max(-300, p.x - 10) }));
                } else if (e.key === "ArrowRight") {
                  setPosition((p) => ({ ...p, x: Math.min(300, p.x + 10) }));
                }
              }}
              aria-label="Reposition dialog with arrow keys"
              title="Move window (drag or use arrow keys)"
            >
              ⠿
            </button>
            <button
              type="button"
              className="btn-icon modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body about-scroll-content">
          {/* Mission & Overview Hero */}
          <section className="about-hero-card">
            <p className="about-mission-text">
              <strong>SubNetCalc Electron</strong> is a production-grade,
              ultra-fast IPv4 &amp; IPv6 Subnet Calculator desktop application.
              Engineered with deterministic pure bitwise arithmetic, instant
              mask synchronization, bitmapped visualizers, FLSM/VLSM
              decomposition, CIDR aggregation, Multi-Cloud VPC reservation
              profiles, and a premier 25 developer theme families engine.
            </p>
          </section>

          {/* Technical Specs & Capabilities Grid */}
          <section className="about-section-group">
            <div className="about-section-title">
              ⚡ Engineering Architecture &amp; Capabilities
            </div>
            <div className="about-grid-capabilities">
              <div className="about-feature-box">
                <span className="about-feature-icon">🚀</span>
                <div>
                  <strong>Sub-Millisecond Engine</strong>
                  <p>
                    Synchronous bitwise shifts executed locally with zero DOM
                    lag.
                  </p>
                </div>
              </div>
              <div className="about-feature-box">
                <span className="about-feature-icon">🎨</span>
                <div>
                  <strong>25 Developer Theme Families</strong>
                  <p>
                    Catppuccin, Dracula, Tokyo Night, Nord, One Dark, Gruvbox,
                    Solarized, and 18 more developer palettes.
                  </p>
                </div>
              </div>
              <div className="about-feature-box">
                <span className="about-feature-icon">☁️</span>
                <div>
                  <strong>Multi-Cloud Reservation Profiles</strong>
                  <p>
                    AWS VPC, Azure VNet, Google Cloud (GCP), Oracle (OCI), and
                    Standard RFC 1918 allocations.
                  </p>
                </div>
              </div>
              <div className="about-feature-box">
                <span className="about-feature-icon">🔒</span>
                <div>
                  <strong>Zero-Telemetry &amp; Offline</strong>
                  <p>
                    100% private. Strict sandbox context isolation and CSP
                    defense.
                  </p>
                </div>
              </div>
              <div className="about-feature-box">
                <span className="about-feature-icon">📊</span>
                <div>
                  <strong>FLSM &amp; VLSM Suite</strong>
                  <p>
                    Hierarchical allocations, efficiency analytics, and CSV
                    exports.
                  </p>
                </div>
              </div>
              <div className="about-feature-box">
                <span className="about-feature-icon">🪟</span>
                <div>
                  <strong>Universal Cross-Platform</strong>
                  <p>
                    Native macOS (Apple Silicon ARM64 &amp; Intel), Windows (x64
                    &amp; x86), and Linux.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Maintainer & Author Card */}
          <section className="about-card-author">
            <div className="about-card-title">👨‍💻 Author &amp; Maintainer</div>
            <p className="about-author-name">
              <strong>Harry Dertin Sutisna Alsyundawy</strong>{" "}
              <a
                href="https://github.com/alsyundawy"
                target="_blank"
                rel="noreferrer"
                className="about-link"
              >
                (@alsyundawy)
              </a>
            </p>
            <p className="about-org-info">
              Alsyundawy IT Solution • Bandung, Indonesia
            </p>

            <div className="about-links-row">
              <a
                href="https://github.com/alsyundawy/SubNetCalc-Electron"
                target="_blank"
                rel="noreferrer"
                className="about-link-pill"
              >
                📦 GitHub Repository
              </a>
              <a
                href="https://github.com/alsyundawy/SubNetCalc-Electron/issues"
                target="_blank"
                rel="noreferrer"
                className="about-link-pill"
              >
                🐛 Issue Tracker
              </a>
              <a href="mailto:alsyundawy@gmail.com" className="about-link-pill">
                ✉️ alsyundawy@gmail.com
              </a>
            </div>

            <div className="about-donation-row">
              <a
                href="https://www.paypal.me/alsyundawy"
                target="_blank"
                rel="noreferrer"
                className="btn-donate paypal"
              >
                💖 Support via PayPal
              </a>
              <a
                href="https://github.com/sponsors/alsyundawy"
                target="_blank"
                rel="noreferrer"
                className="btn-donate github"
              >
                ☕ Sponsor on GitHub
              </a>
            </div>
          </section>

          {/* Upstream Heritage Card */}
          <section className="about-card-heritage">
            <div className="about-card-title">
              🍏 Upstream Heritage &amp; Attribution
            </div>
            <ul className="about-heritage-list">
              <li>
                <strong>1. Dr. Thomas Dreibholz</strong>
                {" ("}
                <a
                  href="https://github.com/dreibh/subnetcalc"
                  target="_blank"
                  rel="noreferrer"
                  className="about-link"
                >
                  dreibh/subnetcalc
                </a>
                {"): "}
                Canonical IPv4/IPv6 CLI subnet calculation algorithm, exact RFC
                property logic, and test oracle parity.
              </li>
              <li>
                <strong>2. Julien Mulot</strong>
                {" ("}
                <a
                  href="https://github.com/mulot/SubnetCalc"
                  target="_blank"
                  rel="noreferrer"
                  className="about-link"
                >
                  mulot/SubnetCalc
                </a>
                {" / "}
                <a
                  href="https://subnetcalc.mulot.org"
                  target="_blank"
                  rel="noreferrer"
                  className="about-link"
                >
                  subnetcalc.mulot.org
                </a>
                {"): "}
                Original Apple AppKit Cocoa macOS subnet calculator creator,
                pioneering interactive mask synchronization and classic GUI
                subnetting.
              </li>
              <li>
                <strong>3. Harry Dertin Sutisna Alsyundawy</strong>
                {" ("}
                <a
                  href="https://github.com/alsyundawy/SubnetCalc-MacOS"
                  target="_blank"
                  rel="noreferrer"
                  className="about-link"
                >
                  alsyundawy/SubnetCalc-MacOS
                </a>
                {"): "}
                Modernized Swift 6 Universal 2 macOS edition with 25 theme
                families, cloud profiles, and CI/CD automation.
              </li>
            </ul>
          </section>

          {/* Supported RFC Standards */}
          <section className="about-standards-footer">
            <div className="about-standards-heading">
              📜 Supported Standards &amp; RFC Compliance:
            </div>
            <p className="about-standards-text">
              RFC 791 (IPv4) • RFC 4291 (IPv6 Architecture) • RFC 4193 (Unique
              Local IPv6 ULA) • RFC 5952 (Canonical IPv6) • RFC 3021 (31-bit PtP
              Links) • RFC 1918 (Private IPv4) • RFC 6598 (Shared / CGNAT) • RFC
              4180 (Spreadsheet-Safe CSV Export).
            </p>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="about-shortcuts-row">
            <span className="shortcut-badge">
              <kbd>Enter</kbd> Calculate
            </span>
            <span className="shortcut-badge">
              <kbd>Esc</kbd> Clear / Close
            </span>
            <span className="shortcut-badge">
              <kbd>Tab</kbd> Focus
            </span>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="modal-footer-copy">
            © 2026 Harry Dertin Sutisna Alsyundawy. All rights reserved.
          </div>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
