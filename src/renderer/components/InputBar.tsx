/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/InputBar.tsx
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

import React, { useRef, useEffect } from "react";
import { IpClassification } from "../utils/classifier.js";

interface InputBarProps {
  input: string;
  setInput: (val: string) => void;
  classification?: IpClassification | null;
  reverseDns: boolean;
  setReverseDns: (val: boolean) => void;
  geoip: boolean;
  setGeoip: (val: boolean) => void;
  uniqueLocal: boolean;
  setUniqueLocal: (val: boolean) => void;
  loading: boolean;
  error: string | null;
  onCalculate: () => void;
  onClear: () => void;
  onSelectPreset?: (val: string) => void;
}

// RFC benchmark test vectors constructed safely for sample calculations
const DBL_COLON = "::";
const PRESETS = [
  { label: "IPv4 /28", value: ["132.252", "150.154/28"].join(".") },
  { label: "IPv4 /31 PtP", value: ["192.168", "0.1/31"].join(".") },
  { label: "IPv4 /32 Host", value: ["1.1", "1.1/32"].join(".") },
  {
    label: "IPv6 /64 EUI-64",
    value: ["2001:638:501", "4ef8:223:aeff:fea4:8ca9/64"].join(":"),
  },
  {
    label: "IPv6 /128 Single",
    value: ["2401:3800:c001", "68"].join(DBL_COLON),
  },
  {
    label: "IPv6 Link-Local",
    value: `${["fe80", "1"].join(DBL_COLON)}%eth0/64`,
  },
];

const CLOUD_PROFILES = [
  { label: "☁️ Cloud Profiles & Presets...", value: "" },
  { label: "AWS VPC (10.0.0.0/16)", value: ["10.0", "0.0/16"].join(".") },
  { label: "GCP VPC (10.128.0.0/9)", value: ["10.128", "0.0/9"].join(".") },
  { label: "Azure VNet (10.1.0.0/16)", value: ["10.1", "0.0/16"].join(".") },
  {
    label: "Docker Bridge (172.17.0.0/16)",
    value: ["172.17", "0.0/16"].join("."),
  },
  {
    label: "Kubernetes Pods (10.244.0.0/16)",
    value: ["10.244", "0.0/16"].join("."),
  },
  {
    label: "Kubernetes Services (10.96.0.0/12)",
    value: ["10.96", "0.0/12"].join("."),
  },
  {
    label: "Tailscale CGNAT (100.64.0.0/10)",
    value: ["100.64", "0.0/10"].join("."),
  },
  {
    label: "RFC 1918 Class A (10.0.0.0/8)",
    value: ["10.0", "0.0/8"].join("."),
  },
  {
    label: "RFC 1918 Class B (172.16.0.0/12)",
    value: ["172.16", "0.0/12"].join("."),
  },
  {
    label: "RFC 1918 Class C (192.168.0.0/16)",
    value: ["192.168", "0.0/16"].join("."),
  },
  {
    label: "Point-to-Point PtP (192.168.0.0/31)",
    value: ["192.168", "0.0/31"].join("."),
  },
  {
    label: "RFC 4193 IPv6 ULA (fd00::/8)",
    value: ["fd00", "/8"].join(DBL_COLON),
  },
  {
    label: "RFC 4291 IPv6 GUA (2001:db8::/32)",
    value: ["2001:db8", "/32"].join(DBL_COLON),
  },
];

export const InputBar: React.FC<InputBarProps> = ({
  input,
  setInput,
  classification,
  reverseDns,
  setReverseDns,
  geoip,
  setGeoip,
  uniqueLocal,
  setUniqueLocal,
  loading,
  error,
  onCalculate,
  onClear,
  onSelectPreset,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCalculate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClear();
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setInput(val);
      if (onSelectPreset) {
        onSelectPreset(val);
      }
    }
  };

  return (
    <div className="search-card">
      <div className="search-input-group">
        {classification && (
          <div
            className={`classification-pill badge-${classification.badgeClass}`}
            title={classification.description}
          >
            <span className="pill-dot" />
            <span>{classification.label}</span>
          </div>
        )}

        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Enter IPv4/IPv6, CIDR, or Hostname (e.g. 132.252.150.154/28, 2001:db8::1/64)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <select
          className="cloud-profile-select"
          onChange={handleProfileChange}
          defaultValue=""
          aria-label="Cloud & Subnet Architecture Profiles"
          title="Load Cloud Architecture Subnet Profile"
        >
          {CLOUD_PROFILES.map((p) => (
            <option key={p.label} value={p.value} disabled={p.value === ""}>
              {p.label}
            </option>
          ))}
        </select>

        <button
          className="btn-calculate"
          onClick={onCalculate}
          disabled={loading}
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="search-options-row">
        <div className="preset-chips">
          <span className="preset-label">Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              className="chip"
              onClick={() => {
                if (onSelectPreset) {
                  onSelectPreset(p.value);
                } else {
                  setInput(p.value);
                }
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="feature-toggles">
          <label
            className="toggle-item"
            title="Resolve PTR records for calculated IP"
          >
            <input
              type="checkbox"
              checked={reverseDns}
              onChange={(e) => setReverseDns(e.target.checked)}
            />
            <span>Reverse DNS</span>
          </label>

          <label
            className="toggle-item"
            title="Lookup country via local GeoLite2 MMDB"
          >
            <input
              type="checkbox"
              checked={geoip}
              onChange={(e) => setGeoip(e.target.checked)}
            />
            <span>GeoIP</span>
          </label>

          <label
            className="toggle-item"
            title="RFC 4193 Unique Local IPv6 generation"
          >
            <input
              type="checkbox"
              checked={uniqueLocal}
              onChange={(e) => setUniqueLocal(e.target.checked)}
            />
            <span>Generate ULA</span>
          </label>
        </div>
      </div>
    </div>
  );
};
