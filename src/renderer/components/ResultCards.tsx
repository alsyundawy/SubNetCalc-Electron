/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/ResultCards.tsx
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
 * File: src/renderer/components/ResultCards.tsx
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
 *   - SubnetCalc-MacOS Cloud Profiles Heritage (IPSubnetcalc.swift)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

import React, { useState } from "react";
import { CalculateResult, CloudProviderId } from "@engine/types.js";

interface ResultCardsProps {
  result: CalculateResult;
}

function formatHostsCount(maxHosts: string, role: string): string {
  if (role === "multicast") return "Multicast Group";
  try {
    return BigInt(maxHosts).toLocaleString();
  } catch {
    return maxHosts;
  }
}

export const ResultCards: React.FC<ResultCardsProps> = ({ result }) => {
  const [selectedCloudId, setSelectedCloudId] =
    useState<CloudProviderId>("standard");
  const [showRoles, setShowRoles] = useState(false);

  const activeCloud =
    result.cloudProfiles?.find((p) => p.id === selectedCloudId) ||
    result.cloudProfiles?.[0];

  return (
    <div className="results-grid">
      <div className="metric-card">
        <div className="metric-label">Address</div>
        <div className="metric-value">{result.address}</div>
        <div className="metric-sub">
          IPv{result.family} • Hex: {result.hex}
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Network</div>
        <div className="metric-value">
          {result.network} /{result.prefix}
        </div>
        <div className="metric-sub">CIDR Subnet Prefix</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Netmask</div>
        <div className="metric-value">{result.netmask}</div>
        <div className="metric-sub">Contiguous Subnet Mask</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Wildcard Mask</div>
        <div className="metric-value">{result.wildcard}</div>
        <div className="metric-sub">Inverted Subnet Mask</div>
      </div>

      {result.family === 4 && (
        <div className="metric-card">
          <div className="metric-label">Broadcast</div>
          <div className="metric-value">
            {result.broadcast || "None (Point-to-Point)"}
          </div>
          <div className="metric-sub">
            {result.prefix >= 31 ? "RFC 3021 / PtP Link" : "Subnet Broadcast"}
          </div>
        </div>
      )}

      <div
        className="metric-card"
        style={result.family === 6 ? { gridColumn: "span 2" } : undefined}
      >
        <div className="metric-label">Max Hosts</div>
        <div className="metric-value">
          {formatHostsCount(result.maxHosts, result.role)}
        </div>
        <div className="metric-sub">
          {result.role === "multicast"
            ? "No host allocation"
            : `${result.hostBits} Host Bits Available`}
        </div>
      </div>

      {result.hostRange && (
        <div className="metric-card" style={{ gridColumn: "span 3" }}>
          <div className="metric-label">Usable Host Range (Standard RFC)</div>
          <div className="metric-value" style={{ fontSize: "13px" }}>
            {result.hostRange.first} — {result.hostRange.last}
          </div>
          <div className="metric-sub">First Usable to Last Usable Address</div>
        </div>
      )}

      {/* Cloud Provider Reservation Profiles (Heritage from SubnetCalc-MacOS) */}
      {result.family === 4 && result.cloudProfiles && (
        <div
          className="metric-card cloud-profiles-card"
          style={{ gridColumn: "span 3" }}
        >
          <div className="cloud-profiles-header">
            <div className="metric-label">
              ☁️ Multi-Cloud Reservation Profile
            </div>
            <div className="cloud-pills-row">
              {result.cloudProfiles.map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  className={`btn-cloud-pill ${selectedCloudId === cp.id ? "active" : ""}`}
                  onClick={() => setSelectedCloudId(cp.id)}
                  title={cp.description}
                >
                  {cp.name}
                </button>
              ))}
            </div>
          </div>

          {activeCloud && (
            <div className="cloud-active-details">
              <div className="cloud-stats-grid">
                <div className="cloud-stat-item">
                  <span className="cloud-stat-label">Usable Hosts:</span>
                  <span
                    className={`cloud-stat-value ${activeCloud.isProhibited ? "prohibited" : ""}`}
                  >
                    {activeCloud.usableCount}
                  </span>
                </div>
                <div className="cloud-stat-item">
                  <span className="cloud-stat-label">Usable Range:</span>
                  <span className="cloud-stat-value font-mono">
                    {activeCloud.isProhibited
                      ? `Prohibited (Minimum /${activeCloud.minimumPrefix})`
                      : `${activeCloud.usableStart} — ${activeCloud.usableEnd}`}
                  </span>
                </div>
                <div className="cloud-stat-item">
                  <span className="cloud-stat-label">Reserved IPs:</span>
                  <span className="cloud-stat-value">
                    {activeCloud.reservedCount} Addresses
                  </span>
                </div>
              </div>

              {activeCloud.reservedRoles.length > 0 && (
                <div className="cloud-roles-accordion">
                  <button
                    type="button"
                    className="btn-toggle-roles"
                    onClick={() => setShowRoles(!showRoles)}
                  >
                    {showRoles
                      ? "▾ Hide Reserved IP Roles"
                      : "▸ Show Reserved IP Roles Breakdown"}
                  </button>
                  {showRoles && (
                    <ul className="cloud-roles-list">
                      {activeCloud.reservedRoles.map((r) => (
                        <li key={r.ip} className="cloud-role-item">
                          <code className="cloud-role-ip">{r.ip}</code>
                          <span className="cloud-role-name">{r.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
