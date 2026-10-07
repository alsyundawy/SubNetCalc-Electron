/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/PropertiesList.tsx
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

import React, { useState } from "react";
import { CalculateResult } from "@engine/types.js";

interface PropertiesListProps {
  result: CalculateResult;
  history: string[];
  onSelectHistory: (item: string) => void;
  onCopyText: () => void;
  onCopyJson: () => void;
}

export const PropertiesList: React.FC<PropertiesListProps> = ({
  result,
  history,
  onSelectHistory,
  onCopyText,
  onCopyJson,
}) => {
  const [activeTab, setActiveTab] = useState<"props" | "history">("props");
  const [copiedType, setCopiedType] = useState<"text" | "json" | null>(null);

  const handleCopy = (type: "text" | "json") => {
    if (type === "text") onCopyText();
    else onCopyJson();
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div className="properties-card">
      <div className="props-header-bar">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === "props" ? "active" : ""}`}
            onClick={() => setActiveTab("props")}
          >
            Attributes ({result.properties.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            History ({history.length})
          </button>
        </div>

        <div className="toolbar-row">
          <button
            className="btn-secondary"
            onClick={() => handleCopy("text")}
            title="Copy plain-text output formatted like CLI"
          >
            {copiedType === "text" ? "✓ Copied" : "📋 Copy"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleCopy("json")}
            title="Copy full JSON calculation data"
          >
            {copiedType === "json" ? "✓ Copied" : "{} JSON"}
          </button>
        </div>
      </div>

      <div className="props-scroll-body">
        {activeTab === "props" ? (
          <>
            {/* DNS / GeoIP Row */}
            {(result.dns || result.geo) && (
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  padding: "2px 0 6px",
                }}
              >
                {result.dns && (
                  <div
                    style={{
                      background: "rgba(14, 165, 233, 0.1)",
                      border: "1px solid rgba(14, 165, 233, 0.25)",
                      borderRadius: "4px",
                      padding: "3px 8px",
                      fontSize: "11px",
                    }}
                  >
                    <strong>DNS: </strong>
                    {result.dns.hostname || result.dns.error || "No PTR"}
                  </div>
                )}
                {result.geo && (
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "4px",
                      padding: "3px 8px",
                      fontSize: "11px",
                    }}
                  >
                    <strong>GeoIP: </strong>
                    {result.geo.country} ({result.geo.code})
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  marginBottom: "4px",
                }}
              >
                {result.warnings.map((w, idx) => (
                  <div
                    key={`warn-${idx}-${w}`}
                    style={{ fontSize: "10px", color: "var(--accent-amber)" }}
                  >
                    ℹ️ {w}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              {result.properties.map((prop) => (
                <div key={`prop-${prop.key}`} className="prop-row">
                  <span className="prop-key">{prop.key}</span>
                  <span className="prop-val">{prop.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {history.length === 0 ? (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-dim)",
                  padding: "12px 0",
                  textAlign: "center",
                }}
              >
                No calculations yet in history.
              </div>
            ) : (
              history.map((item, idx) => (
                <button
                  type="button"
                  key={`hist-${idx}-${item}`}
                  className="history-item"
                  onClick={() => onSelectHistory(item)}
                  title="Click to recalculate"
                >
                  <span className="history-input">{item}</span>
                  <span className="history-meta">↺ Load</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
