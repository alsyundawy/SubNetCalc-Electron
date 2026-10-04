import React from "react";
import { CalculateResult } from "@engine/types.js";

interface BitVisualizerProps {
  result: CalculateResult;
}

export const BitVisualizer: React.FC<BitVisualizerProps> = ({ result }) => {
  const { prefix, family } = result;

  // Render individual bits with color distinction
  const renderIPv4Bits = () => {
    // 4 octets, total 32 bits
    let currentBitIndex = 0;
    const octets = result.bits.grouped; // ["10000100", ...]

    return octets.map((oct, octIndex) => {
      const bitCells = oct.split("").map((b, bIdx) => {
        const isNetwork = currentBitIndex < prefix;
        currentBitIndex++;
        return (
          <div
            key={bIdx}
            className={`bit-cell ${isNetwork ? "network" : "host"}`}
            title={`Bit ${currentBitIndex}: ${isNetwork ? "Network bit" : "Host bit"}`}
          >
            {b}
          </div>
        );
      });

      return (
        <div key={octIndex} className="bit-octet-box">
          <div className="bit-octet-label">Octet {octIndex + 1}</div>
          <div className="bit-octet-digits">{bitCells}</div>
        </div>
      );
    });
  };

  const renderIPv6Bits = () => {
    // 8 hextets, each with 16 bits
    let currentBitIndex = 0;
    // grouped: ["2001 = 00100000 00000001", ...]
    return result.bits.grouped.map((g, hIndex) => {
      const parts = g.split("=");
      const hexLabel = parts[0]?.trim() || `Hextet ${hIndex + 1}`;
      const rawBits = (parts[1]?.replace(/\s+/g, "") || "").trim();

      const cells = rawBits.split("").map((b, bIdx) => {
        const isNetwork = currentBitIndex < prefix;
        currentBitIndex++;
        return (
          <div
            key={bIdx}
            className={`bit-cell ${isNetwork ? "network" : "host"}`}
            style={{ width: "13px", height: "18px", fontSize: "10px" }}
            title={`Bit ${currentBitIndex}: ${isNetwork ? "Network bit" : "Host bit"}`}
          >
            {b}
          </div>
        );
      });

      return (
        <div key={hIndex} className="bit-octet-box" style={{ marginBottom: "6px" }}>
          <div className="bit-octet-label" style={{ fontFamily: "var(--font-mono)" }}>
            {hexLabel}
          </div>
          <div className="bit-octet-digits">{cells}</div>
        </div>
      );
    });
  };

  return (
    <div className="bit-section">
      <div className="bit-header">
        <div className="section-title">
          <span>Binary Bit Visualization</span>
          <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: "normal" }}>
            ({prefix} Network bits / {family === 4 ? 32 - prefix : 128 - prefix} Host bits)
          </span>
        </div>

        <div className="bit-legend">
          <div className="legend-item">
            <div className="legend-pill network"></div>
            <span>Network ({prefix})</span>
          </div>
          <div className="legend-item">
            <div className="legend-pill host"></div>
            <span>Host ({family === 4 ? 32 - prefix : 128 - prefix})</span>
          </div>
        </div>
      </div>

      <div className="bit-grid">
        {family === 4 ? renderIPv4Bits() : renderIPv6Bits()}
      </div>
    </div>
  );
};
