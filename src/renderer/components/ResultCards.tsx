import React from "react";
import { CalculateResult } from "@engine/types.js";

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
          <div className="metric-label">Usable Host Range</div>
          <div className="metric-value" style={{ fontSize: "13px" }}>
            {result.hostRange.first} — {result.hostRange.last}
          </div>
          <div className="metric-sub">First Usable to Last Usable Address</div>
        </div>
      )}
    </div>
  );
};
