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
  const [copiedType, setCopiedType] = useState<"text" | "json" | null>(null);

  const handleCopy = (type: "text" | "json") => {
    if (type === "text") onCopyText();
    else onCopyJson();
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div className="details-split">
      <div className="properties-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="section-title">Address Properties & Attributes</div>
          <div className="toolbar-row">
            <button
              className="btn-secondary"
              onClick={() => handleCopy("text")}
              title="Copy plain-text output formatted like CLI"
            >
              {copiedType === "text" ? "✓ Copied" : "📋 Copy Text"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => handleCopy("json")}
              title="Copy full JSON calculation data"
            >
              {copiedType === "json" ? "✓ Copied" : "{} Copy JSON"}
            </button>
          </div>
        </div>

        {/* DNS / GeoIP Row */}
        {(result.dns || result.geo) && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "4px 0" }}>
            {result.dns && (
              <div
                style={{
                  background: "rgba(14, 165, 233, 0.1)",
                  border: "1px solid rgba(14, 165, 233, 0.25)",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "12px",
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
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "12px",
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
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {result.warnings.map((w, idx) => (
              <div key={idx} style={{ fontSize: "11px", color: "var(--accent-amber)" }}>
                ℹ️ {w}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          {result.properties.map((prop, idx) => (
            <div key={idx} className="prop-row">
              <span className="prop-key">{prop.key}</span>
              <span className="prop-val">{prop.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* History Panel */}
      <div className="history-card">
        <div className="section-title">
          <span>Recent History</span>
          <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: "normal" }}>
            ({history.length})
          </span>
        </div>

        {history.length === 0 ? (
          <div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "12px 0" }}>
            No calculations yet. Run a subnet calculation to see it here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {history.map((item, idx) => (
              <div
                key={idx}
                className="history-item"
                onClick={() => onSelectHistory(item)}
                title="Click to recalculate"
              >
                <span className="history-input">{item}</span>
                <span className="history-meta">↺</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
