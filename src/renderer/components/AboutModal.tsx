import React from "react";

interface AboutModalProps {
  version: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  version,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">About SubNetCalc-Electron</div>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p>
            <strong>SubNetCalc-Electron</strong> is a high-precision IPv4 and IPv6 Subnet
            Calculator desktop application designed with modern engineering standards and
            an interactive user interface.
          </p>

          <p>
            <strong>Version:</strong> v{version || "1.0.0"}<br />
            <strong>License:</strong> MIT License<br />
            <strong>Engine:</strong> Pure TypeScript Calculation Engine
          </p>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <strong>Upstream Attribution:</strong>
            <p style={{ marginTop: "4px" }}>
              Inspired by the algorithmic behavior, network properties, and output format of the
              canonical <strong>SubNetCalc</strong> CLI tool authored by <strong>Dr. Thomas Dreibholz</strong>.
            </p>
            <p style={{ marginTop: "6px" }}>
              Upstream Project:{" "}
              <a
                href="https://github.com/dreibh/subnetcalc"
                target="_blank"
                rel="noreferrer"
              >
                https://github.com/dreibh/subnetcalc
              </a>
            </p>
          </div>

          <p>
            Supported Standards: RFC 791 (IPv4), RFC 4291 (IPv6 Architecture), RFC 4193
            (Unique Local IPv6), RFC 5952 (Canonical IPv6 Format), RFC 3021 (31-bit PtP Links).
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
