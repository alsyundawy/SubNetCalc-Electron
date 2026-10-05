import React, { useEffect } from "react";
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

      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={appIcon}
              alt="SubNetCalc Logo"
              style={{ width: "28px", height: "28px", objectFit: "contain" }}
            />
            <div id="about-modal-title" className="modal-title">
              About SubNetCalc-Electron
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p>
            <strong>SubNetCalc-Electron</strong> is a high-precision IPv4 and
            IPv6 Subnet Calculator desktop application designed with modern
            engineering standards and an interactive user interface.
          </p>

          <p>
            <strong>Version:</strong> v{version || "1.0.0"}
            <br />
            <strong>License:</strong> MIT License
            <br />
            <strong>Engine:</strong> Pure TypeScript Calculation Engine
          </p>

          <div
            style={{
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <strong style={{ color: "var(--accent-primary, #60a5fa)" }}>
              Author &amp; Repository:
            </strong>
            <p style={{ marginTop: "4px" }}>
              Developed &amp; Maintained by:{" "}
              <strong>Harry Dertin Sutisna Alsyundawy</strong>
              {" ("}
              <a
                href="https://github.com/alsyundawy"
                target="_blank"
                rel="noreferrer"
              >
                @alsyundawy
              </a>
              {")"}
            </p>
            <p style={{ marginTop: "4px" }}>
              Contact Email:{" "}
              <a href="mailto:alsyundawy@gmail.com">alsyundawy@gmail.com</a>
            </p>
            <p style={{ marginTop: "4px" }}>
              Repository:{" "}
              <a
                href="https://github.com/alsyundawy/SubNetCalc-Electron"
                target="_blank"
                rel="noreferrer"
              >
                https://github.com/alsyundawy/SubNetCalc-Electron
              </a>
            </p>
            <p style={{ marginTop: "4px" }}>
              Issue Tracker:{" "}
              <a
                href="https://github.com/alsyundawy/SubNetCalc-Electron/issues"
                target="_blank"
                rel="noreferrer"
              >
                github.com/alsyundawy/SubNetCalc-Electron/issues
              </a>
            </p>
            <div
              style={{
                marginTop: "8px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                fontSize: "11px",
              }}
            >
              <a
                href="https://www.paypal.me/alsyundawy"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "none",
                }}
              >
                💖 Donate via PayPal
              </a>
              <a
                href="https://github.com/sponsors/alsyundawy"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "none",
                }}
              >
                ☕ Sponsor on GitHub
              </a>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <strong style={{ color: "var(--accent-primary, #60a5fa)" }}>
              Upstream Heritage &amp; Attribution:
            </strong>
            <p style={{ marginTop: "6px" }}>
              <strong>1. Dr. Thomas Dreibholz</strong>
              {" ("}
              <a
                href="https://github.com/dreibh/subnetcalc"
                target="_blank"
                rel="noreferrer"
              >
                dreibh/subnetcalc
              </a>
              {
                "): Canonical IPv4/IPv6 CLI subnet calculation engine, exact RFC property definitions, and algorithmic test oracle parity."
              }
            </p>
            <p style={{ marginTop: "6px" }}>
              <strong>2. Julien Mulot</strong>
              {" ("}
              <a
                href="https://github.com/mulot/SubnetCalc"
                target="_blank"
                rel="noreferrer"
              >
                mulot/SubnetCalc
              </a>
              {" / "}
              <a
                href="https://subnetcalc.mulot.org"
                target="_blank"
                rel="noreferrer"
              >
                subnetcalc.mulot.org
              </a>
              {
                "): Classic macOS Subnet Calculator GUI, pioneering interactive mask synchronization, FLSM, VLSM, CIDR summarization, and data exports."
              }
            </p>
          </div>

          <p style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
            Supported Standards: RFC 791 (IPv4), RFC 4291 (IPv6 Architecture),
            RFC 4193 (Unique Local IPv6), RFC 5952 (Canonical IPv6 Format), RFC
            3021 (31-bit PtP Links), RFC 1918 (Private Address Allocation), RFC
            4180 (CSV Format).
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
